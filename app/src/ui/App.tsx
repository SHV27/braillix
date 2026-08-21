import { useEffect } from 'react';
import { useBraillix, type ViewId } from '../store';
import { APP_NAME } from '../config';
import { StatusStrip } from './StatusStrip';
import { UpdateNotice } from './UpdateNotice';
import { BoardScreen } from './BoardScreen';
import { DeviceScreen } from './DeviceScreen';
import { HelpScreen } from './HelpScreen';
import { LanguageSwitch } from './LanguageSwitch';
import { useT, type StringKey } from './i18n';

/**
 * The sections, in a teacher's words.
 *
 * These used to be named after the technology inside them ("Read handwriting", "Cell atlas").
 * They are now named after the job: write maths on the **board**, **practise** the code, look after
 * the **device**. Photographing an equation is an input method on the board, and the cam atlas is
 * reference material about the device — neither is a place you go.
 */
const VIEWS: { id: ViewId; label: StringKey; hint: StringKey }[] = [
  { id: 'board', label: 'nav.board', hint: 'nav.board.hint' },
  { id: 'device', label: 'nav.device', hint: 'nav.device.hint' },
  { id: 'help', label: 'nav.help', hint: 'nav.help.hint' },
];

export function App() {
  const t = useT();
  const view = useBraillix((s) => s.view);
  const setView = useBraillix((s) => s.setView);
  const bootstrap = useBraillix((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        {t('app.skip')}
      </a>

      {/* Above everything, because a stale app is a wrong app and the teacher has to be able to
          see that before they trust anything below it. */}
      <UpdateNotice />

      <header className="masthead">
        <div className="masthead__brand">
          {/* The mark is a braille cell showing ⠭ — the letter x. A two-column grid fills
              row-wise, so the order here is dot 1, 4, 2, 5, 3, 6, not 1..6. */}
          <span className="masthead__mark" aria-hidden="true">
            <span className="masthead__dot is-on" /> {/* dot 1 */}
            <span className="masthead__dot is-on" /> {/* dot 4 */}
            <span className="masthead__dot" /> {/* dot 2 */}
            <span className="masthead__dot" /> {/* dot 5 */}
            <span className="masthead__dot is-on" /> {/* dot 3 */}
            <span className="masthead__dot is-on" /> {/* dot 6 */}
          </span>
          <span className="masthead__words">
            <strong>{APP_NAME}</strong>
            <span className="masthead__sub">{t('app.tagline')}</span>
          </span>
        </div>

        <div className="masthead__controls">
          <nav className="masthead__nav" aria-label={t('app.sections')}>
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`tab${view === item.id ? ' is-current' : ''}`}
                aria-current={view === item.id ? 'page' : undefined}
                title={t(item.hint)}
                data-testid={`nav-${item.id}`}
                onClick={() => setView(item.id)}
              >
                {t(item.label)}
              </button>
            ))}
          </nav>
          <LanguageSwitch />
        </div>
      </header>

      <main id="main" className="main">
        {view === 'board' && <BoardScreen />}
        {view === 'device' && <DeviceScreen />}
        {view === 'help' && <HelpScreen />}
      </main>

      <StatusStrip />
    </div>
  );
}
