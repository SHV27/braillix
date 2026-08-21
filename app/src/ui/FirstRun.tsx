/**
 * The first sixty seconds.
 *
 * Not a tour with arrows and "next" buttons — those are read once, by nobody, and then dismissed.
 * This is three things a teacher can *press*, each of which does the thing it describes. Pressing
 * them is the tour: the display moves, the structure folds, the question in Hindi appears with its
 * two braille codes. Then it goes away, and it does not come back.
 *
 * It shows itself only on a machine that has never used Braillix — and "never" is decided by the
 * same `localStorage` that keeps the worksheets, so a teacher who has been using it for a term is
 * never told what a worksheet is.
 */

import { useState } from 'react';
import { useBraillix } from '../store';
import { useT, type StringKey } from './i18n';
import './FirstRun.css';

const SEEN_KEY = 'braillix.firstrun.done';

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false; // a browser that will not remember gets the welcome every time; that is honest
  }
}

interface Step {
  readonly id: string;
  readonly label: StringKey;
  readonly detail: StringKey;
  readonly run: (api: { setSource: (text: string) => void; setMode: (mode: 'whole' | 'explore') => void; setView: (view: 'help') => void }) => void;
}

const STEPS: Step[] = [
  {
    id: 'read',
    label: 'first.step1',
    detail: 'first.step1detail',
    run: ({ setSource, setMode }) => {
      setMode('whole');
      setSource('2/3 + 1/6');
    },
  },
  {
    id: 'explore',
    label: 'first.step2',
    detail: 'first.step2detail',
    run: ({ setSource, setMode }) => {
      setSource('(-b +- sqrt(b^2 - 4ac))/(2a)');
      setMode('explore');
    },
  },
  {
    id: 'question',
    label: 'first.step3',
    detail: 'first.step3detail',
    run: ({ setSource, setMode }) => {
      setMode('whole');
      setSource('दो संख्याओं का योग 12 है');
    },
  },
];

export function FirstRun({ onDemo }: { onDemo?: (text: string) => void }) {
  const t = useT();
  const storeSetSource = useBraillix((s) => s.setSource);
  const setMode = useBraillix((s) => s.setMode);
  const setView = useBraillix((s) => s.setView);

  // The demo fills the teacher's own box when the board offers one, so "now try changing it"
  // is one keystroke away — the display alone would be a magic trick with no handle.
  const setSource = onDemo ?? storeSetSource;

  const [dismissed, setDismissed] = useState(alreadySeen);
  const [done, setDone] = useState<string[]>([]);

  if (dismissed) return null;

  function close() {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* nothing to remember it with; the welcome simply shows again */
    }
    setDismissed(true);
  }

  return (
    <aside className="firstrun" aria-labelledby="firstrun-heading" data-testid="first-run">
      <div className="firstrun__head">
        <h2 id="firstrun-heading" className="firstrun__title">
          {t('first.title')}
        </h2>
        <button type="button" className="firstrun__close" data-testid="first-run-close" onClick={close}>
          {t('first.skip')}
        </button>
      </div>

      <p className="firstrun__lede">{t('first.lede')}</p>

      <ol className="firstrun__steps">
        {STEPS.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              className={`firstrun__step${done.includes(step.id) ? ' is-done' : ''}`}
              data-testid={`first-run-${step.id}`}
              onClick={() => {
                step.run({ setSource, setMode, setView });
                setDone((current) => (current.includes(step.id) ? current : [...current, step.id]));
              }}
            >
              <span className="firstrun__num num">{index + 1}</span>
              <span className="firstrun__body">
                <strong>{t(step.label)}</strong>
                <small>{t(step.detail)}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <p className="firstrun__foot">
        {t('first.foot')}{' '}
        <button
          type="button"
          className="firstrun__link"
          data-testid="first-run-help"
          onClick={() => {
            close();
            setView('help');
          }}
        >
          {t('first.help')}
        </button>
      </p>
    </aside>
  );
}
