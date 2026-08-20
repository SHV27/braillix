/**
 * The Recognise screen — a photograph of handwritten maths becomes moving dots.
 *
 * Three ways in (camera, file, drawing) and one rule that governs all of them: **the model never
 * gets the last word**. Every result lands in an editable field with an honest quality note, and
 * nothing reaches the display until a human presses "Read this". A recogniser that commits its own
 * output is a recogniser that will, one day, teach a child the wrong equation.
 */

import { useEffect, useRef, useState } from 'react';
import { useBraillix } from '../store';
import { imageWarning, prepareImage, type PreparedImage } from '../recognise/preprocess';
import { OnDeviceRecogniser } from '../recognise/ondevice';
import type { ProviderStatus, RecognitionResult } from '../recognise/types';
import { DrawPad } from './DrawPad';
import './RecogniseScreen.css';

const recogniser = new OnDeviceRecogniser();

type Source = { url: string; label: string } | null;

export function RecogniseScreen() {
  const setLatex = useBraillix((s) => s.setLatex);
  const setView = useBraillix((s) => s.setView);
  const setCapability = useBraillix((s) => s.setCapability);

  const [status, setStatus] = useState<ProviderStatus>({ state: 'unavailable', reason: 'checking…' });
  const [progress, setProgress] = useState<{ value: number; message: string } | null>(null);
  const [source, setSource] = useState<Source>(null);
  const [prepared, setPrepared] = useState<PreparedImage | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'photo' | 'draw'>('photo');

  const fileInput = useRef<HTMLInputElement>(null);
  const previewCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    void recogniser.probe().then((probed) => {
      if (cancelled) return;
      setStatus(probed);
      setCapability('recognition', {
        state: probed.state === 'unavailable' ? 'unavailable' : 'ready',
        label: 'Recognition',
        reason: probed.state === 'unavailable' ? (probed.reason ?? 'unavailable') : 'on this device, offline',
        fix: probed.fix,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [setCapability]);

  /** Draw what the model will actually see — the honest preview, after cropping and inversion. */
  useEffect(() => {
    const canvas = previewCanvas.current;
    if (!canvas || !prepared) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = Math.sqrt(prepared.pixels.length);
    canvas.width = size;
    canvas.height = size;
    const image = ctx.createImageData(size, size);
    for (let i = 0; i < prepared.pixels.length; i += 1) {
      // Undo the normalisation for display purposes only.
      const value = Math.max(0, Math.min(255, Math.round((prepared.pixels[i] * 0.1738 + 0.7931) * 255)));
      image.data[i * 4] = value;
      image.data[i * 4 + 1] = value;
      image.data[i * 4 + 2] = value;
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, [prepared]);

  async function accept(url: string, label: string) {
    setError(null);
    setResult(null);
    setSource({ url, label });
    try {
      const image = await prepareImage(url);
      setPrepared(image);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPrepared(null);
    }
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    accept(URL.createObjectURL(file), file.name).catch(() => {});
  }

  async function run() {
    if (!prepared) return;
    setBusy(true);
    setError(null);
    try {
      if (status.state !== 'ready') {
        await recogniser.load((value, message) => setProgress({ value, message }));
        setProgress(null);
        setStatus({ state: 'ready' });
      }
      recogniser.setInkCoverage(prepared.inkCoverage);
      // The pixel buffer is transferred to the worker, so hand over a copy and keep the preview.
      const outcome = await recogniser.recognise(new Float32Array(prepared.pixels));
      setResult(outcome);
      setDraft(outcome.latex);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }

  function sendToDisplay() {
    if (!draft.trim()) return;
    setLatex(draft);
    setView('read');
  }

  const warning = prepared ? imageWarning(prepared) : null;

  return (
    <div className="rec">
      <header className="rec__head">
        <h1 className="read__title">Read handwriting</h1>
        <p className="read__lede">
          Photograph an equation, upload a picture, or write one with the mouse. It is recognised{' '}
          <strong>on this laptop</strong> — nothing is uploaded anywhere, ever.
        </p>
      </header>

      {status.state === 'unavailable' && (
        <p className="notice notice--warn" data-testid="rec-unavailable">
          <strong>Recognition is not installed.</strong> {status.reason}
          {status.fix && <span className="notice__fix">{status.fix}</span>}
          <span className="notice__fix">
            Everything else in Braillix works exactly as it does with it — you can type the
            expression on the Read screen instead.
          </span>
        </p>
      )}

      <div className="rec__grid">
        <section className="panel" aria-labelledby="input-heading">
          <h2 id="input-heading" className="panel__title">
            The image
          </h2>

          <div className="segmented" role="group" aria-label="How to provide the maths">
            <button
              type="button"
              className={`segmented__btn${mode === 'photo' ? ' is-current' : ''}`}
              aria-pressed={mode === 'photo'}
              onClick={() => setMode('photo')}
            >
              Photo or file
            </button>
            <button
              type="button"
              className={`segmented__btn${mode === 'draw' ? ' is-current' : ''}`}
              aria-pressed={mode === 'draw'}
              data-testid="mode-draw"
              onClick={() => setMode('draw')}
            >
              Write it
            </button>
          </div>

          {mode === 'photo' ? (
            <>
              <div className="rec__actions">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="visually-hidden"
                  name="image" data-testid="file-input"
                  onChange={(event) => onFile(event.target.files?.[0])}
                />
                <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
                  Choose a photo
                </button>
              </div>
              <p className="hw__note">
                On a phone this opens the camera. On a laptop, pick a picture — there are some
                ready-made ones below.
              </p>
              <SampleImages onPick={accept} />
            </>
          ) : (
            <DrawPad onDone={(url) => accept(url, 'drawing')} />
          )}
        </section>

        <section className="panel" aria-labelledby="result-heading">
          <h2 id="result-heading" className="panel__title">
            What it read
          </h2>

          {!prepared && <p className="evidence__empty">Choose or draw something and it will appear here.</p>}

          {prepared && (
            <>
              <div className="rec__preview">
                <canvas ref={previewCanvas} className="rec__canvas" aria-label="What the recogniser sees" />
                <ul className="rec__facts num">
                  <li>{source?.label}</li>
                  {prepared.inverted && <li>inverted (light writing on a dark background)</li>}
                  <li>cropped to the writing</li>
                </ul>
              </div>

              {warning && <p className="notice notice--warn">{warning}</p>}

              <div className="rec__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => void run()}
                  disabled={busy || status.state === 'unavailable'}
                  data-testid="run-recognition"
                >
                  {busy ? 'Reading…' : 'Read this image'}
                </button>
              </div>

              {progress && (
                <p className="rec__progress num" role="status">
                  {progress.message}
                  <span className="rec__bar" style={{ ['--p' as string]: `${Math.round(progress.value * 100)}%` }} />
                </p>
              )}

              {error && (
                <p className="notice notice--bad" role="alert" data-testid="rec-error">
                  {error}
                  <span className="notice__fix">
                    You can always type the expression by hand on the Read screen.
                  </span>
                </p>
              )}
            </>
          )}

          {result && (
            <>
              <p className={`quality quality--${result.quality}`} data-testid="rec-quality">
                <strong>{qualityLabel(result.quality)}</strong>
                <span className="num"> · {result.ms} ms · on this device</span>
              </p>
              <ul className="rec__notes">
                {result.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>

              <label className="field">
                <span className="field__label">Recognised maths — correct it if it is wrong</span>
                <textarea
                  className="field__input num"
                  rows={3}
                  value={draft}
                  spellCheck={false}
                  name="recognised" data-testid="rec-latex"
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>

              <div className="rec__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={sendToDisplay}
                  disabled={!draft.trim()}
                  data-testid="send-to-display"
                >
                  Read this on the display →
                </button>
              </div>
              <p className="hw__note">
                Nothing reaches the display until you press that. The model’s answer is a suggestion,
                not a verdict.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function qualityLabel(quality: RecognitionResult['quality']): string {
  if (quality === 'good') return 'Looks right';
  if (quality === 'uncertain') return 'Check this one';
  return 'Probably misread';
}

/**
 * Known-good images, committed to the repository.
 *
 * The demo must never depend on the room's lighting or on a phone being to hand — a point the
 * boardroom made about OCR generally, and the cheapest insurance in the whole project.
 */
function SampleImages({ onPick }: { onPick: (url: string, label: string) => Promise<void> }) {
  const samples = [
    { file: 'quadratic.svg', label: 'Quadratic' },
    { file: 'fraction.svg', label: 'Fraction' },
    { file: 'root.svg', label: 'Square root' },
    { file: 'sum.svg', label: 'Summation' },
    { file: 'pythagoras.svg', label: 'Pythagoras' },
    { file: 'handwritten.svg', label: 'Handwritten' },
  ];

  return (
    <div className="samples" role="group" aria-label="Sample images">
      {samples.map((sample) => (
        <button
          key={sample.file}
          type="button"
          className="samples__btn"
          data-testid={`sample-${sample.file}`}
          onClick={() => void onPick(`samples/${sample.file}`, sample.label)}
        >
          <img src={`samples/${sample.file}`} alt="" className="samples__img" />
          <span className="samples__label">{sample.label}</span>
        </button>
      ))}
    </div>
  );
}
