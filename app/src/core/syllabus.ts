/**
 * The school syllabus, as a teacher would type it.
 *
 * This list is the thing Braillix claims to be able to do. It is written the way a teacher writes
 * on the Board — `1/2`, not `\frac{1}{2}` — because that is the claim being made: not "Nemeth is
 * implemented", but "a maths teacher at an Indian school for the blind can put their own syllabus
 * on the display without learning anything new".
 *
 * `syllabus.test.ts` walks every line and fails if one of them stops translating. `npm run accuracy`
 * walks the same list and writes `docs/ACCURACY.md` — the same evidence, in a form a panel can read
 * without running anything.
 *
 * Topics follow the arithmetic-to-calculus arc of NCERT classes 6–12. Nothing here is aspirational:
 * every line is one somebody would actually write on a blackboard.
 */

export interface SyllabusEntry {
  /** What the teacher types. */
  readonly source: string;
  /** Plain English for the report, so the table can be read by someone who does not read LaTeX. */
  readonly says: string;
}

export interface SyllabusTopic {
  readonly topic: string;
  /** Roughly which years this belongs to, for the report. */
  readonly classes: string;
  readonly entries: readonly SyllabusEntry[];
}

export const SYLLABUS: readonly SyllabusTopic[] = [
  {
    topic: 'Number and arithmetic',
    classes: '1–6',
    entries: [
      { source: '7', says: 'a single digit' },
      { source: '42', says: 'a two-digit number' },
      { source: '1,00,000', says: 'a lakh, grouped the Indian way' },
      { source: '2 + 3 = 5', says: 'addition' },
      { source: '9 - 4 = 5', says: 'subtraction' },
      { source: '3 x 4 = 12', says: 'multiplication, written with a cross' },
      { source: '12 div 4 = 3', says: 'division' },
      { source: '3.14', says: 'a decimal' },
      { source: '-5 + 2 = -3', says: 'negative numbers' },
      { source: '2 + 3 x 4 = 14', says: 'order of operations' },
    ],
  },
  {
    topic: 'Fractions, ratio and percentage',
    classes: '5–8',
    entries: [
      { source: '1/2', says: 'one half' },
      { source: '22/7', says: 'twenty-two sevenths' },
      { source: '2/3 + 1/6 = 5/6', says: 'adding fractions' },
      { source: '3/4 x 2/5', says: 'multiplying fractions' },
      { source: '(x+1)/(x-1)', says: 'an algebraic fraction' },
      { source: '50%', says: 'a percentage' },
      { source: '25% of 80 = 20', says: 'percentage of a quantity' },
      { source: 'Rs 250', says: 'money' },
      { source: '2 : 3', says: 'a ratio' },
    ],
  },
  {
    topic: 'Algebra',
    classes: '6–10',
    entries: [
      { source: 'x + 5 = 12', says: 'a simple equation' },
      { source: '2x + 5 = 15', says: 'an equation with a coefficient' },
      { source: 'x^2 + 3x + 2 = 0', says: 'a quadratic' },
      { source: 'ab + bc', says: 'a product of variables' },
      { source: '(a+b)^2 = a^2 + 2ab + b^2', says: 'an identity' },
      { source: '(-b +- sqrt(b^2 - 4ac))/(2a)', says: 'the quadratic formula' },
      { source: 'x_1 + x_2', says: 'subscripted variables' },
      { source: 'x^3 - 8', says: 'a cube' },
      { source: 'a^2 + b^2 = c^2', says: 'Pythagoras' },
    ],
  },
  {
    topic: 'Roots, indices and surds',
    classes: '8–10',
    entries: [
      { source: 'sqrt(9) = 3', says: 'a square root' },
      { source: 'sqrt(144) = 12', says: 'a larger square root' },
      { source: 'cbrt(27) = 3', says: 'a cube root' },
      { source: 'sqrt(x^2 + y^2)', says: 'a root over an expression' },
      { source: '2^10 = 1024', says: 'a power' },
      { source: 'x^(n+1)', says: 'a symbolic power' },
      { source: '10^-3', says: 'a negative index' },
    ],
  },
  {
    topic: 'Inequalities, sets and logic',
    classes: '8–11',
    entries: [
      { source: '2 <= x', says: 'less than or equal to' },
      { source: 'x >= 5', says: 'greater than or equal to' },
      { source: 'a != b', says: 'not equal to' },
      { source: '1 < x < 5', says: 'a double inequality' },
      { source: '{1,2,3}', says: 'a set' },
      { source: 'A cup B', says: 'union' },
      { source: 'A cap B', says: 'intersection' },
      { source: 'x in A', says: 'membership' },
      { source: '|x| = 5', says: 'absolute value' },
    ],
  },
  {
    topic: 'Geometry and mensuration',
    classes: '6–10',
    entries: [
      { source: '45 degrees', says: 'an angle in degrees' },
      { source: 'angle ABC = 90 degrees', says: 'a named angle' },
      { source: 'triangle ABC', says: 'a triangle' },
      { source: 'pi r^2', says: 'the area of a circle' },
      { source: '2 pi r', says: 'the circumference' },
      { source: '1/2 x b x h', says: 'the area of a triangle' },
      { source: 'AB parallel CD', says: 'parallel lines' },
      { source: 'theta', says: 'an angle by name' },
    ],
  },
  {
    topic: 'Trigonometry',
    classes: '10–12',
    entries: [
      { source: 'sin theta', says: 'sine of an angle' },
      { source: 'sin^2 theta + cos^2 theta = 1', says: 'the fundamental identity' },
      { source: 'tan 45 degrees = 1', says: 'a known value' },
      { source: 'cos 0 = 1', says: 'another known value' },
      { source: 'sin A / cos A = tan A', says: 'a quotient identity' },
    ],
  },
  {
    topic: 'Logarithms and progressions',
    classes: '11–12',
    entries: [
      { source: 'log_10 100 = 2', says: 'a logarithm with a base' },
      { source: 'ln e = 1', says: 'a natural logarithm' },
      { source: 'sum_{i=1}^{n} i = n(n+1)/2', says: 'a summation' },
      { source: 'a + (n-1)d', says: 'the nth term of an AP' },
    ],
  },
  {
    topic: 'Calculus',
    classes: '11–12',
    entries: [
      { source: 'lim_{x -> 0} sin x / x = 1', says: 'a limit' },
      { source: 'int_{0}^{1} x^2', says: 'a definite integral' },
      { source: 'dy/dx', says: 'a derivative' },
      { source: 'infinity', says: 'infinity' },
    ],
  },
  {
    topic: 'Questions with words in them',
    classes: 'all',
    entries: [
      { source: 'Find the value of 2x + 5 = 15', says: 'an English word problem' },
      { source: 'दो संख्याओं का योग 12 है', says: 'a Hindi word problem' },
      { source: 'The area is pi r^2', says: 'words around an expression' },
      { source: 'एक कोण 45 degrees का है', says: 'Hindi with an angle in it' },
    ],
  },
];

/** Every line, flattened — for tests and for the report. */
export function allEntries(): { topic: string; entry: SyllabusEntry }[] {
  return SYLLABUS.flatMap((topic) => topic.entries.map((entry) => ({ topic: topic.topic, entry })));
}
