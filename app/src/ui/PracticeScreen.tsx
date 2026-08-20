/**
 * Learn → practise → feedback, braille-first.
 *
 * The condition the boardroom put on this whole feature was that the student must answer *in
 * braille*, not by picking from a list. So there are two drills and both are real:
 *
 *   READ  — the dots go onto the display (simulated or real). You read them and type what they say.
 *   WRITE — the maths is shown and spoken. You write it back in braille, six-key, like a Perkins.
 *
 * Marking is done on braille, never on text, so any equivalent way of writing the answer is
 * accepted: what is being tested is whether you read the dots, not whether you type LaTeX the way
 * we happen to.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBraillix } from '../store';
import { LESSONS, type DrillKind, type Lesson } from '../learn/lessons';
import { mark, type Verdict } from '../learn/feedback';
import { interpretAnswer } from '../learn/answer';
import {
  EMPTY,
  KEY_TO_DOT,
  backspace,
  clear,
  describeChord,
  isSixKey,
  keyDown,
  keyUp,
  releaseAll,
  writeSpace,
  type SixKeyState,
} from '../learn/sixkey';
import {
  eraseProgress,
  itemKey,
  loadProgress,
  recordAttempt,
  saveProgress,
  summariseLesson,
  type ProgressMap,
} from '../learn/progress';
import { translateLatex } from '../core/translate';
import { maskToUnicode, type DotMask } from '../core/braille';
import { BrailleCell } from './BrailleCell';
import { DisplayDock } from './DisplayDock';
import { toCam } from '../core/profile';
import './PracticeScreen.css';

export function PracticeScreen() {
  const showCells = useBraillix((s) => s.showCells);
  const profile = useBraillix((s) => s.profile);
  const settings = useBraillix((s) => s.settings);

  const [lesson, setLesson] = useState<Lesson>(LESSONS[0]);
  const [index, setIndex] = useState(0);
  const [drill, setDrill] = useState<DrillKind>('read');
  const [expected, setExpected] = useState<DotMask[]>([]);
  const [typed, setTyped] = useState('');
  const [entry, setEntry] = useState<SixKeyState>(EMPTY);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [revealed, setRevealed] = useState(false);
  // Read once, lazily, at first render — loading in an effect would cause a cascading re-render.
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);

  const padRef = useRef<HTMLDivElement>(null);
  const item = lesson.items[index];

  /* Translate the current item and, in a reading drill, put it on the display. */
  useEffect(() => {
    let cancelled = false;
    void translateLatex(item.latex).then((translated) => {
      if (cancelled) return;
      setExpected([...translated.cells]);
      if (drill === 'read') {
        showCells(
          translated.cells,
          `Reading drill: ${translated.cells.length} cells on the display. Type what they say.`,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [item.latex, drill, showCells]);

  /* In a writing drill the display shows what the student has written so far — their own braille
     under their own fingers, which is the point of writing it. */
  useEffect(() => {
    if (drill !== 'write') return;
    showCells(entry.cells, entry.cells.length === 0 ? 'Nothing written yet.' : `${entry.cells.length} cells written.`);
  }, [drill, entry.cells, showCells]);

  const reset = useCallback(() => {
    setTyped('');
    setEntry(clear());
    setVerdict(null);
    setRevealed(false);
  }, []);

  function chooseLesson(next: Lesson) {
    setLesson(next);
    setIndex(0);
    reset();
  }

  function move(delta: 1 | -1) {
    const next = index + delta;
    if (next < 0 || next >= lesson.items.length) return;
    setIndex(next);
    reset();
  }

  async function check() {
    let result: Verdict;

    if (drill === 'read') {
      // Marked on the BRAILLE, not the spelling. A reader who felt a fraction may write "a/b";
      // several ordinary written forms are tried and the best outcome is taken, so the drill tests
      // whether they read the dots rather than whether they know our LaTeX.
      const readings = interpretAnswer(typed);
      const verdicts: Verdict[] = [];
      for (const reading of readings) {
        const translated = await translateLatex(reading);
        verdicts.push(mark(expected, [...translated.cells]));
      }
      result = verdicts.find((v) => v.correct) ?? verdicts[0] ?? mark(expected, []);
    } else {
      result = mark(expected, [...entry.cells]);
    }
    setVerdict(result);
    setProgress((current) => {
      const next = recordAttempt(current, itemKey(lesson.id, index), result.correct, Date.now());
      saveProgress(next);
      return next;
    });
  }

  /* ---- six-key keyboard handling ---- */

  useEffect(() => {
    if (drill !== 'write') return;

    const onDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (isSixKey(event.key)) {
        event.preventDefault();
        setEntry((state) => keyDown(state, event.key));
      } else if (event.key === ' ') {
        event.preventDefault();
        setEntry((state) => writeSpace(state));
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        setEntry((state) => backspace(state));
      }
    };

    const onUp = (event: KeyboardEvent) => {
      if (!isSixKey(event.key)) return;
      event.preventDefault();
      setEntry((state) => keyUp(state, event.key));
    };

    // A chord half-pressed when the window loses focus must not commit later.
    const onBlur = () => setEntry((state) => releaseAll(state));

    document.addEventListener('keydown', onDown);
    document.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('keydown', onDown);
      document.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [drill]);

  const summary = useMemo(
    () => summariseLesson(progress, lesson.id, lesson.items.length),
    [progress, lesson],
  );

  return (
    <div className="prac">
      <header className="prac__head">
        <h1 className="read__title">Practice</h1>
        <p className="read__lede">
          Read the dots, or write them yourself. Answers are marked on the <strong>braille</strong>,
          so any correct way of writing the maths counts.
        </p>
      </header>

      <DisplayDock
        title="The display"
        hint={
          drill === 'read'
            ? 'Read these dots — with your fingers on a connected display, or here on screen.'
            : 'What you write appears here, cell by cell.'
        }
      />

      <div className="prac__grid">
        <nav className="panel prac__lessons" aria-label="Lessons">
          <h2 className="panel__title">Lessons</h2>
          <ol className="lessons">
            {LESSONS.map((entryLesson) => {
              const done = summariseLesson(progress, entryLesson.id, entryLesson.items.length);
              return (
                <li key={entryLesson.id}>
                  <button
                    type="button"
                    className={`lessons__btn${entryLesson.id === lesson.id ? ' is-current' : ''}`}
                    data-testid={`lesson-${entryLesson.id}`}
                    onClick={() => chooseLesson(entryLesson)}
                  >
                    <span className="lessons__title">{entryLesson.title}</span>
                    <span className="lessons__score num">
                      {done.correct}/{done.total}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <button
            type="button"
            className="btn"
            data-testid="erase-progress"
            onClick={() => {
              eraseProgress();
              setProgress({});
            }}
          >
            Erase my progress
          </button>
          <p className="hw__note">
            Progress is stored on this computer only. Nothing is uploaded, and there is no account.
          </p>
        </nav>

        <section className="panel prac__drill" aria-labelledby="drill-heading">
          <div className="prac__drillhead">
            <h2 id="drill-heading" className="panel__title">
              {lesson.title}
            </h2>
            <div className="segmented" role="group" aria-label="Drill type">
              <button
                type="button"
                className={`segmented__btn${drill === 'read' ? ' is-current' : ''}`}
                aria-pressed={drill === 'read'}
                data-testid="drill-read"
                onClick={() => {
                  setDrill('read');
                  reset();
                }}
              >
                Read the dots
              </button>
              <button
                type="button"
                className={`segmented__btn${drill === 'write' ? ' is-current' : ''}`}
                aria-pressed={drill === 'write'}
                data-testid="drill-write"
                onClick={() => {
                  setDrill('write');
                  reset();
                }}
              >
                Write the braille
              </button>
            </div>
          </div>

          <p className="prac__rule">{lesson.rule}</p>

          <div className="prac__meta num">
            <span>
              Question {index + 1} of {lesson.items.length}
            </span>
            <span>·</span>
            <span>
              {summary.correct} of {summary.total} answered correctly
            </span>
          </div>

          {drill === 'read' ? (
            <>
              <p className="prac__prompt">
                {expected.length} cell{expected.length === 1 ? '' : 's'} are on the display
                {profile.cellCount < expected.length ? ` (${profile.cellCount} at a time)` : ''}. What does it say?
              </p>
              <label className="field">
                <span className="field__label">Your answer</span>
                <input
                  className="field__input num"
                  value={typed}
                  spellCheck={false}
                  name="answer" data-testid="answer-input"
                  placeholder="for example  1/2  or  x^2+1"
                  onChange={(event) => setTyped(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void check();
                  }}
                />
              </label>
            </>
          ) : (
            <>
              <p className="prac__prompt">
                Write this in braille: <strong className="prac__latex num">{item.latex}</strong>
              </p>

              <div className="pad6" ref={padRef} tabIndex={-1} data-testid="six-key">
                <div className="pad6__keys" aria-hidden="true">
                  {(['s', 'd', 'f', 'j', 'k', 'l'] as const).map((key) => (
                    <span
                      key={key}
                      className={`pad6__key${entry.held.includes(key) ? ' is-down' : ''}`}
                      onPointerDown={() => setEntry((state) => keyDown(state, key))}
                      onPointerUp={() => setEntry((state) => keyUp(state, key))}
                      onPointerLeave={() => setEntry((state) => keyUp(state, key))}
                    >
                      <strong>{key.toUpperCase()}</strong>
                      <small>dot {KEY_TO_DOT[key]}</small>
                    </span>
                  ))}
                </div>
                <p className="pad6__hint num" data-testid="chord-hint">
                  {describeChord(entry) || 'press the dots together, then let go'}
                </p>
              </div>

              <div className="written" data-testid="written-cells">
                {entry.cells.length === 0 ? (
                  <span className="written__empty">nothing written yet</span>
                ) : (
                  entry.cells.map((mask, cellIndex) => (
                    <BrailleCell
                      key={cellIndex}
                      dots={mask}
                      cam={toCam(profile, mask)}
                      index={cellIndex}
                      active={verdict?.firstWrongCell === cellIndex}
                      bare
                    />
                  ))
                )}
              </div>

              <div className="rec__actions">
                <button type="button" className="btn" onClick={() => setEntry((s) => writeSpace(s))}>
                  Space
                </button>
                <button type="button" className="btn" onClick={() => setEntry((s) => backspace(s))}>
                  Delete last
                </button>
                <button type="button" className="btn" onClick={() => setEntry(clear())}>
                  Start again
                </button>
              </div>
            </>
          )}

          <div className="rec__actions">
            <button type="button" className="btn btn--primary" onClick={() => void check()} data-testid="check-answer">
              Check my answer
            </button>
            <button type="button" className="btn" onClick={() => setRevealed(true)} data-testid="reveal">
              Show me
            </button>
            <button type="button" className="btn" onClick={() => move(-1)} disabled={index === 0}>
              ← Previous
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => move(1)}
              disabled={index >= lesson.items.length - 1}
              data-testid="next-question"
            >
              Next →
            </button>
          </div>

          {verdict && (
            <div
              className={`verdict verdict--${verdict.correct ? 'right' : 'wrong'}`}
              role="status"
              data-testid="verdict"
            >
              <p className="verdict__headline">{verdict.headline}</p>
              <ul className="verdict__details">
                {verdict.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
                {!verdict.correct && <li>{item.hint}</li>}
              </ul>
            </div>
          )}

          {revealed && (
            <p className="prac__answer" data-testid="revealed">
              <span className="prac__answerlabel">The answer</span>
              <span className="prac__braille">{expected.map((mask) => maskToUnicode(mask)).join('')}</span>
              <span className="num">{item.latex}</span>
            </p>
          )}

          {!settings.speechOn && drill === 'write' && (
            <p className="hw__note">Speech is switched off — turn it on from the Read screen to hear each question.</p>
          )}
        </section>
      </div>
    </div>
  );
}
