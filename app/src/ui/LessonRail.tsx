/**
 * The blackboard itself — the lesson as a stack of lines.
 *
 * This is what a sighted child sees when they look up: the question, the working so far,
 * each line in the order the teacher wrote it. The amber marker is the chalk — the line the
 * class is on right now, which is exactly what the cells are showing.
 *
 * Reading it back is one press: any line puts itself on the display. Editing happens in the
 * one input box below (never inline) so there is exactly one place maths is ever typed.
 */

import { useLesson } from '../lesson';
import { useBraillix } from '../store';
import { useT } from './i18n';
import './LessonRail.css';

export function LessonRail({ onEdit }: { onEdit: (index: number, source: string) => void }) {
  const t = useT();
  const lines = useLesson((s) => s.lines);
  const currentIndex = useLesson((s) => s.currentIndex);
  const selectLine = useLesson((s) => s.selectLine);
  const removeLine = useLesson((s) => s.removeLine);
  const clearLesson = useLesson((s) => s.clearLesson);
  const translating = useBraillix((s) => s.translating);

  if (lines.length === 0) {
    return (
      <div className="rail rail--empty" data-testid="lesson-empty">
        <p className="rail__empty-word">{t('rail.empty')}</p>
        <p className="rail__empty-hint">{t('rail.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="rail" data-testid="lesson-rail">
      <ol className="rail__list" aria-label={t('rail.title')}>
        {lines.map((line, index) => {
          const current = index === currentIndex;
          return (
            <li key={line.id} className={`rail__row${current ? ' is-current' : ''}`}>
              <button
                type="button"
                className="rail__line num"
                aria-current={current ? 'true' : undefined}
                aria-label={t('rail.show', { n: index + 1 })}
                data-testid={`lesson-line-${index}`}
                onClick={() => selectLine(index)}
              >
                <span className="rail__marker" aria-hidden="true" />
                <span className="rail__index">{index + 1}</span>
                <span className="rail__source">{line.source}</span>
                {current && translating && <span className="rail__busy">{t('rail.translating')}</span>}
              </button>
              <span className="rail__tools">
                <button
                  type="button"
                  className="rail__tool"
                  aria-label={t('rail.edit', { n: index + 1 })}
                  title={t('rail.edit', { n: index + 1 })}
                  onClick={() => onEdit(index, line.source)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="rail__tool"
                  aria-label={t('rail.remove', { n: index + 1 })}
                  title={t('rail.remove', { n: index + 1 })}
                  data-testid={`lesson-remove-${index}`}
                  onClick={() => removeLine(index)}
                >
                  ×
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="rail__foot">
        <button type="button" className="chip" data-testid="lesson-clear" onClick={() => clearLesson()}>
          {t('rail.clear')}
        </button>
      </div>
    </div>
  );
}
