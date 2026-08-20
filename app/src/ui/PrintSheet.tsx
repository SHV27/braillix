/**
 * The worksheet on paper — print above, braille below, room to answer.
 *
 * This is for the *sighted* teacher as much as for the student: research (RESEARCH.md part two,
 * verdict 1) says the teacher at a school for the blind often does not read braille, and a sheet
 * with both on it is the thing they can hold while a child reads the display, or hand to a
 * colleague, or put in a file for an inspection.
 *
 * It lives in the page but is invisible until the moment somebody prints — no second window, no
 * export step, and no chance of the printed sheet drifting away from what is on screen.
 */

import { useEffect, useState } from 'react';
import { translateMixed } from '../core/mixed';
import { cellsToUnicode } from '../core/translate';
import type { Worksheet } from '../class/types';
import { SourcePreview } from './SourcePreview';
import { useT } from './i18n';
import './PrintSheet.css';

export function PrintSheet({ worksheet }: { worksheet: Worksheet }) {
  const t = useT();
  const [braille, setBraille] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      worksheet.items.map(async (item) => [item.id, cellsToUnicode((await translateMixed(item.source)).cells)] as const),
    ).then((entries) => {
      if (!cancelled) setBraille(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [worksheet]);

  return (
    <section className="printsheet" aria-hidden="true" data-testid="print-sheet">
      <header className="printsheet__head">
        <h2 className="printsheet__title">{worksheet.title}</h2>
        <p className="printsheet__meta">
          {t('print.name')} ______________________ &nbsp; {t('print.date')} ____________
        </p>
      </header>

      <ol className="printsheet__items">
        {worksheet.items.map((item) => (
          <li key={item.id} className="printsheet__item">
            <div className="printsheet__print">
              <SourcePreview source={item.source} size="large" />
            </div>
            <div className="printsheet__braille">{braille[item.id] ?? ''}</div>
            <div className="printsheet__answer" />
          </li>
        ))}
      </ol>

      <footer className="printsheet__foot">{t('print.foot')}</footer>
    </section>
  );
}
