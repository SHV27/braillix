/**
 * Words and mathematics on one strip of cells.
 *
 * The thing an Indian maths classroom actually reads is not an expression — it is a question:
 *
 *     दो संख्याओं का योग 12 है
 *     Find the value of 2x + 5 = 15
 *
 * Half of that line is language and half is mathematics, and they are written in **different
 * braille codes**. Nemeth cannot spell "संख्याओं"; Bharati cannot express a fraction. So this file
 * cuts the line into segments, sends each to the right translator, and marks the boundary the way
 * a braille reader expects to see it.
 *
 * THREE RULES THAT KEEP IT HONEST:
 *
 *  1. **Nothing is guessed silently.** Every segment is shown on screen with the code it is written
 *     in, and the teacher can flip any segment between "words" and "maths" with one click. The
 *     splitter is a good first guess, not an authority.
 *  2. **The boundary is written into the braille.** Maths inside text opens with the Nemeth Code
 *     indicator ⠸⠩ and closes with the terminator ⠸⠱ (BANA, *Guidance for Transcription Using the
 *     Nemeth Code within UEB Contexts*). A reader must be told the code changed; guessing from
 *     context is exactly what these indicators exist to prevent.
 *  3. **A pure maths line is untouched.** If every segment is mathematics — which is every
 *     expression the rest of Braillix has ever handled — this file returns the same cells the
 *     Nemeth pipeline would have produced on its own, with no indicators and no segmentation.
 */

import { BLANK, dotsToMask, type DotMask } from './braille';
import { devanagariToBraille, hasDevanagari } from './bharati';
import { textToLiteralBraille } from './literal';
import { isMathWord, toLatex } from './mathinput';
import { translateLatex, type TranslationIssue } from './translate';

/** Which braille code a run of cells is written in. Always shown; never inferred by the reader. */
export type BrailleCode = 'nemeth' | 'bharati' | 'literary';

export type SegmentKind = 'maths' | 'text';

export interface Segment {
  readonly kind: SegmentKind;
  readonly text: string;
}

export interface RenderedSegment extends Segment {
  readonly code: BrailleCode;
  readonly cells: readonly DotMask[];
  /** The LaTeX a maths segment became. Empty for text. Shown in the print preview. */
  readonly latex: string;
  readonly issues: readonly TranslationIssue[];
}

export interface MixedLine {
  readonly segments: readonly RenderedSegment[];
  /** Every segment's cells, in order, separated by blanks, with the switch indicators in place. */
  readonly cells: readonly DotMask[];
  /** True when the line contains words as well as maths — the only case that needs indicators. */
  readonly mixed: boolean;
}

/** BANA's opening Nemeth Code indicator: dots 4-5-6, then dots 1-4-6. */
export const NEMETH_OPEN: readonly DotMask[] = [dotsToMask([4, 5, 6]), dotsToMask([1, 4, 6])];
/** BANA's Nemeth Code terminator: dots 4-5-6, then dots 1-5-6. */
export const NEMETH_CLOSE: readonly DotMask[] = [dotsToMask([4, 5, 6]), dotsToMask([1, 5, 6])];

/** Characters that make a token mathematics whatever else it contains. */
const MATHS_CHARS = /[0-9+\-*/^=<>()[\]{}|%°₹\\÷×±≤≥≠≈∞√]/;

/**
 * Is this whitespace-delimited token part of the mathematics?
 *
 * Single letters are variables (`x`), runs of letters are words unless the maths vocabulary claims
 * them (`sin`, `theta`, `Rs`). Devanagari is never maths: Nemeth has no cells for it.
 */
function tokenIsMaths(token: string): boolean {
  const bare = token.replace(/[.,;:!?।]+$/, '');
  if (!bare) return false;
  if (hasDevanagari(bare)) return false;
  if (MATHS_CHARS.test(bare)) return true;
  if (/^[A-Za-z]$/.test(bare)) return true;
  return isMathWord(bare);
}

/**
 * Cut a line into segments of words and mathematics.
 *
 * `overrides` maps a segment's exact text to the kind the teacher chose for it, so a correction
 * survives further typing elsewhere in the line. Keying by text rather than by position is the
 * difference between a fix that sticks and one that jumps to another word when you add a comma.
 */
export function splitLine(line: string, overrides: Readonly<Record<string, SegmentKind>> = {}): Segment[] {
  const tokens = line.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const kinds = tokens.map((token) => (tokenIsMaths(token) ? 'maths' : 'text') as SegmentKind);

  // A lone maths token between two words is almost always a word: "sum", "in", "to" and "by" are
  // all in the maths vocabulary and all ordinary English. Anything containing a digit or an
  // operator keeps its claim — "of 12 is" must not swallow the 12.
  for (let i = 1; i < kinds.length - 1; i += 1) {
    if (kinds[i] === 'maths' && kinds[i - 1] === 'text' && kinds[i + 1] === 'text' && !MATHS_CHARS.test(tokens[i])) {
      kinds[i] = 'text';
    }
  }

  const segments: Segment[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const previous = segments[segments.length - 1];
    if (previous && previous.kind === kinds[i]) {
      segments[segments.length - 1] = { kind: previous.kind, text: `${previous.text} ${tokens[i]}` };
    } else {
      segments.push({ kind: kinds[i], text: tokens[i] });
    }
  }

  // Apply the teacher's corrections, then merge again — flipping a segment may join it to a
  // neighbour, and two adjacent segments of the same kind would otherwise render a stray boundary.
  const corrected = segments.map((segment) => ({ ...segment, kind: overrides[segment.text] ?? segment.kind }));
  const merged: Segment[] = [];
  for (const segment of corrected) {
    const previous = merged[merged.length - 1];
    if (previous && previous.kind === segment.kind) {
      merged[merged.length - 1] = { kind: segment.kind, text: `${previous.text} ${segment.text}` };
    } else {
      merged.push(segment);
    }
  }
  return merged;
}

async function renderSegment(segment: Segment, standalone: boolean): Promise<RenderedSegment> {
  if (segment.kind === 'maths') {
    const parsed = toLatex(segment.text);
    const translation = await translateLatex(parsed.latex);
    const issues = [
      ...parsed.issues.map((issue) => ({ kind: 'parse' as const, message: issue.message, fix: issue.fix })),
      ...translation.issues,
    ];
    const body = translation.cells;
    return {
      ...segment,
      code: 'nemeth',
      latex: parsed.latex,
      // A maths line on its own needs no indicators; maths inside a sentence does.
      cells: standalone ? body : [...NEMETH_OPEN, BLANK, ...body, BLANK, ...NEMETH_CLOSE],
      issues,
    };
  }

  if (hasDevanagari(segment.text)) {
    const result = devanagariToBraille(segment.text);
    return {
      ...segment,
      code: 'bharati',
      latex: '',
      cells: result.cells,
      issues: result.unsupported.length
        ? [
            {
              kind: 'unknown-character' as const,
              message: `No Bharati cell for: ${[...new Set(result.unsupported)].join(' ')}`,
              fix: 'They were skipped. Tell us the character and it can be added to the table.',
            },
          ]
        : [],
    };
  }

  const result = textToLiteralBraille(segment.text);
  return {
    ...segment,
    code: 'literary',
    latex: '',
    cells: result.cells,
    issues: result.unsupported.length
      ? [
          {
            kind: 'unknown-character' as const,
            message: `No braille cell for: ${[...new Set(result.unsupported)].join(' ')}`,
            fix: 'They were skipped.',
          },
        ]
      : [],
  };
}

/**
 * Translate a whole line of words and maths.
 *
 * Never throws: a segment that fails contributes its issue and no cells, and the rest of the line
 * still reaches the display (CLAUDE.md Law 4).
 */
export async function translateMixed(
  line: string,
  overrides: Readonly<Record<string, SegmentKind>> = {},
): Promise<MixedLine> {
  const segments = splitLine(line, overrides);
  const mixed = segments.some((segment) => segment.kind === 'text') && segments.some((s) => s.kind === 'maths');
  const standalone = !mixed;

  const rendered = await Promise.all(segments.map((segment) => renderSegment(segment, standalone)));

  const cells: DotMask[] = [];
  for (const [index, segment] of rendered.entries()) {
    if (index > 0) cells.push(BLANK);
    cells.push(...segment.cells);
  }

  return { segments: rendered, cells, mixed };
}

/** Does this line contain anything that is not mathematics? Cheap check, no translation. */
export function hasWords(line: string): boolean {
  return splitLine(line).some((segment) => segment.kind === 'text');
}
