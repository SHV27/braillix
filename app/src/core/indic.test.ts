/**
 * Nine scripts, one braille.
 *
 * The claim this file defends is the founding claim of Bharati Braille: the corresponding letter in
 * every Indian script is the *same cell*. If that is true, supporting nine scripts is one table and
 * some arithmetic. If it is false anywhere, a child reads the wrong letter — so the tests below
 * check the arithmetic against letters whose correspondence is not in doubt, and check that
 * anything outside the correspondence is *reported* rather than quietly turned into a neighbour.
 */

import { describe, expect, it } from 'vitest';
import { detectScript, endonymOf, hasIndic, scriptOf, toDevanagari } from './indic';
import { devanagariToBraille, indicToBraille } from './bharati';
import { cellsToUnicode } from './translate';

const braille = (text: string) => cellsToUnicode(indicToBraille(text).cells);

describe('the nine blocks are parallel', () => {
  it('maps the same letter in every script to the same Devanagari letter', () => {
    // ka, ma, ra, sa, ha — five consonants every one of these scripts has.
    const rows: [string, string[]][] = [
      ['क', ['ক', 'ਕ', 'ક', 'କ', 'க', 'క', 'ಕ', 'ക']],
      ['म', ['ম', 'ਮ', 'મ', 'ମ', 'ம', 'మ', 'ಮ', 'മ']],
      ['र', ['র', 'ਰ', 'ર', 'ର', 'ர', 'ర', 'ರ', 'ര']],
      ['स', ['স', 'ਸ', 'સ', 'ସ', 'ஸ', 'స', 'ಸ', 'സ']],
      ['ह', ['হ', 'ਹ', 'હ', 'ହ', 'ஹ', 'హ', 'ಹ', 'ഹ']],
    ];
    for (const [devanagari, others] of rows) {
      for (const other of others) {
        expect(toDevanagari(other), `${other} should be ${devanagari}`).toBe(devanagari);
      }
    }
  });

  it('gives the same braille cell for the same letter in every script', () => {
    const ka = braille('क');
    expect(ka).toBe('⠅');
    for (const other of ['ক', 'ਕ', 'ક', 'କ', 'க', 'క', 'ಕ', 'ക']) {
      expect(braille(other), other).toBe(ka);
    }
  });

  it('leaves everything that is not an Indian script alone', () => {
    expect(toDevanagari('12 + x = y')).toBe('12 + x = y');
    expect(toDevanagari('')).toBe('');
  });

  it('composes a vowel sign before mapping it', () => {
    // Bengali ো written as ে + া is one vowel, not two. Decomposed it would read "e" then "aa".
    const composed = 'কো';
    const decomposed = 'ক' + 'ে' + 'া';
    expect(braille(decomposed)).toBe(braille(composed));
    expect(braille(composed)).toBe(braille('को')); // ka, then the letter o
  });
});

describe('reading real words', () => {
  it('reads Bengali', () => {
    // গণিত — "ganit", mathematics. Same cells as the Devanagari गणित.
    expect(braille('গণিত')).toBe(braille('गणित'));
    expect(braille('গণিত')).toBe('⠛⠼⠊⠞');
  });

  it('reads Gurmukhi, Gujarati, Oriya, Telugu, Kannada and Malayalam', () => {
    const expected = braille('गणित');
    expect(braille('ਗਣਿਤ')).toBe(expected);
    expect(braille('ગણિત')).toBe(expected);
    expect(braille('ଗଣିତ')).toBe(expected);
    expect(braille('గణిత')).toBe(expected);
    expect(braille('ಗಣಿತ')).toBe(expected);
    expect(braille('ഗണിത')).toBe(expected);
  });

  it('reads the Tamil letters no other script has', () => {
    // ன ற ழ are single Devanagari code points that NFC does not take apart, so they need their own
    // entries. Without them, most of Tamil would be reported as unsupported.
    for (const letter of ['ன', 'ற', 'ழ', 'ள']) {
      const result = indicToBraille(letter);
      expect(result.unsupported, `${letter} should have a cell`).toEqual([]);
      expect(result.cells.length).toBeGreaterThan(0);
    }
    expect(braille('தமிழ்')).toBe('⠞⠍⠊⠐⠷⠈'); // ta, ma, i, (nukta) lla, halant
  });

  it('reads the digits of each script as digits', () => {
    const twelve = braille('१२');
    for (const digits of ['১২', '੧੨', '૧૨', '୧୨', '௧௨', '౧౨', '೧೨', '൧൨']) {
      expect(braille(digits), digits).toBe(twelve);
    }
    expect(twelve).toBe('⠼⠁⠃');
  });
});

describe('what it will not guess at', () => {
  it('reports a letter that has no equivalent instead of rendering a neighbour', () => {
    // Bengali khanda ta and Gurmukhi addak exist in one script only. The arithmetic lands on a
    // Devanagari code point the braille table does not know — and that must be a gap, not a guess.
    for (const orphan of ['ৎ', 'ੱ', 'ൺ']) {
      const result = indicToBraille(orphan);
      expect(result.unsupported.length, `${orphan} should be reported`).toBeGreaterThan(0);
    }
  });

  it('still renders the rest of the line when one character is unknown', () => {
    const result = indicToBraille('গণিত ৎ গণিত');
    expect(result.unsupported).toContain('ৎ');
    expect(result.cells.length).toBeGreaterThan(8);
  });

  it('never throws, on anything', () => {
    for (const text of ['', '   ', 'ৎৎৎ', '𑂍', 'ಠ_ಠ', 'क'.repeat(500)]) {
      expect(() => indicToBraille(text), text).not.toThrow();
    }
  });
});

describe('naming the script', () => {
  it('knows which script a character belongs to', () => {
    expect(scriptOf('ক')).toBe('bengali');
    expect(scriptOf('க')).toBe('tamil');
    expect(scriptOf('x')).toBeNull();
  });

  it('names the script of a whole line by what most of it is', () => {
    expect(detectScript('গণিত 12')).toBe('bengali');
    expect(detectScript('दो संख्याओं का योग 12 है')).toBe('devanagari');
    expect(detectScript('x + 1 = 2')).toBeNull();
  });

  it('has a name for each script in its own script', () => {
    expect(endonymOf('bengali')).toBe('বাংলা');
    expect(endonymOf('tamil')).toBe('தமிழ்');
    expect(hasIndic('বাংলা')).toBe(true);
    expect(hasIndic('nothing here')).toBe(false);
  });
});

describe('the Devanagari table is untouched by any of this', () => {
  it('still gives the same answers as before', () => {
    expect(cellsToUnicode(devanagariToBraille('गणित').cells)).toBe('⠛⠼⠊⠞');
    expect(cellsToUnicode(devanagariToBraille('दो सेब').cells)).toBe('⠙⠕⠀⠎⠑⠃');
  });
});
