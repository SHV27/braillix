/**
 * The evidence panel.
 *
 * The display shows a window; this shows the whole run and the numbers behind it — the Nemeth
 * string, every cell's dots, and the exact cam position that would travel down the I2C bus. It
 * exists so nothing about the translation is hidden behind the pretty dots, and so the hardware
 * team can check a real expression against a real cam without asking anyone.
 */

import { useBraillix } from '../store';
import { maskToDots, maskToUnicode } from '../core/braille';
import { toCam } from '../core/profile';
import './DisplayStrip.css';

export function DisplayStrip() {
  const translation = useBraillix((s) => s.translation);
  const profile = useBraillix((s) => s.profile);
  const windowStart = useBraillix((s) => s.windowStart);
  const setWindowStart = useBraillix((s) => s.setWindowStart);

  const cells = translation?.cells ?? [];

  if (cells.length === 0) {
    return (
      <section className="evidence" aria-labelledby="evidence-heading">
        <h2 id="evidence-heading" className="read__h2">
          The braille
        </h2>
        <p className="evidence__empty">
          Nothing translated yet. Type an expression above — or pick an example — and every cell,
          dot and cam number will be listed here.
        </p>
      </section>
    );
  }

  const visibleFrom = windowStart;
  const visibleTo = windowStart + profile.cellCount;

  return (
    <section className="evidence" aria-labelledby="evidence-heading">
      <div className="evidence__head">
        <h2 id="evidence-heading" className="read__h2">
          The braille
        </h2>
        <p className="evidence__count num">
          {cells.length} cell{cells.length === 1 ? '' : 's'} · Nemeth
        </p>
      </div>

      <p className="evidence__unicode" lang="en" data-testid="braille-unicode">
        {translation?.unicode}
      </p>

      <div className="evidence__scroll">
        <table className="wire">
          <caption className="visually-hidden">
            Every braille cell in this expression, with its raised dots and the cam position sent to
            the hardware.
          </caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Cell</th>
              <th scope="col">Dots</th>
              <th scope="col">Cam</th>
            </tr>
          </thead>
          <tbody>
            {cells.map((mask, index) => {
              const onDisplay = index >= visibleFrom && index < visibleTo;
              return (
                <tr key={index} className={onDisplay ? 'is-on-display' : undefined}>
                  <td className="num">{index + 1}</td>
                  <td className="wire__glyph">
                    <button
                      type="button"
                      className="wire__jump"
                      title={`Scroll the display to cell ${index + 1}`}
                      onClick={() => setWindowStart(index)}
                    >
                      {maskToUnicode(mask)}
                    </button>
                  </td>
                  <td className="num">{maskToDots(mask).join('-') || '—'}</td>
                  <td className="num wire__cam">{toCam(profile, mask)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="evidence__foot">
        Cam positions follow the current wiring profile. If the physical cam is wired differently,
        change it once on the hardware screen — the braille above never changes.
      </p>
    </section>
  );
}
