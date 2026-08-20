import { beforeAll, describe, expect, it } from 'vitest';
import { EMPTY, backspace, describeChord, isSixKey, keyDown, keyUp, releaseAll, writeSpace } from './sixkey';
import { diffCells, mark } from './feedback';
import { LESSONS, lessonById, totalItems } from './lessons';
import { itemKey, recordAttempt, summariseLesson, type ProgressMap } from './progress';
import { dotsToMask } from '../core/braille';
import { initSre } from '../core/sre-service';
import { translateLatex } from '../core/translate';

/* ------------------------------------------------------------------ six-key entry */

describe('six-key braille entry', () => {
  /** Press a set of keys together and release them in the given order. */
  function chord(state = EMPTY, press: string[], releaseOrder = press) {
    let next = state;
    for (const key of press) next = keyDown(next, key);
    for (const key of releaseOrder) next = keyUp(next, key);
    return next;
  }

  it('maps the Perkins home row to the six dots', () => {
    expect(chord(EMPTY, ['f']).cells).toEqual([dotsToMask([1])]);
    expect(chord(EMPTY, ['d']).cells).toEqual([dotsToMask([2])]);
    expect(chord(EMPTY, ['s']).cells).toEqual([dotsToMask([3])]);
    expect(chord(EMPTY, ['j']).cells).toEqual([dotsToMask([4])]);
    expect(chord(EMPTY, ['k']).cells).toEqual([dotsToMask([5])]);
    expect(chord(EMPTY, ['l']).cells).toEqual([dotsToMask([6])]);
  });

  it('writes one cell for a chord, not one per key', () => {
    expect(chord(EMPTY, ['f', 'd', 'k']).cells).toEqual([dotsToMask([1, 2, 5])]);
  });

  it('commits on the LAST release, however untidily the fingers lift', () => {
    // This is the whole reason the chord is accumulated rather than read on release: nobody lifts
    // three fingers simultaneously, and committing early turns one cell into three.
    const state = chord(EMPTY, ['f', 'd', 'k'], ['d', 'k', 'f']);
    expect(state.cells).toEqual([dotsToMask([1, 2, 5])]);
  });

  it('keeps a dot in the chord even after that finger has lifted', () => {
    let state = keyDown(EMPTY, 'f');
    state = keyDown(state, 'd');
    state = keyUp(state, 'f'); // one finger up, chord not finished
    expect(state.cells).toEqual([]);
    state = keyUp(state, 'd');
    expect(state.cells).toEqual([dotsToMask([1, 2])]);
  });

  it('ignores keyboard auto-repeat', () => {
    let state = keyDown(EMPTY, 'f');
    state = keyDown(state, 'f');
    state = keyDown(state, 'f');
    state = keyUp(state, 'f');
    expect(state.cells).toEqual([dotsToMask([1])]);
  });

  it('ignores keys that are not part of the layout', () => {
    expect(isSixKey('q')).toBe(false);
    expect(isSixKey('F')).toBe(true);
    expect(keyDown(EMPTY, 'q')).toBe(EMPTY);
  });

  it('is case-insensitive, because caps lock is not a braille dot', () => {
    expect(chord(EMPTY, ['F', 'D']).cells).toEqual([dotsToMask([1, 2])]);
  });

  it('writes a blank cell for space, because a space is meaningful in Nemeth', () => {
    expect(writeSpace(EMPTY).cells).toEqual([0]);
  });

  it('deletes the last cell on backspace', () => {
    const state = chord(chord(EMPTY, ['f']), ['d']);
    expect(state.cells).toHaveLength(2);
    expect(backspace(state).cells).toEqual([dotsToMask([1])]);
    expect(backspace(EMPTY).cells).toEqual([]);
  });

  it('abandons a half-pressed chord when focus is lost', () => {
    // Otherwise the next stray key-up would commit dots the student never finished writing.
    let state = keyDown(EMPTY, 'f');
    state = keyDown(state, 'd');
    state = releaseAll(state);
    state = keyUp(state, 'd');
    expect(state.cells).toEqual([]);
  });

  it('describes the chord in progress', () => {
    let state = keyDown(EMPTY, 'f');
    state = keyDown(state, 'k');
    expect(describeChord(state)).toBe('dots 1-5');
    expect(describeChord(EMPTY)).toBe('');
  });
});

/* ------------------------------------------------------------------ feedback */

describe('marking an answer', () => {
  const H = dotsToMask([1, 2, 5]); // h
  const G = dotsToMask([1, 2, 4, 5]); // g

  it('accepts a correct answer', () => {
    const verdict = mark([H], [H]);
    expect(verdict.correct).toBe(true);
    expect(verdict.firstWrongCell).toBeNull();
  });

  it('names the extra dot, not just "wrong"', () => {
    const verdict = mark([H], [G]);
    expect(verdict.correct).toBe(false);
    expect(verdict.details.join(' ')).toContain('dot 4');
    expect(verdict.details.join(' ')).toContain('should not be there');
  });

  it('names a missing dot', () => {
    const verdict = mark([G], [H]);
    expect(verdict.details.join(' ')).toContain('dot 4 is missing');
  });

  it('says what the cell the student wrote actually means', () => {
    const verdict = mark([H], [G]);
    expect(verdict.details.join(' ')).toContain('letter g');
    expect(verdict.details.join(' ')).toContain('letter h');
  });

  it('points at an unfinished answer rather than marking dots', () => {
    const verdict = mark([H, G], [H]);
    expect(verdict.headline).toBe('Not finished yet.');
    expect(verdict.details.join(' ')).toContain('2 cells long; you wrote 1');
  });

  it('notices an answer that is too long', () => {
    const verdict = mark([H], [H, G]);
    expect(verdict.headline).toContain('too many');
  });

  it('reports the first wrong cell so the display can point at it', () => {
    expect(mark([H, H, H], [H, G, H]).firstWrongCell).toBe(1);
  });

  it('counts every differing cell, not only the first', () => {
    const verdict = mark([H, H, H], [G, G, G]);
    expect(verdict.headline).toContain('3 cells are wrong');
  });

  it('says nothing useless when nothing has been written', () => {
    expect(mark([H], []).headline).toBe('Nothing written yet.');
  });

  it('diffCells reports position, extra and missing dots', () => {
    const diffs = diffCells([H], [G]);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ index: 0, extraDots: [4], missingDots: [] });
  });
});

/* ------------------------------------------------------------------ lessons */

describe('the lessons', () => {
  beforeAll(async () => {
    const status = await initSre();
    expect(status.ok).toBe(true);
  }, 60_000);

  it('covers at least the eight areas the arc plan required', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(8);
    expect(totalItems()).toBeGreaterThanOrEqual(25);
  });

  it('has unique ids and can look them up', () => {
    const ids = LESSONS.map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(lessonById('digits')?.title).toBe('The dropped numbers');
    expect(lessonById('nope')).toBeUndefined();
  });

  it('gives every lesson a rule and every item a specific hint', () => {
    for (const lesson of LESSONS) {
      expect(lesson.rule.length, lesson.id).toBeGreaterThan(40);
      expect(lesson.teaches.length, lesson.id).toBeGreaterThan(10);
      for (const item of lesson.items) {
        expect(item.hint.length, `${lesson.id}: ${item.latex}`).toBeGreaterThan(15);
      }
    }
  });

  it('every single item actually translates to braille', async () => {
    // A lesson whose item does not translate would present a student with a blank display and no
    // explanation. This is the test that stops that reaching anybody.
    for (const lesson of LESSONS) {
      for (const item of lesson.items) {
        const translated = await translateLatex(item.latex);
        expect(translated.issues.filter((i) => i.kind === 'parse'), `${lesson.id}: ${item.latex}`).toEqual([]);
        expect(translated.cells.length, `${lesson.id}: ${item.latex}`).toBeGreaterThan(0);
      }
    }
  });

  it('teaches the digits before anything that uses them', () => {
    const order = LESSONS.map((lesson) => lesson.id);
    expect(order.indexOf('digits')).toBeLessThan(order.indexOf('fractions'));
    expect(order.indexOf('digits')).toBeLessThan(order.indexOf('numeric-indicator'));
    expect(order.indexOf('together')).toBe(LESSONS.length - 1);
  });
});

/* ------------------------------------------------------------------ progress */

describe('progress', () => {
  it('records attempts and successes separately', () => {
    let progress: ProgressMap = {};
    progress = recordAttempt(progress, itemKey('digits', 0), false, 1000);
    progress = recordAttempt(progress, itemKey('digits', 0), true, 2000);
    expect(progress[itemKey('digits', 0)]).toEqual({ attempts: 2, correct: 1, lastSeen: 2000 });
  });

  it('summarises a lesson by items answered correctly at least once', () => {
    let progress: ProgressMap = {};
    progress = recordAttempt(progress, itemKey('digits', 0), true, 1);
    progress = recordAttempt(progress, itemKey('digits', 1), false, 2);
    const summary = summariseLesson(progress, 'digits', 6);
    expect(summary).toEqual({ attempted: 2, correct: 1, total: 6 });
  });

  it('treats an untouched lesson as empty rather than failing', () => {
    expect(summariseLesson({}, 'digits', 6)).toEqual({ attempted: 0, correct: 0, total: 6 });
  });
});
