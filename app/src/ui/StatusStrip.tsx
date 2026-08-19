/**
 * The status strip — CLAUDE.md Law 3 made visible.
 *
 * Every optional capability declares its state here, permanently, with the reason it is not ready
 * and what to do about it. A user should never have to wonder whether a feature is missing or
 * merely broken; and a panel should be able to see, at a glance, that nothing is being hidden.
 */

import { rankedCapabilities, useBraillix } from '../store';
import { describeProfile } from '../core/profile';
import './StatusStrip.css';

const STATE_LABEL: Record<string, string> = {
  ready: 'ready',
  checking: 'checking',
  degraded: 'degraded',
  unavailable: 'off',
};

export function StatusStrip() {
  const capabilities = useBraillix((s) => s.capabilities);
  const profile = useBraillix((s) => s.profile);
  const planSummary = useBraillix((s) => s.planSummary);

  const items = rankedCapabilities(capabilities);

  return (
    <footer className="strip" aria-label="System status">
      <div className="strip__group">
        <span className="strip__key">Display</span>
        <span className="strip__value num">{describeProfile(profile)}</span>
      </div>

      <div className="strip__group strip__group--grow">
        <span className="strip__key">Motion</span>
        <span className="strip__value num" data-testid="plan-summary">
          {planSummary || 'idle'}
        </span>
      </div>

      <ul className="strip__caps">
        {items.map(({ id, capability }) => (
          <li key={id} className={`cap cap--${capability.state}`}>
            <span className="cap__led" aria-hidden="true" />
            <span className="cap__label">{capability.label}</span>
            <span className="cap__state">{STATE_LABEL[capability.state] ?? capability.state}</span>
            {capability.reason && <span className="cap__reason">{capability.reason}</span>}
            {capability.fix && <span className="cap__fix">{capability.fix}</span>}
          </li>
        ))}
      </ul>
    </footer>
  );
}
