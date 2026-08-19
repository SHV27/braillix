import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { useBraillix } from './store';
import './ui/fonts.css';
import './ui/tokens.css';
import './ui/app.css';

const root = document.getElementById('root');
if (!root) throw new Error('Braillix could not find its mount point (#root).');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/**
 * A deliberate diagnostics handle.
 *
 * Braillix has a class of bug that is invisible in unit tests and only appears in a real browser —
 * speech-rule-engine returns different shapes under Node and the DOM, and the whole Reader depends
 * on what it returns. So the store is reachable from the console and from the e2e suite:
 *
 *   __braillix.getState().translation.enriched
 *
 * It exposes no secrets (there are none) and writes nothing. It is here because being able to see
 * the engine's real output on the machine that is misbehaving is worth more than the tidiness of
 * an empty global namespace.
 */
(window as unknown as Record<string, unknown>).__braillix = useBraillix;
