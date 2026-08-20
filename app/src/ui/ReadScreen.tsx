/**
 * The Read screen.
 *
 * Type an expression, watch the correct Nemeth dots appear on however many cells the display has,
 * and see the cam numbers that would go on the wire. Everything visible here is real: no mock
 * data, no placeholder braille.
 */

import { useEffect } from 'react';
import { useBraillix } from '../store';
import { DisplayDock } from './DisplayDock';
import { DisplayStrip } from './DisplayStrip';
import { ReaderPanel } from './ReaderPanel';
import './ReadScreen.css';

/** One pre-loaded example so the first thing a new user sees is a working display, not a blank. */
const OPENING_EXAMPLE = 'x^2 + 3x + 2 = 0';

const EXAMPLES: { latex: string; label: string }[] = [
  { latex: 'x^2 + 3x + 2 = 0', label: 'Quadratic' },
  { latex: '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', label: 'Quadratic formula' },
  { latex: '\\frac{22}{7}', label: 'Fraction' },
  { latex: '\\sqrt{144} = 12', label: 'Square root' },
  { latex: '\\sin^2\\theta + \\cos^2\\theta = 1', label: 'Identity' },
  { latex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}', label: 'Summation' },
];

export function ReadScreen() {
  const latex = useBraillix((s) => s.latex);
  const setLatex = useBraillix((s) => s.setLatex);
  const translation = useBraillix((s) => s.translation);
  const sre = useBraillix((s) => s.capabilities.sre);
  const announcement = useBraillix((s) => s.announcement);

  // Taste of success before any input is demanded.
  useEffect(() => {
    if (sre.state === 'ready' && latex === '') setLatex(OPENING_EXAMPLE);
  }, [sre.state, latex, setLatex]);

  const issues = translation?.issues ?? [];
  const parseIssue = issues.find((i) => i.kind === 'parse');

  return (
    <div className="read">
      <section className="read__input" aria-labelledby="input-heading">
        <h1 id="input-heading" className="read__title">
          Read mathematics with your hands
        </h1>
        <p className="read__lede">
          Type an expression. Braillix translates it into <strong>Nemeth</strong>, the braille code
          for mathematics, and drives the dots — on one cell or on forty.
        </p>

        <label className="field">
          <span className="field__label">Expression (LaTeX)</span>
          <textarea
            className="field__input num"
            value={latex}
            spellCheck={false}
            rows={2}
            name="expression" data-testid="latex-input"
            aria-describedby="input-help"
            onChange={(event) => setLatex(event.target.value)}
          />
        </label>
        <p id="input-help" className="field__help">
          Write it as you would in LaTeX — <code>x^2</code>, <code>\frac&#123;a&#125;&#123;b&#125;</code>,{' '}
          <code>\sqrt&#123;x&#125;</code>. Or pick one below.
        </p>

        <div className="examples" role="group" aria-label="Example expressions">
          {EXAMPLES.map((example) => (
            <button
              key={example.latex}
              type="button"
              className={`chip${latex === example.latex ? ' is-current' : ''}`}
              onClick={() => setLatex(example.latex)}
            >
              {example.label}
            </button>
          ))}
        </div>

        {parseIssue && (
          <p className="notice notice--bad" role="alert">
            <strong>That expression didn’t parse.</strong> {parseIssue.message}
            {parseIssue.fix && <span className="notice__fix">{parseIssue.fix}</span>}
          </p>
        )}
        {issues
          .filter((issue) => issue.kind !== 'parse')
          .map((issue) => (
            <p key={issue.message} className="notice notice--warn">
              {issue.message}
              {issue.fix && <span className="notice__fix">{issue.fix}</span>}
            </p>
          ))}

        <ReaderPanel />
      </section>

      <div className="read__display">
        <DisplayDock />
      </div>

      <DisplayStrip />

      <p className="visually-hidden" aria-live="polite" data-testid="live-region">
        {announcement}
      </p>
    </div>
  );
}
