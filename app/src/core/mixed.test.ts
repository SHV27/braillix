/**
 * Words and maths on one line.
 *
 * The tests that matter most here are the two "must not change" ones: a pure maths line has to come
 * out byte-identical to what the Nemeth pipeline produced before this file existed, and a pure text
 * line must never acquire a maths indicator. Everything Braillix already did has to keep working
 * exactly as it did, or this feature is a regression wearing a feature's clothes.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { NEMETH_CLOSE, NEMETH_OPEN, hasWords, splitLine, translateMixed } from './mixed';
import { cellsToUnicode, translateLatex } from './translate';
import { initSre } from './sre-service';
import { toLatex } from './mathinput';

beforeAll(async () => {
  const status = await initSre();
  expect(status.ok, `speech-rule-engine failed to start: ${status.reason ?? ''}`).toBe(true);
}, 60_000);

describe('splitting a line into words and maths', () => {
  it('calls a pure expression maths, all of it', () => {
    expect(splitLine('x^2 + 3x + 2 = 0')).toEqual([{ kind: 'maths', text: 'x^2 + 3x + 2 = 0' }]);
    expect(hasWords('x^2 + 3x + 2 = 0')).toBe(false);
  });

  it('keeps the maths vocabulary out of the sentence', () => {
    // "theta" and "sin" are maths; without this the identity would be cut into four pieces.
    expect(splitLine('sin^2 theta + cos^2 theta = 1')).toHaveLength(1);
    expect(hasWords('pi r^2')).toBe(false);
  });

  it('finds the maths inside an English question', () => {
    const segments = splitLine('Find the value of 2x + 5 = 15');
    expect(segments).toEqual([
      { kind: 'text', text: 'Find the value of' },
      { kind: 'maths', text: '2x + 5 = 15' },
    ]);
  });

  it('finds the maths inside a Hindi question', () => {
    const segments = splitLine('दो संख्याओं का योग 12 है');
    expect(segments.map((segment) => segment.kind)).toEqual(['text', 'maths', 'text']);
    expect(segments[1].text).toBe('12');
  });

  it('does not let an English word that is also a maths word split a sentence', () => {
    // "sum", "in", "to" and "by" are all in the maths vocabulary and all ordinary English.
    expect(splitLine('The sum of the two numbers')).toHaveLength(1);
    expect(splitLine('Write the answer in the box')).toHaveLength(1);
  });

  it('lets the teacher overrule it, and remembers by what was written', () => {
    const segments = splitLine('Find the value of 2x + 5 = 15', { 'Find the value of': 'maths' });
    // Flipping the words to maths merges the whole line into one maths segment.
    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe('maths');
  });

  it('handles the empty line', () => {
    expect(splitLine('')).toEqual([]);
    expect(splitLine('   ')).toEqual([]);
  });
});

describe('translating a mixed line', () => {
  it('leaves a pure maths line exactly as the Nemeth pipeline had it', async () => {
    for (const line of ['x^2 + 3x + 2 = 0', '1/2', 'sqrt(144) = 12', 'sin^2 theta + cos^2 theta = 1']) {
      const mixed = await translateMixed(line);
      const direct = await translateLatex(toLatex(line).latex);
      expect(cellsToUnicode(mixed.cells), line).toBe(cellsToUnicode(direct.cells));
      expect(mixed.mixed, line).toBe(false);
    }
  });

  it('writes Hindi in Bharati and the maths in Nemeth, on one strip of cells', async () => {
    const line = await translateMixed('दो संख्याओं का योग 12 है');
    expect(line.mixed).toBe(true);
    expect(line.segments.map((segment) => segment.code)).toEqual(['bharati', 'nemeth', 'bharati']);

    const text = cellsToUnicode(line.cells);
    expect(text).toContain('⠙⠕'); // दो, in Bharati
    expect(text).toContain('⠼⠂⠆'); // 12, in Nemeth — dropped digits, not literary ones
  });

  it('marks where the code changes, both ways', async () => {
    const line = await translateMixed('Find the value of 2x + 5 = 15');
    const text = cellsToUnicode(line.cells);
    expect(text, 'the Nemeth opening indicator').toContain(cellsToUnicode(NEMETH_OPEN));
    expect(text, 'the Nemeth terminator').toContain(cellsToUnicode(NEMETH_CLOSE));
  });

  it('does not mark anything on a line that never changes code', async () => {
    const pure = await translateMixed('2x + 5 = 15');
    expect(cellsToUnicode(pure.cells)).not.toContain(cellsToUnicode(NEMETH_OPEN));

    const words = await translateMixed('दो सेब');
    expect(cellsToUnicode(words.cells)).not.toContain(cellsToUnicode(NEMETH_OPEN));
    expect(words.mixed).toBe(false);
  });

  it('writes English words in literary braille, not in Nemeth', async () => {
    const line = await translateMixed('Add 2 and 3');
    const first = line.segments[0];
    expect(first.code).toBe('literary');
    // Literary "Add" is capital sign, a, d, d.
    expect(cellsToUnicode(first.cells)).toBe('⠠⠁⠙⠙');
  });

  it('reports a character it cannot write, and still renders the rest', async () => {
    const line = await translateMixed('क ௵ की संख्या');
    const issues = line.segments.flatMap((segment) => segment.issues);
    expect(issues.some((issue) => issue.message.includes('௵'))).toBe(true);
    expect(line.cells.length).toBeGreaterThan(3);
  });

  it('never throws, whatever it is handed', async () => {
    for (const line of ['', '   ', '?????', '\\frac{1}{', 'क ्', '1/0', '।।।']) {
      await expect(translateMixed(line), line).resolves.toBeTruthy();
    }
  });
});
