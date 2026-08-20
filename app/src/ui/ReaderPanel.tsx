/**
 * The Reader — Braillix's answer to "a whole equation through one cell is very difficult".
 *
 * Instead of streaming characters, you walk the expression's structure: left and right between
 * siblings, down into a sub-expression, up to its parent. Whatever you are standing on has its
 * children folded into single ⠿ cells, so a nineteen-cell quadratic formula becomes five cells
 * that say "something, over, something" — and you drill into the part you care about.
 *
 * The three keys map exactly onto the pod's three physical buttons (Prev / Select / Next), so
 * the same navigation works with the laptop closed.
 */

import { useEffect } from 'react';
import { useBraillix } from '../store';
import './ReaderPanel.css';

export function ReaderPanel() {
  const mode = useBraillix((s) => s.mode);
  const setMode = useBraillix((s) => s.setMode);
  const tree = useBraillix((s) => s.tree);
  const crumbs = useBraillix((s) => s.breadcrumb);
  const nodeLabel = useBraillix((s) => s.nodeLabel);
  const canGo = useBraillix((s) => s.canGo);
  const expanded = useBraillix((s) => s.expanded);
  const foldReason = useBraillix((s) => s.foldReason);
  const toggleExpanded = useBraillix((s) => s.toggleExpanded);
  const goSibling = useBraillix((s) => s.goSibling);
  const goChild = useBraillix((s) => s.goChild);
  const goParent = useBraillix((s) => s.goParent);
  const sayCurrent = useBraillix((s) => s.sayCurrent);
  const settings = useBraillix((s) => s.settings);
  const updateSettings = useBraillix((s) => s.updateSettings);
  const speechCap = useBraillix((s) => s.capabilities.speech);
  const activeCells = useBraillix((s) => s.activeCells);
  const spokenText = useBraillix((s) => s.spokenText);

  // Keyboard navigation. Bound at the document so the reader never has to hunt for focus —
  // suppressed while typing, because the expression field needs its own arrow keys.
  useEffect(() => {
    if (mode !== 'explore') return;

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable === true;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goSibling(-1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          goSibling(1);
          break;
        case 'ArrowDown':
        case 'Enter':
          event.preventDefault();
          goChild();
          break;
        case 'ArrowUp':
        case 'Escape':
          event.preventDefault();
          goParent();
          break;
        case ' ':
          event.preventDefault();
          sayCurrent();
          break;
        case 'e':
        case 'E':
          event.preventDefault();
          toggleExpanded();
          break;
        default:
          break;
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mode, goSibling, goChild, goParent, sayCurrent, toggleExpanded]);

  const structureUnavailable = tree === null;

  return (
    <section className="reader" aria-labelledby="reader-heading">
      <div className="reader__head">
        <h2 id="reader-heading" className="read__h2">
          How to read it
        </h2>
        <div className="segmented" role="group" aria-label="Reading mode">
          <button
            type="button"
            className={`segmented__btn${mode === 'whole' ? ' is-current' : ''}`}
            aria-pressed={mode === 'whole'}
            onClick={() => setMode('whole')}
          >
            Whole expression
          </button>
          <button
            type="button"
            className={`segmented__btn${mode === 'explore' ? ' is-current' : ''}`}
            aria-pressed={mode === 'explore'}
            disabled={structureUnavailable}
            data-testid="mode-explore"
            onClick={() => setMode('explore')}
          >
            Explore structure
          </button>
        </div>
      </div>

      {mode === 'whole' ? (
        <p className="reader__blurb">
          Every cell of the expression in order — what a conventional braille display does. On{' '}
          <strong>one</strong> cell that is {activeCells.length} separate readings, with nothing to
          tell you where you are. Try <em>Explore structure</em>.
        </p>
      ) : (
        <>
          <p className="reader__crumbs" data-testid="breadcrumb">
            {crumbs || '—'}
          </p>

          <p className="reader__blurb" data-testid="fold-state">
            You are on <strong>{nodeLabel || 'nothing'}</strong>.{' '}
            {expanded
              ? 'Showing it in full.'
              : foldReason
                ? `Shown in full — ${foldReason}.`
                : 'Its parts are folded into ⠿ — step into one to read it.'}
          </p>

          <div className="dpad" role="group" aria-label="Move through the expression">
            <button
              type="button"
              className="dpad__btn dpad__btn--up"
              disabled={!canGo.out}
              data-testid="go-out"
              onClick={goParent}
            >
              <span aria-hidden="true">↑</span>
              <span className="dpad__label">Out</span>
            </button>
            <button
              type="button"
              className="dpad__btn dpad__btn--left"
              disabled={!canGo.left}
              data-testid="go-prev"
              onClick={() => goSibling(-1)}
            >
              <span aria-hidden="true">←</span>
              <span className="dpad__label">Prev</span>
            </button>
            <button
              type="button"
              className="dpad__btn dpad__btn--mid"
              data-testid="say"
              onClick={sayCurrent}
              disabled={!settings.speechOn || speechCap.state === 'unavailable'}
            >
              <span aria-hidden="true">♪</span>
              <span className="dpad__label">Say</span>
            </button>
            <button
              type="button"
              className="dpad__btn dpad__btn--right"
              disabled={!canGo.right}
              data-testid="go-next"
              onClick={() => goSibling(1)}
            >
              <span aria-hidden="true">→</span>
              <span className="dpad__label">Next</span>
            </button>
            <button
              type="button"
              className="dpad__btn dpad__btn--down"
              disabled={!canGo.in}
              data-testid="go-in"
              onClick={goChild}
            >
              <span aria-hidden="true">↓</span>
              <span className="dpad__label">In</span>
            </button>
          </div>

          <div className="reader__row">
            <button type="button" className="btn" onClick={toggleExpanded} data-testid="toggle-expanded">
              {expanded ? 'Fold the parts back up' : 'Show this part in full'}
            </button>
            <p className="reader__keys">
              <kbd>←</kbd> <kbd>→</kbd> move · <kbd>↓</kbd> in · <kbd>↑</kbd> out · <kbd>space</kbd> say ·{' '}
              <kbd>E</kbd> expand
            </p>
          </div>

          {spokenText && (
            <p className="reader__spoken" data-testid="spoken-text">
              <span className="reader__spokenlabel">Spoken</span>
              <span lang={settings.speechLocale}>{spokenText}</span>
            </p>
          )}

          <p className="reader__pod">
            The same three moves are the pod’s three buttons: <strong>Prev</strong>,{' '}
            <strong>Select</strong> (in; hold to go out), <strong>Next</strong>.
          </p>
        </>
      )}

      <div className="reader__speech">
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.speechOn}
            onChange={(event) => updateSettings({ speechOn: event.target.checked })}
          />
          <span>Speak as I read</span>
        </label>

        <label className="switch">
          <span className="switch__label">Voice</span>
          <select
            className="select"
            value={settings.speechLocale}
            name="speech-locale" data-testid="speech-locale"
            onChange={(event) => updateSettings({ speechLocale: event.target.value as 'en' | 'hi' })}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </label>

        <label className="switch">
          <span className="switch__label">Rate</span>
          <input
            type="range"
            min={0.6}
            max={1.6}
            step={0.1}
            value={settings.speechRate}
            className="switch__range"
            onChange={(event) => updateSettings({ speechRate: Number(event.target.value) })}
          />
        </label>
      </div>

      {structureUnavailable && (
        <p className="notice notice--warn">
          Structure analysis isn’t available for this expression, so exploring is switched off.
          Reading the whole expression still works.
        </p>
      )}
    </section>
  );
}
