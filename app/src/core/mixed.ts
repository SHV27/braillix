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

/** A token made only of operators — `+`, `=`, `<=`. What binds two things into one expression. */
const OPERATOR_ONLY = /^[+\-*/^_=<>:|×÷±≤≥≠≈]+$/;

/**
 * How confidently a token belongs to the mathematics.
 *
 * Three states rather than two, because two is not enough. "ab" in `ab + bc` is algebra; "of" in
 * "the value of 2x" is English; both are two letters and neither can be judged alone. So they are
 * `weak`, and the pass below decides them by what is next to them.
 */
type Strength = 'maths' | 'text' | 'weak';

function strengthOf(token: string): Strength {
  const bare = token.replace(/[.,;:!?।]+$/, '');
  if (!bare) return 'weak'; // a lone punctuation mark: the colon in "2 : 3", a stray dash
  if (hasDevanagari(bare)) return 'text'; // Nemeth has no cells for it, so it is never maths
  if (MATHS_CHARS.test(bare)) return 'maths';
  if (/^[A-Za-z]$/.test(bare)) return 'maths'; // a single letter is a variable
  if (/^[A-Z]{2,}$/.test(bare)) return 'maths'; // ABC — a geometry label, not a word
  if (isMathWord(bare)) return 'maths'; // sin, theta, Rs
  if (/^[A-Za-z]{2}$/.test(bare)) return 'weak'; // ab, or of
  return 'text';
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

  const strength = tokens.map(strengthOf);
  const isOperator = tokens.map((token) => OPERATOR_ONLY.test(token));

  // PASS 1 — decide the undecided by their neighbours. An operator on either side makes a token
  // part of an expression ("ab + bc"); otherwise it is a word ("the value of 2x"). A lone
  // punctuation mark between two pieces of maths belongs to the maths ("2 : 3").
  const kinds: SegmentKind[] = strength.map((value, i) => {
    if (value !== 'weak') return value;
    if (isOperator[i - 1] || isOperator[i + 1]) return 'maths';
    if (strength[i - 1] === 'maths' && strength[i + 1] === 'maths') return 'maths';
    return 'text';
  });

  // PASS 2 — a run of maths that contains no digit and no operator, with words on BOTH sides, is
  // a phrase: "The sum of the two numbers" is English, even though "sum" is an operator's name.
  // Words on only one side is not enough — "Find the value of x" ends in maths, and should.
  for (let start = 0; start < kinds.length; start += 1) {
    if (kinds[start] !== 'maths') continue;
    let end = start;
    while (end + 1 < kinds.length && kinds[end + 1] === 'maths') end += 1;
    const symbolic = tokens.slice(start, end + 1).some((token) => MATHS_CHARS.test(token));
    const between = start > 0 && end < kinds.length - 1 && kinds[start - 1] === 'text' && kinds[end + 1] === 'text';
    if (!symbolic && between) {
      for (let i = start; i <= end; i += 1) kinds[i] = 'text';
    }
    start = end;
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
