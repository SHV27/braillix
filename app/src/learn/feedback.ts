/**
 * Marking an answer, and saying something useful about it.
 *
 * The boardroom's condition on the whole practice loop was that feedback must name the exact cell
 * and the exact indicator that was missed — never just "wrong". A student who wrote dots 1-2-4-5
 * instead of 1-2-5 does not need to be told they failed; they need to be told they added dot 4,
 * and that the cell they wrote means "g" rather than "h".
 */

import { NEMETH_MEANINGS } from '../core/nemeth-meanings';
import { describeMask, maskToDots, type DotMask } from '../core/braille';

export interface CellDiff {
  readonly index: number;
  readonly expected: DotMask;
  readonly given: DotMask | null;
  readonly extraDots: number[];
  readonly missingDots: number[];
}

export interface Verdict {
  readonly correct: boolean;
  /** One sentence to lead with. */
  readonly headline: string;
  /** Specific, actionable observations — the part that actually teaches. */
  readonly details: readonly string[];
  /** The first cell that differs, or null when the answer is right. */
  readonly firstWrongCell: number | null;
}

/** Compare two cell runs, position by position. */
export function diffCells(expected: readonly DotMask[], given: readonly DotMask[]): CellDiff[] {
  const diffs: CellDiff[] = [];
  const length = Math.max(expected.length, given.length);

  for (let i = 0; i < length; i += 1) {
    const want = expected[i];
    const got = given[i];
    if (want === got) continue;

    if (want === undefined) {
      diffs.push({ index: i, expected: 0, given: got ?? null, extraDots: maskToDots(got ?? 0), missingDots: [] });
      continue;
    }

    const gotMask = got ?? 0;
    diffs.push({
      index: i,
      expected: want,
      given: got ?? null,
      extraDots: maskToDots(gotMask & ~want),
      missingDots: maskToDots(want & ~gotMask),
    });
  }

  return diffs;
}

function meaningOf(mask: DotMask): string {
  const meaning = NEMETH_MEANINGS[mask];
  return meaning ? ` — ${meaning}` : '';
}

/** Mark an answer and explain it. */
export function mark(expected: readonly DotMask[], given: readonly DotMask[]): Verdict {
  if (given.length === 0) {
    return { correct: false, headline: 'Nothing written yet.', details: [], firstWrongCell: null };
  }

  const diffs = diffCells(expected, given);

  if (diffs.length === 0) {
    return {
      correct: true,
      headline: given.length === 1 ? 'Correct.' : `Correct — all ${given.length} cells.`,
      details: [],
      firstWrongCell: null,
    };
  }

  const first = diffs[0];
  const details: string[] = [];

  // Length problems first: they explain everything downstream, so leading with a dot difference
  // would send the student hunting for the wrong thing.
  if (given.length < expected.length && first.given === null) {
    details.push(
      `The answer is ${expected.length} cells long; you wrote ${given.length}. The next one is ${describeMask(first.expected)}${meaningOf(first.expected)}.`,
    );
    return {
      correct: false,
      headline: 'Not finished yet.',
      details,
      firstWrongCell: first.index,
    };
  }

  if (given.length > expected.length && first.expected === 0 && first.missingDots.length === 0) {
    details.push(`The answer is ${expected.length} cells long; you wrote ${given.length}.`);
    return { correct: false, headline: 'One cell too many.', details, firstWrongCell: first.index };
  }

  const position = `Cell ${first.index + 1}`;
  if (first.extraDots.length > 0) {
    details.push(`${position}: you raised dot ${first.extraDots.join(' and ')} that should not be there.`);
  }
  if (first.missingDots.length > 0) {
    details.push(`${position}: dot ${first.missingDots.join(' and ')} is missing.`);
  }

  details.push(
    `You wrote ${describeMask(first.given ?? 0)}${meaningOf(first.given ?? 0)}; it should be ${describeMask(first.expected)}${meaningOf(first.expected)}.`,
  );

  if (diffs.length > 1) {
    details.push(`${diffs.length - 1} more cell${diffs.length === 2 ? '' : 's'} after that also differ.`);
  }

  return {
    correct: false,
    headline: diffs.length === 1 ? 'Almost — one cell is wrong.' : `${diffs.length} cells are wrong.`,
    details,
    firstWrongCell: first.index,
  };
}

/**
 * Mark a *typed* answer for a reading drill.
 *
 * The comparison is done on braille, not on text, so `1/2`, `\frac12` and `\frac{1}{2}` are all
 * accepted: what is being tested is whether the student read the dots, not whether they can type
 * LaTeX the way we happened to write it.
 */
export function markReading(expectedCells: readonly DotMask[], answerCells: readonly DotMask[]): Verdict {
  const verdict = mark(expectedCells, answerCells);
  if (verdict.correct) return verdict;
  return {
    ...verdict,
    details: [...verdict.details, 'Anything that means the same maths is accepted — spacing and style are not marked.'],
  };
}
