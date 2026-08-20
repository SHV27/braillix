/**
 * The dock — the cells themselves, wherever they are needed.
 *
 * This started life inside the Read screen, which was a mistake the screenshots caught: the
 * practice drill said "2 cells are on the display" while showing no display at all. With hardware
 * attached the dots are under the student's fingers, but the primary mode of this product is *no
 * hardware attached* — so anywhere that drives the cells must also show them.
 */

import { useBraillix } from '../store';
import { SIMULATOR_MAX_CELLS, SIMULATOR_MIN_CELLS } from '../config';
import { FULL_CELL } from '../core/braille';
import { BrailleCell } from './BrailleCell';
import { useT, type StringKey } from './i18n';
import { describeWindow } from './window-label';
import './DisplayDock.css';

export interface DisplayDockProps {
  /** Heading. Defaults to "The display". */
  title?: StringKey;
  /** Show the simulated cell-count control. Off where the surrounding screen owns it. */
  showCellCount?: boolean;
  /** Show the paging controls. */
  showPaging?: boolean;
  /** Extra line under the heading, replacing the default explanation of the cell count. */
  hint?: StringKey;
}

export function DisplayDock({
  title = 'display.title',
  showCellCount = true,
  showPaging = true,
  hint,
}: DisplayDockProps) {
  const t = useT();
  const profile = useBraillix((s) => s.profile);
  const setCellCount = useBraillix((s) => s.setCellCount);
  const frame = useBraillix((s) => s.frame);
  const windowStart = useBraillix((s) => s.windowStart);
  const setWindowStart = useBraillix((s) => s.setWindowStart);
  const activeCells = useBraillix((s) => s.activeCells);
  const foldedChildCells = useBraillix((s) => s.foldedChildCells);
  const enterFoldAt = useBraillix((s) => s.enterFoldAt);
  const mode = useBraillix((s) => s.mode);

  const total = activeCells.length;
  const canScroll = total > profile.cellCount;
  const simulated = profile.source === 'simulated';

  return (
    <section className="dock" aria-labelledby="dock-heading">
      <div className="dock__head">
        <h2 id="dock-heading" className="read__h2">
          {t(title)}
        </h2>
        {showCellCount && simulated && (
          <label className="cellcount">
            <span className="cellcount__label">{t('display.cells')}</span>
            <input
              className="cellcount__range"
              type="range"
              min={SIMULATOR_MIN_CELLS}
              max={SIMULATOR_MAX_CELLS}
              value={profile.cellCount}
              name="cell-count" data-testid="cell-count"
              onChange={(event) => setCellCount(Number(event.target.value))}
            />
            <output className="cellcount__value num">{profile.cellCount}</output>
          </label>
        )}
      </div>

      <p className="read__hint">
        {hint
          ? t(hint)
          : profile.cellCount === 1
            ? t('display.oneCell')
            : t('display.manyCells', { count: profile.cellCount })}
      </p>

      <div className="cellrow" data-testid="cell-row">
        {frame.cells.map((dots, index) => {
          const runIndex = windowStart + index;
          const isFold = mode === 'explore' && dots === FULL_CELL && foldedChildCells.includes(runIndex);
          return (
            <span key={index} className={isFold ? 'cellwrap is-fold' : 'cellwrap'}>
              <BrailleCell
                dots={dots}
                cam={frame.cam[index]}
                index={runIndex}
                active={frame.cursorCell === index}
                onClick={isFold ? () => enterFoldAt(runIndex) : undefined}
              />
              {isFold && (
                <span className="cellwrap__tag" aria-hidden="true">
                  {t('display.stepIn')}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {showPaging && (
        <div className="scroller">
          <button
            type="button"
            className="btn"
            disabled={!canScroll || windowStart === 0}
            onClick={() => setWindowStart(Math.max(0, windowStart - profile.cellCount))}
          >
            ← {t('display.previous')}
          </button>
          <span className="scroller__label num" data-testid="window-label">
            {describeWindow(t, frame)}
          </span>
          <button
            type="button"
            className="btn"
            disabled={!canScroll || windowStart + profile.cellCount >= total}
            onClick={() => setWindowStart(windowStart + profile.cellCount)}
          >
            {t('display.next')} →
          </button>
        </div>
      )}
    </section>
  );
}
