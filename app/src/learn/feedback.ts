/**
 * Marking an answer, and saying something useful about it.
 *
 * The boardroom's condition on the whole practice loop was that feedback must name the exact cell
 * and the exact indicator that was missed — never just "wrong". A student who wrote dots 1-2-4-5
 * instead of 1-2-5 does not need to be told they failed; they need to be told they added dot 4,
 * and that the cell they wrote means "g" rather than "h".
 *
 * It returns *keys and numbers*, not sentences. The moment a student can be marked in Hindi, a
 * module that builds English prose is a module that has to be rewritten — so the words live in the
 * translation table and this file stays a pure comparison, which is also what makes it testable
 * without a language.
 */

import { NEMETH_MEANINGS } from '../core/nemeth-meanings';
import { describeMask, maskToDots, type DotMask } from '../core/braille';
import type { StringKey } from '../ui/i18n';

/** One thing to say, as a key and its numbers. The interface turns it into a sentence. */
export interface VerdictNote {
  readonly key: StringKey;
  readonly vars?: Record<string, string | number>;
}

export interface CellDiff {
  readonly index: number;
  readonly expected: DotMask;
  readonly given: DotMask | null;
  readonly extraDots: number[];
  readonly missingDots: number[];
}

export interface Verdict {
  readonly correct: boolean;
  /** The one thing to lead with. */
  readonly headline: VerdictNote;
  /** Specific, actionable observations — the part that actually teaches. */
  readonly details: readonly VerdictNote[];
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
    return { correct: false, headline: { key: 'fb.nothing' }, details: [], firstWrongCell: null };
  }

  const diffs = diffCells(expected, given);

  if (diffs.length === 0) {
    return {
      correct: true,
      headline: given.length === 1 ? { key: 'fb.correct' } : { key: 'fb.correctAll', vars: { count: given.length } },
      details: [],
      firstWrongCell: null,
    };
  }

  const first = diffs[0];
  const details: VerdictNote[] = [];

  // Length problems first: they explain everything downstream, so leading with a dot difference
  // would send the student hunting for the wrong thing.
  if (given.length < expected.length && first.given === null) {
    details.push({
      key: 'fb.lengthNext',
      vars: {
        expected: expected.length,
        given: given.length,
        cell: `${describeMask(first.expected)}${meaningOf(first.expected)}`,
      },
    });
    return { correct: false, headline: { key: 'fb.notFinished' }, details, firstWrongCell: first.index };
  }

  if (given.length > expected.length && first.expected === 0 && first.missingDots.length === 0) {
    details.push({ key: 'fb.lengthOnly', vars: { expected: expected.length, given: given.length } });
    return { correct: false, headline: { key: 'fb.tooLong' }, details, firstWrongCell: first.index };
  }

  const index = first.index + 1;
  if (first.extraDots.length > 0) {
    details.push({ key: 'fb.extraDots', vars: { index, dots: first.extraDots.join(', ') } });
  }
  if (first.missingDots.length > 0) {
    details.push({ key: 'fb.missingDots', vars: { index, dots: first.missingDots.join(', ') } });
  }

  details.push({
    key: 'fb.youWrote',
    vars: {
      given: `${describeMask(first.given ?? 0)}${meaningOf(first.given ?? 0)}`,
      expected: `${describeMask(first.expected)}${meaningOf(first.expected)}`,
    },
  });

  if (diffs.length === 2) details.push({ key: 'fb.moreDifferOne' });
  else if (diffs.length > 2) details.push({ key: 'fb.moreDiffer', vars: { count: diffs.length - 1 } });

  return {
    correct: false,
    headline: diffs.length === 1 ? { key: 'fb.almost' } : { key: 'fb.manyWrong', vars: { count: diffs.length } },
    details,
    firstWrongCell: first.index,
  };
}

