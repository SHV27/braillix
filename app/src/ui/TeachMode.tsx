/**
 * Teaching — one question at a time, on the display and on the wall.
 *
 * This is the forty minutes the whole product exists for. A teacher opens a worksheet, presses the
 * right arrow twelve times, and each press puts the next question under the children's fingers.
 * Nothing else is on the screen: no keypad, no cam numbers, no navigation. A lesson is not a
 * settings screen.
 *
 * Everything here goes through the same `setSource` that the Board uses, so what a class reads in a
 * lesson is byte-identical to what the teacher checked while preparing it.
 */

import { useCallback, useEffect, useState } from 'react';
import { useBraillix } from '../store';
import { cellsToUnicode } from '../core/translate';
import type { Worksheet } from '../class/types';
import { DisplayDock } from './DisplayDock';
import { SourcePreview } from './SourcePreview';
import { useT } from './i18n';
import './TeachMode.css';

export interface TeachModeProps {
  worksheet: Worksheet;
  onClose: () => void;
}

export function TeachMode({ worksheet, onClose }: TeachModeProps) {
  const t = useT();
  const setSource = useBraillix((s) => s.setSource);
  const sayCurrent = useBraillix((s) => s.sayCurrent);
  const activeCells = useBraillix((s) => s.activeCells);

  const [index, setIndex] = useState(0);
  const item = worksheet.items[index];
  const total = worksheet.items.length;

  const go = useCallback(
    (delta: 1 | -1) => setIndex((current) => Math.min(Math.max(current + delta, 0), Math.max(0, total - 1))),
    [total],
  );

  // Put the current item on the display whenever it changes.
  useEffect(() => {
    if (item) setSource(item.source);
  }, [item, setSource]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        go(-1);
      } else if (event.key === ' ') {
        event.preventDefault();
        sayCurrent();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [go, onClose, sayCurrent]);

  return (
    <div className="teach" role="dialog" aria-modal="true" aria-label={t('teach.title', { name: worksheet.title })} data-testid="teach-mode">
      <header className="teach__head">
        <div className="teach__where">
          <strong className="teach__sheet">{worksheet.title}</strong>
          <span className="teach__pos num">{t('teach.position', { index: index + 1, total })}</span>
        </div>
        <button type="button" className="btn" data-testid="teach-close" onClick={onClose}>
          {t('teach.close')} ✕
        </button>
      </header>

      {item ? (
        <>
          <div className="teach__stage" data-testid="teach-item">
            <SourcePreview source={item.source} size="huge" />
            {item.note && <p className="teach__note">{item.note}</p>}
          </div>

          <p className="teach__braille" data-testid="teach-braille" lang="en">
            {cellsToUnicode(activeCells)}
          </p>

          <div className="teach__dock">
            <DisplayDock showCellCount={false} hint="teach.onDisplay" />
          </div>

          <div className="teach__controls">
            <button
              type="button"
              className="btn"
              disabled={index === 0}
              data-testid="teach-prev"
              onClick={() => go(-1)}
            >
              ← {t('teach.previous')}
            </button>
            <button type="button" className="btn" data-testid="teach-say" onClick={sayCurrent}>
              {t('teach.say')}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={index >= total - 1}
              data-testid="teach-next"
              onClick={() => go(1)}
            >
              {t('teach.next')} →
            </button>
          </div>
          <p className="teach__keys">{t('teach.keys')}</p>
        </>
      ) : (
        <p className="cls__empty">{t('teach.empty')}</p>
      )}
    </div>
  );
}
