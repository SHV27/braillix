/**
 * A reading drill tests whether the student read the DOTS, not whether they know our LaTeX.
 *
 * So an answer typed as `a/b` must be accepted for ⠹⠁⠌⠃⠼. These tests check both halves: that the
 * rewrites are offered, and that they genuinely produce the same braille — the second is the one
 * that matters, because a rewrite that looked right but translated differently would mark a
 * correct student wrong.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { interpretAnswer } from './answer';
import { toLatex } from '../core/mathinput';

/** What the Board itself makes of the same input — the second reading an answer box must accept. */
const RAW_FRACTION = toLatex('a + b/c + d').latex;
import { initSre } from '../core/sre-service';
import { translateLatex } from '../core/translate';

describe('interpreting what a student typed', () => {
  it('offers the literal reading first', () => {
    expect(interpretAnswer('x^2')[0]).toBe('x^2');
  });

  it('reads a slash as a fraction, because that is how a reader writes what they felt', () => {
    expect(interpretAnswer('a/b')).toContain(String.raw`\frac{a}{b}`);
    expect(interpretAnswer('22/7')).toContain(String.raw`\frac{22}{7}`);
  });

  it('leaves alone anything already written as LaTeX', () => {
    expect(interpretAnswer(String.raw`\frac{a}{b}`)).toEqual([String.raw`\frac{a}{b}`]);
  });

  it('offers both readings of an ambiguous slash rather than choosing one', () => {
    /*
     * "a + b/c + d" could be a fraction or a division, and this used to return only the literal
     * form on the grounds that guessing is worse than marking literally. That was right when there
     * was one candidate; it is wrong now that there can be several. Marking accepts ANY candidate
     * that produces the expected braille, so offering the Board's own reading as well means the
     * student is accepted whichever of the two they meant — and is never marked wrong for writing
     * their answer the way the app taught them to write the question.
     */
    const readings = interpretAnswer('a + b/c + d');
    expect(readings).toContain('a + b/c + d');
    expect(readings).toContain(RAW_FRACTION);
  });

  it('reads sqrt(x), sqrt x and root(x) as radicals', () => {
    expect(interpretAnswer('sqrt(x)')).toContain(String.raw`\sqrt{x}`);
    expect(interpretAnswer('sqrt x+1')).toContain(String.raw`\sqrt{x+1}`);
    expect(interpretAnswer('root(9)')).toContain(String.raw`\sqrt{9}`);
  });

  it('accepts the programmer’s power operator', () => {
    expect(interpretAnswer('x**2')).toContain('x^2');
  });

  it('returns nothing for an empty answer', () => {
    expect(interpretAnswer('   ')).toEqual([]);
  });
});

describe('equivalent answers really do produce the same braille', () => {
  beforeAll(async () => {
    const status = await initSre();
    expect(status.ok).toBe(true);
  }, 60_000);

  const PAIRS: ReadonlyArray<readonly [string, string]> = [
    ['a/b', String.raw`\frac{a}{b}`],
    ['22/7', String.raw`\frac{22}{7}`],
    ['1/2', String.raw`\frac{1}{2}`],
    ['sqrt(x)', String.raw`\sqrt{x}`],
    ['root(9)', String.raw`\sqrt{9}`],
    ['x**2', 'x^2'],
  ];

  for (const [typed, canonical] of PAIRS) {
    it(`accepts "${typed}" for ${canonical}`, async () => {
      const target = await translateLatex(canonical);
      expect(target.cells.length, `${canonical} did not translate`).toBeGreaterThan(0);

      const produced: string[] = [];
      for (const reading of interpretAnswer(typed)) {
        produced.push((await translateLatex(reading)).unicode);
      }
      expect(produced, `readings tried: ${interpretAnswer(typed).join(' | ')}`).toContain(target.unicode);
    });
  }

  it('still marks a genuinely wrong answer wrong', async () => {
    const target = await translateLatex(String.raw`\frac{a}{b}`);
    const produced: string[] = [];
    for (const reading of interpretAnswer('b/a')) {
      produced.push((await translateLatex(reading)).unicode);
    }
    expect(produced).not.toContain(target.unicode);
  });
});
