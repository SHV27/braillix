/**
 * The lessons.
 *
 * Ordered the way Nemeth is actually taught: the digits first, because "the numbers are dropped"
 * is the thing that surprises every sighted person and the thing a braille reader must know before
 * anything else makes sense; then the operators; then the structures that turn a line of symbols
 * into an expression.
 *
 * Every item is defined by its LaTeX, and the expected braille is produced by the same engine that
 * drives the hardware. Nothing is hand-typed as dot patterns, so a lesson can never drift out of
 * agreement with what the display would actually show.
 */

export type DrillKind = 'read' | 'write';

export interface LessonItem {
  /** The maths, as LaTeX. */
  readonly latex: string;
  /** What to tell the student when they get it wrong. One specific fact, not encouragement. */
  readonly hint: string;
}

export interface Lesson {
  readonly id: string;
  readonly title: string;
  /** One line: what this is and why it matters. */
  readonly teaches: string;
  /** The rule being learned, in the student's language. */
  readonly rule: string;
  readonly items: readonly LessonItem[];
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'digits',
    title: 'The dropped numbers',
    teaches: 'Numbers in Nemeth sit in the lower part of the cell.',
    rule:
      'Nemeth writes digits one row DOWN from the letters: 1 is dot 2, 2 is dots 2-3, 3 is dots 2-5. ' +
      'That is why maths braille looks different from ordinary braille even when it is only counting.',
    items: [
      { latex: '1', hint: '1 is the letter a moved down: dot 2 instead of dot 1.' },
      { latex: '2', hint: '2 is the letter b moved down: dots 2-3.' },
      { latex: '3', hint: '3 is the letter c moved down: dots 2-5.' },
      { latex: '5', hint: '5 is the letter e moved down: dots 2-6.' },
      { latex: '7', hint: '7 is the letter g moved down: dots 2-3-5-6.' },
      { latex: '0', hint: '0 is the letter j moved down: dots 3-5-6.' },
    ],
  },
  {
    id: 'numeric-indicator',
    title: 'The numeric indicator',
    teaches: 'A number standing on its own announces itself first.',
    rule:
      'A number that starts a fresh numeric context is preceded by ⠼ (dots 3-4-5-6). Without it, the ' +
      'dropped digits could be read as punctuation.',
    items: [
      { latex: '4', hint: 'Two cells: the numeric indicator ⠼, then the dropped 4.' },
      { latex: '42', hint: 'One indicator serves the whole number, not one per digit.' },
      { latex: '100', hint: 'Still one indicator — then 1, 0, 0.' },
    ],
  },
  {
    id: 'letters',
    title: 'Letters stay where they are',
    teaches: 'Variables are ordinary braille letters, uncontracted.',
    rule:
      'Nemeth never contracts inside maths, so x is just x: dots 1-3-4-6. Nothing is abbreviated, ' +
      'because in an equation every character means something.',
    items: [
      { latex: 'a', hint: 'a is dot 1 — the first cell in braille.' },
      { latex: 'x', hint: 'x is dots 1-3-4-6.' },
      { latex: 'n', hint: 'n is dots 1-3-4-5.' },
      { latex: 'y', hint: 'y is dots 1-3-4-5-6.' },
    ],
  },
  {
    id: 'plus-minus',
    title: 'Plus and minus',
    teaches: 'The two operators you will meet most.',
    rule: 'Plus is ⠬ (dots 3-4-6). Minus is ⠤ (dots 3-6). Both sit low in the cell, like the digits.',
    items: [
      { latex: '1+1', hint: 'Indicator, 1, plus, 1 — the plus does not restart the number.' },
      { latex: '5-2', hint: 'Minus is dots 3-6 — just the right-hand column of the plus.' },
      { latex: 'a+b', hint: 'Letters need no indicator; the plus is still dots 3-4-6.' },
    ],
  },
  {
    id: 'equals',
    title: 'Equals takes two cells',
    teaches: 'Comparison signs are two-cell symbols with a space either side.',
    rule:
      'Equals is ⠨⠅ — dots 4-6, then dots 1-3. It is written with a space before and after, which is ' +
      'why an equation is wider in braille than you expect.',
    items: [
      { latex: '1=1', hint: 'Space, ⠨⠅, space. The spaces are real cells and they matter.' },
      { latex: 'x=2', hint: 'x, space, equals, space, then the number with its indicator.' },
      { latex: '2+3=5', hint: 'Seven cells in all — count the spaces around the equals.' },
    ],
  },
  {
    id: 'fractions',
    title: 'Fractions open and close',
    teaches: 'A fraction is bracketed, not stacked.',
    rule:
      'Open with ⠹ (dots 1-4-5-6), separate with ⠌ (dots 3-4), close with ⠼ (dots 3-4-5-6). Print ' +
      'stacks a fraction in two dimensions; braille has one line, so it brackets it instead.',
    items: [
      { latex: '\\frac{a}{b}', hint: 'Five cells: open, a, line, b, close.' },
      { latex: '\\frac{1}{2}', hint: 'The digits inside are dropped, as always.' },
      { latex: '\\frac{22}{7}', hint: 'Open, 2, 2, line, 7, close.' },
    ],
  },
  {
    id: 'roots',
    title: 'Roots open and close too',
    teaches: 'The radical sign has an end as well as a beginning.',
    rule:
      'Open with ⠜ (dots 3-4-5) and close with ⠻ (dots 1-2-4-5-6). In print the bar over the top ' +
      'shows where a root ends; in braille the closing cell does that job.',
    items: [
      { latex: '\\sqrt{x}', hint: 'Three cells: open, x, close.' },
      { latex: '\\sqrt{9}', hint: 'Open, then the dropped 9, then close.' },
      { latex: '\\sqrt{x+1}', hint: 'Everything up to the closing cell is under the root.' },
    ],
  },
  {
    id: 'powers',
    title: 'Powers, and coming back down',
    teaches: 'Levels are announced, and so is the return to the baseline.',
    rule:
      'Superscript is ⠘ (dots 4-5). What follows is raised until ⠐ (dot 5) brings you back to the ' +
      'baseline. Forgetting the baseline indicator is how "x² + 1" becomes "x to the power of 2+1".',
    items: [
      { latex: 'x^2', hint: 'x, superscript, dropped 2. Nothing follows, so no baseline cell is needed.' },
      { latex: 'x^2+1', hint: 'After the exponent comes ⠐ — that is what ends the power.' },
      { latex: 'a^2+b^2', hint: 'Each power is closed by its own baseline indicator.' },
    ],
  },
  {
    id: 'brackets',
    title: 'Brackets',
    teaches: 'Round brackets have their own cells.',
    rule: 'Open is ⠷ (dots 1-2-3-5-6), close is ⠾ (dots 2-3-4-5-6).',
    items: [
      { latex: '(a+b)', hint: 'Five cells: open, a, plus, b, close.' },
      { latex: '2(x+1)', hint: 'The number leads, then the bracket opens.' },
    ],
  },
  {
    id: 'together',
    title: 'Putting it together',
    teaches: 'Whole expressions, with everything you have learned at once.',
    rule: 'Nothing new — this is the same six rules working together, which is what real maths looks like.',
    items: [
      { latex: 'x^2+3x+2=0', hint: 'Powers, plus, the equals with its spaces, and a dropped 0.' },
      { latex: '\\frac{1}{2}+\\frac{1}{3}', hint: 'Two complete fractions, each opened and closed.' },
      { latex: '\\sqrt{a^2+b^2}', hint: 'A root containing two powers — watch the baseline indicators.' },
      { latex: '\\frac{-b}{2a}', hint: 'The minus belongs to the numerator, inside the fraction.' },
    ],
  },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

/** Total items across all lessons — used for the progress summary. */
export function totalItems(): number {
  return LESSONS.reduce((sum, lesson) => sum + lesson.items.length, 0);
}
