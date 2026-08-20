/**
 * The Hardware screen — the seam, made visible and adjustable.
 *
 * Three things live here, and each answers a specific risk named in the brief or the handoff:
 *
 *   1. **Connection.** Simulator, USB, or Wi-Fi pod. USB is the recommendation for a demo because
 *      it needs no network, and the brief says the room's Wi-Fi may not cooperate.
 *   2. **What is actually there.** The chain is *discovered* — pods, I2C addresses, firmware — and
 *      shown, so nobody has to trust a number that came from a config file.
 *   3. **Calibration.** The handoff flags the cam bit order as unconfirmed against the physical
 *      cam. Raise one dot; if the wrong dot pops up, fix the mapping here. Ten seconds, no
 *      re-flash, no code change — and export the result for the hardware team.
 */

import { useState } from 'react';
import { useBraillix } from '../store';
import { SIMULATOR_MAX_CELLS, SIMULATOR_MIN_CELLS } from '../config';
import { DOT_COUNT, maskToUnicode, type DotNumber } from '../core/braille';
import { exportCalibration, toCam, type BitOrder } from '../core/profile';
import { dotsToMask } from '../core/braille';
import './HardwareScreen.css';

const DOTS: DotNumber[] = [1, 2, 3, 4, 5, 6];

export function HardwareScreen() {
  const profile = useBraillix((s) => s.profile);
  const linkStatus = useBraillix((s) => s.linkStatus);
  const linkLabel = useBraillix((s) => s.linkLabel);
  const linkFirmware = useBraillix((s) => s.linkFirmware);
  const linkError = useBraillix((s) => s.linkError);
  const linkFix = useBraillix((s) => s.linkFix);
  const connectUsb = useBraillix((s) => s.connectUsb);
  const connectPods = useBraillix((s) => s.connectPods);
  const switchToSimulator = useBraillix((s) => s.switchToSimulator);
  const homeDisplay = useBraillix((s) => s.homeDisplay);
  const testDot = useBraillix((s) => s.testDot);
  const testingDot = useBraillix((s) => s.testingDot);
  const setBitOrder = useBraillix((s) => s.setBitOrder);
  const setReversed = useBraillix((s) => s.setReversed);
  const setCellCount = useBraillix((s) => s.setCellCount);
  const usbCap = useBraillix((s) => s.capabilities.usb);

  const [podAddresses, setPodAddresses] = useState('192.168.1.42');
  const [copied, setCopied] = useState(false);

  const simulated = profile.source === 'simulated';

  function changeBit(dotIndex: number, bit: number) {
    // A bit order must stay a permutation, so assigning a bit swaps it with whoever had it.
    const next = [...profile.bitOrder] as number[];
    const previousHolder = next.indexOf(bit);
    if (previousHolder !== -1) next[previousHolder] = next[dotIndex];
    next[dotIndex] = bit;
    setBitOrder(next as unknown as BitOrder);
  }

  async function copyCalibration() {
    const config = exportCalibration(profile);
    const text = JSON.stringify(config, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="hw">
      <header className="hw__head">
        <h1 className="read__title">Hardware</h1>
        <p className="read__lede">
          Braillix is complete without any of this. Connect a pod and the same frames go out over
          the wire instead of onto the screen — nothing else changes.
        </p>
      </header>

      <div className="hw__grid">
        {/* ------------------------------------------------------------------ connection */}
        <section className="panel" aria-labelledby="conn-heading">
          <h2 id="conn-heading" className="panel__title">
            Connection
          </h2>

          <dl className="facts">
            <div className="facts__row">
              <dt>Now</dt>
              <dd className="num" data-testid="link-label">
                {linkLabel} · <span className={`state state--${linkStatus}`}>{linkStatus}</span>
              </dd>
            </div>
            <div className="facts__row">
              <dt>Cells</dt>
              <dd className="num" data-testid="link-cells">
                {profile.cellCount} {simulated ? '(simulated)' : '(reported by the hardware)'}
              </dd>
            </div>
            {linkFirmware && (
              <div className="facts__row">
                <dt>Firmware</dt>
                <dd className="num">{linkFirmware}</dd>
              </div>
            )}
            <div className="facts__row">
              <dt>Pods</dt>
              <dd className="num">
                {profile.pods
                  .map((pod) =>
                    pod.cellAddrs.length
                      ? `${pod.label}: ${pod.cellAddrs.map((a) => `0x${a.toString(16)}`).join(' ')}`
                      : pod.label,
                  )
                  .join(' · ')}
              </dd>
            </div>
          </dl>

          <div className="hw__actions">
            <button type="button" className="btn" onClick={() => void switchToSimulator()} data-testid="use-sim">
              Use the simulator
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void connectUsb()}
              disabled={usbCap.state === 'unavailable'}
              data-testid="connect-usb"
              title={usbCap.state === 'unavailable' ? (usbCap.reason ?? '') : 'Recommended for demos — no network needed'}
            >
              Connect over USB
            </button>
          </div>

          <label className="field field--inline">
            <span className="field__label">Wi-Fi pods (comma separated)</span>
            <div className="hw__row">
              <input
                className="field__input num"
                value={podAddresses}
                spellCheck={false}
                name="pod-hosts" data-testid="pod-hosts"
                onChange={(event) => setPodAddresses(event.target.value)}
              />
              <button
                type="button"
                className="btn"
                data-testid="connect-pods"
                onClick={() => void connectPods(podAddresses.split(','))}
              >
                Connect
              </button>
            </div>
          </label>
          <p className="hw__note">
            No pod on the bench? Run <code>npm run pod</code> and connect to{' '}
            <code>127.0.0.1:8080</code> — it speaks the real protocol.
          </p>

          {linkError && (
            <p className="notice notice--bad" role="alert" data-testid="link-error">
              {linkError}
              {linkFix && <span className="notice__fix">{linkFix}</span>}
            </p>
          )}

          {simulated && (
            <label className="cellcount cellcount--block">
              <span className="cellcount__label">Simulated cells</span>
              <input
                className="cellcount__range"
                type="range"
                min={SIMULATOR_MIN_CELLS}
                max={SIMULATOR_MAX_CELLS}
                value={profile.cellCount}
                name="hw-cell-count" data-testid="hw-cell-count"
                onChange={(event) => setCellCount(Number(event.target.value))}
              />
              <output className="cellcount__value num">{profile.cellCount}</output>
            </label>
          )}
        </section>

        {/* ------------------------------------------------------------------ calibration */}
        <section className="panel" aria-labelledby="cal-heading">
          <h2 id="cal-heading" className="panel__title">
            Calibration
          </h2>
          <p className="panel__lede">
            The handoff flags one thing as unconfirmed: whether dot 1 really drives cam track 0.
            Raise one dot below and look at the cell. If a different dot pops up, correct the
            mapping here — it is a setting, not a code change.
          </p>

          <div className="dottest" role="group" aria-label="Raise a single dot">
            {DOTS.map((dot) => (
              <button
                key={dot}
                type="button"
                className={`dottest__btn${testingDot === dot ? ' is-current' : ''}`}
                data-testid={`test-dot-${dot}`}
                onClick={() => void testDot(testingDot === dot ? null : dot)}
              >
                <span className="dottest__num num">{dot}</span>
                <span className="dottest__cam num">cam {toCam(profile, dotsToMask([dot]))}</span>
              </button>
            ))}
            <button type="button" className="btn" onClick={() => void testDot(null)} data-testid="test-clear">
              Clear
            </button>
          </div>

          <table className="bitmap">
            <caption className="visually-hidden">Which cam track each dot drives</caption>
            <thead>
              <tr>
                <th scope="col">Dot</th>
                <th scope="col">Cam track bit</th>
              </tr>
            </thead>
            <tbody>
              {profile.bitOrder.map((bit, dotIndex) => (
                <tr key={dotIndex}>
                  <th scope="row" className="num">
                    dot {dotIndex + 1}
                  </th>
                  <td>
                    <select
                      className="select num"
                      value={bit}
                      name={`bit-for-dot-${dotIndex + 1}`}
                      data-testid={`bit-for-dot-${dotIndex + 1}`}
                      onChange={(event) => changeBit(dotIndex, Number(event.target.value))}
                    >
                      {Array.from({ length: DOT_COUNT }, (_, b) => (
                        <option key={b} value={b}>
                          bit {b}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <label className="switch">
            <input
              type="checkbox"
              checked={profile.reversed}
              data-testid="reversed"
              onChange={(event) => setReversed(event.target.checked)}
            />
            <span>Cell 1 is on the right (dock assembled the other way round)</span>
          </label>

          <div className="hw__actions">
            <button type="button" className="btn" onClick={() => void homeDisplay()} data-testid="home">
              Home every cell
            </button>
            <button type="button" className="btn" onClick={() => void copyCalibration()} data-testid="copy-calibration">
              {copied ? 'Copied' : 'Copy config for the hardware team'}
            </button>
          </div>

          <p className="hw__note">
            Sanity check: with this mapping, <code>{maskToUnicode(dotsToMask([1, 2, 5]))}</code> (dots
            1-2-5) is cam position <strong className="num">{toCam(profile, dotsToMask([1, 2, 5]))}</strong>.
            The handoff’s worked example says 19 — if these disagree, the mapping above is not the
            one the cam was cut for.
          </p>
        </section>
      </div>

      <section className="panel" aria-labelledby="proto-heading">
        <h2 id="proto-heading" className="panel__title">
          What goes over the wire
        </h2>
        <p className="panel__lede">
          The pod never sees braille, a language, or a maths code — only cam numbers 0–63. That is
          what lets the translation change without anyone reflashing a board.
        </p>
        <pre className="wirecode">
{`GET  /chain   → {"cells":[32,33,34,35],"count":4,"firmware":"braillix-pod/1.0"}
POST /show    ← {"positions":[19,5,12,60]}        full frame
POST /show    ← {"updates":[{"cell":2,"position":19}]}   only what changed
POST /home    ← {}
GET  /buttons → {"prev":0,"select":1,"next":0,"seq":42}`}
        </pre>
        <p className="hw__note">
          Full specification in <code>docs/PROTOCOL.md</code>. The same verbs work over USB serial as
          newline-delimited JSON at 115200 baud, so one firmware serves both links.
        </p>
      </section>
    </div>
  );
}
