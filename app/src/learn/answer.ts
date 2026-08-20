/**
 * Understanding what a student typed.
 *
 * A reading drill asks "what do these dots say?". A student who correctly reads ⠹⠁⠌⠃⠼ will very
 * reasonably type `a/b` — and marking that wrong because we wanted `\frac{a}{b}` would be marking
 * their LaTeX, not their braille. That is the difference between a maths tool and a syntax exam.
 *
 * So an answer is turned into several candidate readings, and it counts as correct if ANY of them
 * produces the expected braille. The rewrites below are the ones students actually type; nothing
 * here guesses at meaning, it only offers the ordinary written forms of the same expression.
 */

/** Candidate LaTeX readings of a typed answer, most literal first. */
export function interpretAnswer(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const candidates = new Set<string>([trimmed]);

  for (const rewrite of [asFraction, asRoot, asPower]) {
    for (const candidate of [...candidates]) {
      const rewritten = rewrite(candidate);
      if (rewritten && rewritten !== candidate) candidates.add(rewritten);
    }
  }

  return [...candidates];
}

/** `a/b` and `22/7` written as a real fraction — the commonest way a reader writes what they felt. */
function asFraction(text: string): string | null {
  // Only a simple, unambiguous "something / something" with no existing LaTeX fraction.
  if (text.includes('\\frac')) return null;
  const match = /^\s*([A-Za-z0-9.]+)\s*\/\s*([A-Za-z0-9.]+)\s*$/.exec(text);
  if (!match) return null;
  return `\\frac{${match[1]}}{${match[2]}}`;
}

/** `sqrt(x)`, `sqrt x` and `root(x)` written as a radical. */
function asRoot(text: string): string | null {
  if (text.includes('\\sqrt')) return null;
  const bracketed = /^\s*(?:sqrt|root)\s*\(\s*(.+?)\s*\)\s*$/i.exec(text);
  if (bracketed) return `\\sqrt{${bracketed[1]}}`;
  const bare = /^\s*(?:sqrt|root)\s+(.+?)\s*$/i.exec(text);
  if (bare) return `\\sqrt{${bare[1]}}`;
  return null;
}

/** `x**2` — the way anyone who has met a programming language writes a power. */
function asPower(text: string): string | null {
  if (!text.includes('**')) return null;
  return text.replace(/\*\*/g, '^');
}
