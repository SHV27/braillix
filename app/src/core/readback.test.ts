/**
 * Can the dots be read back?
 *
 * Two kinds of test here, and the second matters more than the first.
 *
 * The first kind checks the reading against Nemeth by hand: braille written out from the published
 * code, and what it says. Ordinary correctness.
 *
 * The second kind attacks the check itself. A round-trip that always agrees proves nothing — it
 * could be a function that returns whatever it was given. So these tests break the braille on
 * purpose, one cell at a time, in the exact ways Nemeth goes wrong in practice: a missing baseline
 * indicator, a superscript written as a subscript, a numeric indicator dropped after a letter, a
 * fraction left open. Every one of them must produce a *different* reading. A guard has two failure
 * modes — accepting the false and rejecting the true — and both are tested here, on the day it
 * ships (CLAUDE.md Law 7, and the two-sided-honesty rule in ARCHITECTURE.md).
 */

import { describe, expect, it } from 'vitest';
import { readBack, readBackUnicode } from './readback';
import { dotsToMask } from './braille';

const read = (braille: string) => readBackUnicode(braille).text;

describe('reading Nemeth back as ordinary maths', () => {
  it('reads numbers, with the dropped digits Nemeth uses', () => {
    expect(read('⠼⠶')).toBe('7');
    expect(read('⠼⠂⠴⠴')).toBe('100');
    expect(read('⠼⠒⠨⠂⠲')).toBe('3.14');
    // A lakh, grouped the Indian way. The comma inside a number is dot 6.
    expect(read('⠼⠂⠠⠴⠴⠠⠴⠴⠴')).toBe('1,00,000');
  });

  it('reads the four operations and a comparison', () => {
    expect(read('⠼⠆⠬⠒⠀⠨⠅⠀⠼⠢')).toBe('2+3=5');
    expect(read('⠼⠔⠤⠲⠀⠨⠅⠀⠼⠢')).toBe('9-4=5');
    expect(read('⠼⠒⠈⠡⠲')).toBe('3×4');
    expect(read('⠼⠂⠆⠨⠌⠲')).toBe('12÷4');
  });

  it('reads a fraction, and a fraction inside a fraction', () => {
    expect(read('⠹⠂⠌⠆⠼')).toBe('(1)/(2)');
    // The outer fraction of a compound one takes the ⠠ prefix on all three of its cells.
    expect(read('⠠⠹⠹⠒⠌⠲⠼⠈⠡⠆⠠⠌⠢⠠⠼')).toBe('((3)/(4)×2)/(5)');
  });

  it('reads a radical, with and without an index', () => {
    expect(read('⠜⠔⠻')).toBe('√(9)');
    expect(read('⠣⠒⠜⠆⠶⠻')).toBe('√[3](27)');
    expect(read('⠜⠭⠘⠆⠐⠬⠽⠘⠆⠐⠻')).toBe('√(x^(2)+y^(2))');
  });

  it('reads levels, and knows a space ends a superscript', () => {
    expect(read('⠭⠘⠆⠐⠬⠒⠭')).toBe('x^(2)+3x');
    // No baseline indicator before the space — Nemeth does not need one, and neither does this.
    expect(read('⠷⠁⠬⠃⠾⠘⠆⠀⠨⠅⠀⠁⠘⠆')).toBe('(a+b)^(2)=a^(2)');
    // Below then above on the same symbol: a single indicator is a level, not a nesting.
    expect(read('⠮⠰⠴⠘⠂⠐⠭⠘⠆⠐')).toBe('∫_(0)^(1)x^(2)');
  });

  it('knows a digit straight after a letter is a subscript', () => {
    expect(read('⠭⠂⠬⠭⠆')).toBe('x_(1)+x_(2)');
    expect(read('⠇⠕⠛⠂⠴⠀⠼⠂⠴⠴')).toBe('log_(10)100');
  });

  it('reads capitals, Greek letters and the shapes', () => {
    expect(read('⠠⠁⠨⠬⠠⠃')).toBe('A∪B');
    expect(read('⠨⠏⠗⠘⠆')).toBe('πr^(2)');
    expect(read('⠫⠪⠀⠠⠁⠠⠃⠠⠉')).toBe('∠ABC');
    expect(read('⠫⠞⠀⠠⠁⠠⠃⠠⠉')).toBe('△ABC');
    expect(read('⠠⠿')).toBe('∞');
  });

  it('tells a decimal point from a greater-than, which are the same two cells', () => {
    expect(read('⠼⠒⠨⠂⠲')).toBe('3.14'); // inside a number
    expect(read('⠁⠀⠨⠂⠀⠃')).toBe('a>b'); // standing alone
    expect(read('⠭⠀⠨⠂⠱⠀⠼⠢')).toBe('x≥5'); // and with a line under it
  });

  it('reads through the switch indicators Braillix writes around maths in a sentence', () => {
    expect(read('⠸⠩⠀⠼⠆⠭⠬⠢⠀⠨⠅⠀⠼⠂⠢⠀⠸⠱')).toBe('2x+5=15');
  });

  it('reads the cells that are physically on the display, not just a string', () => {
    const cells = [dotsToMask([3, 4, 5, 6]), dotsToMask([2]), dotsToMask([3, 4, 6]), dotsToMask([2, 3])];
    expect(readBack(cells).text).toBe('1+2');
  });
});

describe('the check has teeth — every one of these must read differently', () => {
  const good = '⠭⠘⠆⠐⠬⠒⠭⠬⠆⠀⠨⠅⠀⠼⠴'; // x^2 + 3x + 2 = 0

  it('notices a missing baseline indicator', () => {
    // Without the ⠐ the superscript swallows the rest of the equation — which is exactly what a
    // braille reader's finger would do, and exactly the bug that must not pass silently.
    const broken = good.replace('⠐', '');
    expect(read(broken)).not.toBe(read(good));
    expect(read(broken)).toBe('x^(2+3x+2)=0');
  });

  it('notices a superscript written as a subscript', () => {
    expect(read('⠭⠰⠆')).toBe('x_(2)');
    expect(read('⠭⠘⠆')).toBe('x^(2)');
  });

  it('notices a numeric indicator dropped after a letter', () => {
    // ⠭⠼⠆ is "x times 2"; ⠭⠆ is "x sub 2". One cell, two different pieces of mathematics.
    expect(read('⠭⠼⠆')).toBe('x2');
    expect(read('⠭⠆')).toBe('x_(2)');
  });

  it('notices a fraction left open, and says so instead of guessing', () => {
    // The reading is still legible — a half-read expression is more use than a blank — but the gap
    // is reported, and a reported gap makes the verdict "unchecked" rather than "agrees".
    const result = readBackUnicode('⠹⠂⠌⠆');
    expect(result.unknown).toContain('unclosed fraction');
    expect(result.text).toBe('(1)/(2)');
  });

  it('notices a radical left open', () => {
    expect(readBackUnicode('⠜⠔').unknown).toContain('unclosed group');
  });

  it('notices a wrong digit', () => {
    expect(read('⠼⠆⠬⠒')).not.toBe(read('⠼⠆⠬⠲'));
  });

  it('notices a fraction opened at one level and closed at another', () => {
    // Nemeth marks the OUTER fraction of a compound one with ⠠ on all three of its cells. Opening
    // with ⠠⠹ and closing with a plain ⠼ is not a style slip — it leaves the fraction unclosed.
    const mixed = readBackUnicode('⠠⠹⠹⠒⠌⠲⠼⠈⠡⠆⠌⠢⠼');
    expect(mixed.unknown.length).toBeGreaterThan(0);
  });

  it('reports a cell it has no rule for rather than dropping it', () => {
    const result = readBackUnicode('⠭⢿⠆');
    expect(result.unknown.length).toBeGreaterThan(0);
  });
});

describe('it never falls over', () => {
  it('survives nonsense, emptiness and repetition', () => {
    for (const text of ['', '⠀⠀⠀', '⠼⠼⠼⠼', '⠻⠻⠻', '⠐⠐⠐', '⠹'.repeat(200), '⠨', '⠠', '⠣']) {
      expect(() => readBackUnicode(text), text).not.toThrow();
    }
  });

  it('always terminates, whatever it is given', () => {
    // Every branch of the reader must consume at least one cell. A rule that consumed none would
    // hang the interface rather than fail it, which is the worst failure available to us.
    const cells = Array.from({ length: 64 }, (_, mask) => String.fromCodePoint(0x2800 + mask)).join('');
    expect(() => readBackUnicode(cells + cells)).not.toThrow();
  });
});
