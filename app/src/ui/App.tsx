import { useEffect } from 'react';
import { useBraillix, type ViewId } from '../store';
import { APP_NAME } from '../config';
import { StatusStrip } from './StatusStrip';
import { ReadScreen } from './ReadScreen';
import { AtlasScreen } from './AtlasScreen';
import { HardwareScreen } from './HardwareScreen';

const VIEWS: { id: ViewId; label: string; hint: string }[] = [
  { id: 'read', label: 'Read', hint: 'Type maths and read it on the display' },
  { id: 'hardware', label: 'Hardware', hint: 'Connect a pod, and calibrate the cam wiring' },
  { id: 'atlas', label: 'Cell atlas', hint: 'All 64 cam positions and what they mean' },
];

export function App() {
  const view = useBraillix((s) => s.view);
  const setView = useBraillix((s) => s.setView);
  const bootstrap = useBraillix((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to the display
      </a>

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
            <span className="masthead__sub">refreshable braille for mathematics</span>
          </span>
        </div>

        <nav className="masthead__nav" aria-label="Sections">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`tab${view === item.id ? ' is-current' : ''}`}
              aria-current={view === item.id ? 'page' : undefined}
              title={item.hint}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main id="main" className="main">
        {view === 'read' && <ReadScreen />}
        {view === 'hardware' && <HardwareScreen />}
        {view === 'atlas' && <AtlasScreen />}
      </main>

      <StatusStrip />
    </div>
  );
}
