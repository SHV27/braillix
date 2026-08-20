/**
 * The check a teacher can actually make.
 *
 * Almost every teacher who will use Braillix cannot read braille. That is not a gap in their
 * training — it is the ordinary situation in an Indian school for the blind, where a maths teacher
 * is a maths teacher first. It leaves them in an uncomfortable place: a row of dots appears, a
 * child reads it, and the teacher has no way at all to tell a correct cell from a plausible one.
 * Every other screen in this product asks them to take the translation on trust.
 *
 * This panel is the one that does not. It takes the cells that are physically on the display and
 * hands them to a second engine (`core/readback.ts`) which has never seen the input, the LaTeX, or
 * the translator — an engine whose only job is to say what a braille reader would say those dots
 * mean. Then it puts that reading next to what was typed.
 *
 * When they agree, the teacher has evidence rather than assurance. When they do not, the panel says
 * so plainly and shows both readings, because a wrong answer that announces itself is worth far
 * more than a right one that cannot be checked.
 *
 * And when the checker itself is out of its depth — a cell it has no rule for — the verdict is
 * "cannot be checked", never "matches". Making the checker's own gap look like a clean bill of
 * health would be the exact failure this panel exists to prevent (CLAUDE.md Law 3).
 */

import { useBraillix } from '../store';
import { checkRoundTrip, checkSegment, type RoundTrip } from '../core/roundtrip';
import { useT } from './i18n';
import './ReadbackPanel.css';

/**
 * The three verdicts, written out rather than built from the verdict name.
 *
 * `t(\`readback.${verdict}\`)` would work and would be shorter, and the completeness test would
 * stop being able to see these keys at all — which is the whole point of it. A key nobody can find
 * is a key that can silently go missing in one language.
 */
const VERDICT_LABEL = {
  agrees: 'readback.agrees',
  differs: 'readback.differs',
  unchecked: 'readback.unchecked',
} as const;

/**
 * Quote the expression back, but not all of it.
 *
 * The message exists so a teacher can see WHICH expression went wrong. A three-hundred-character
 * one printed in full pushes the whole page sideways and tells them nothing more than its first
 * line would have.
 */
function shorten(text: string): string {
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

/** The verdict for the whole line: the worst of its parts, since one wrong segment is a wrong line. */
function worst(trips: readonly RoundTrip[]): RoundTrip | null {
  if (trips.length === 0) return null;
  return (
    trips.find((trip) => trip.verdict === 'differs') ??
    trips.find((trip) => trip.verdict === 'unchecked') ??
    trips[0]
  );
}

export function ReadbackPanel() {
  const t = useT();
  const translation = useBraillix((s) => s.translation);
  const mixedLine = useBraillix((s) => s.mixedLine);

  // Every segment, in whatever code it is written: Nemeth for the mathematics, Bharati for words in
  // an Indian script, Grade-1 for English ones. Three readers, one verdict, no half-checked line.
  const trips: RoundTrip[] = mixedLine
    ? mixedLine.segments.map((segment) => checkSegment(segment.kind, segment.text, segment.latex, segment.cells))
    : translation && translation.cells.length > 0 && !translation.degraded
      ? [checkRoundTrip(translation.latex, translation.cells)]
      : [];

  const result = worst(trips);
  if (!result) return null;

  const reading = trips.map((trip) => trip.reading).join(' ');

  return (
    <section className={`readback readback--${result.verdict}`} aria-labelledby="readback-heading">
      <div className="readback__head">
        <h2 id="readback-heading" className="field__label readback__title">
          {t('readback.title')}
        </h2>
        <span className="readback__verdict" data-testid="readback-verdict" data-verdict={result.verdict}>
          {t(VERDICT_LABEL[result.verdict])}
        </span>
      </div>

      <p className="readback__reading num" data-testid="readback-reading">
        {reading}
      </p>

      {result.verdict === 'differs' && (
        <p className="readback__detail" role="alert">
          {t('readback.differs.detail', { expected: shorten(result.expected) })}
        </p>
      )}
      {result.verdict === 'unchecked' && (
        <>
          <p className="readback__detail">{t('readback.unchecked.detail')}</p>
          {/* The technical reason stays visible, in a quieter voice. A teacher does not need to read
              "the printer has no rule for \binom" — but somebody fixing it does, and hiding it
              would make the gap harder to close. */}
          <p className="readback__gaps num">{result.gaps.join(' · ')}</p>
        </>
      )}

      <p className="readback__how">{t('readback.how')}</p>
    </section>
  );
}
