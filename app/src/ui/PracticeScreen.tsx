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
import { worksheetToLesson } from '../learn/worksheet-lesson';
import { useClass } from '../class/store';
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
  recordAttempt as recordProgress,
  saveProgress,
  summariseLesson,
  type ProgressMap,
} from '../learn/progress';
import { translateLatex } from '../core/translate';
import { maskToUnicode, type DotMask } from '../core/braille';
import { BrailleCell } from './BrailleCell';
import { DisplayDock } from './DisplayDock';
import { MathPreview } from './MathPreview';
import { useT, usePick, type Bilingual } from './i18n';
import { toCam } from '../core/profile';
import './PracticeScreen.css';

export function PracticeScreen() {
  const t = useT();
  const say = usePick();
  const worksheets = useClass((s) => s.worksheets);
  const currentStudentId = useClass((s) => s.currentStudentId);
  const students = useClass((s) => s.students);
  const recordAttempt = useClass((s) => s.record);
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
        showCells(translated.cells, t('prac.sayReading', { count: translated.cells.length }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [item.latex, drill, showCells, t]);

  /* In a writing drill the display shows what the student has written so far — their own braille
     under their own fingers, which is the point of writing it. */
  useEffect(() => {
    if (drill !== 'write') return;
    showCells(
      entry.cells,
      entry.cells.length === 0 ? t('prac.sayNothing') : t('prac.sayWritten', { count: entry.cells.length }),
    );
  }, [drill, entry.cells, showCells, t]);

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
    const now = Date.now();
    setProgress((current) => {
      const next = recordProgress(current, itemKey(lesson.id, index), result.correct, now);
      saveProgress(next);
      return next;
    });
    // The class record is separate from the on-device progress: one is "has this machine seen this
    // question", the other is "did Asha get it right". Only the second needs a name attached.
    if (currentStudentId) {
      recordAttempt({
        studentId: currentStudentId,
        worksheetId: lesson.id,
        itemId: itemKey(lesson.id, index),
        correct: result.correct,
        at: now,
        label: item.latex,
      });
    }
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

  /** The teacher's own worksheets, offered as drills next to the built-in curriculum. */
  const worksheetLessons = useMemo(
    () => worksheets.filter((sheet) => sheet.items.length > 0).map(worksheetToLesson),
    [worksheets],
  );
  const student = students.find((entry) => entry.id === currentStudentId) ?? null;

  return (
    <div className="prac">
      <header className="prac__head">
        <h1 className="read__title">{t('prac.title')}</h1>
        <p className="read__lede">{t('prac.lede')}</p>
      </header>

      <DisplayDock hint={drill === 'read' ? 'prac.hintRead' : 'prac.hintWrite'} />

      <div className="prac__grid">
        <nav className="panel prac__lessons" aria-label={t('prac.lessons')}>
          <h2 className="panel__title">{t('prac.lessons')}</h2>
          <ol className="lessons">
            {LESSONS.map((entryLesson) => (
              <LessonButton
                key={entryLesson.id}
                lesson={entryLesson}
                current={entryLesson.id === lesson.id}
                progress={progress}
                onChoose={chooseLesson}
                say={say}
              />
            ))}
          </ol>

          {/* The teacher's own questions, drillable exactly like the built-in curriculum. This is
              the loop closing: they wrote it this morning, the child practises it this afternoon. */}
          {worksheetLessons.length > 0 && (
            <>
              <h2 className="panel__title prac__ownheading">{t('prac.yourWorksheets')}</h2>
              <ol className="lessons">
                {worksheetLessons.map((entryLesson) => (
                  <LessonButton
                    key={entryLesson.id}
                    lesson={entryLesson}
                    current={entryLesson.id === lesson.id}
                    progress={progress}
                    onChoose={chooseLesson}
                    say={say}
                  />
                ))}
              </ol>
            </>
          )}

          <button
            type="button"
            className="btn"
            data-testid="erase-progress"
            onClick={() => {
              eraseProgress();
              setProgress({});
            }}
          >
            {t('prac.erase')}
          </button>
          <p className="hw__note">{t('prac.privacy')}</p>
        </nav>

        <section className="panel prac__drill" aria-labelledby="drill-heading">
          <div className="prac__drillhead">
            <h2 id="drill-heading" className="panel__title">
              {say(lesson.title)}
            </h2>
            <div className="segmented" role="group" aria-label={t('prac.drillType')}>
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
                {t('prac.drillRead')}
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
                {t('prac.drillWrite')}
              </button>
            </div>
          </div>

          {say(lesson.rule) && <p className="prac__rule">{say(lesson.rule)}</p>}

          <p className="prac__who" data-testid="recording-for">
            {student ? t('prac.recordingFor', { name: student.name }) : t('prac.recordingNobody')}
          </p>

          <div className="prac__meta num">
            <span>{t('prac.question', { index: index + 1, total: lesson.items.length })}</span>
            <span>·</span>
            <span>{t('prac.score', { correct: summary.correct, total: summary.total })}</span>
          </div>

          {drill === 'read' ? (
            <>
              <p className="prac__prompt">
                {profile.cellCount < expected.length
                  ? t('prac.promptReadPaged', { count: expected.length, width: profile.cellCount })
                  : t('prac.promptRead', { count: expected.length })}
              </p>
              <label className="field">
                <span className="field__label">{t('prac.yourAnswer')}</span>
                <input
                  className="field__input num"
                  value={typed}
                  spellCheck={false}
                  name="answer" data-testid="answer-input"
                  placeholder={t('prac.answerHint')}
                  onChange={(event) => setTyped(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void check();
                  }}
                />
              </label>
            </>
          ) : (
            <>
              <p className="prac__prompt">{t('prac.promptWrite')}</p>
              {/* Shown as real maths, not as LaTeX: a student writing braille should be reading
                  mathematics, and a teacher checking over their shoulder should not have to parse
                  a backslash. */}
              <MathPreview latex={item.latex} size="large" label={item.latex} />

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
                      <small>{t('prac.dot', { dot: KEY_TO_DOT[key] })}</small>
                    </span>
                  ))}
                </div>
                <p className="pad6__hint num" data-testid="chord-hint">
                  {describeChord(entry) || t('prac.chordHint')}
                </p>
              </div>

              <div className="written" data-testid="written-cells">
                {entry.cells.length === 0 ? (
                  <span className="written__empty">{t('prac.nothingWritten')}</span>
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
                  {t('prac.space')}
                </button>
                <button type="button" className="btn" onClick={() => setEntry((s) => backspace(s))}>
                  {t('prac.deleteLast')}
                </button>
                <button type="button" className="btn" onClick={() => setEntry(clear())}>
                  {t('prac.startAgain')}
                </button>
              </div>
            </>
          )}

          <div className="rec__actions">
            <button type="button" className="btn btn--primary" onClick={() => void check()} data-testid="check-answer">
              {t('prac.check')}
            </button>
            <button type="button" className="btn" onClick={() => setRevealed(true)} data-testid="reveal">
              {t('prac.reveal')}
            </button>
            <button type="button" className="btn" onClick={() => move(-1)} disabled={index === 0}>
              ← {t('display.previous')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => move(1)}
              disabled={index >= lesson.items.length - 1}
              data-testid="next-question"
            >
              {t('display.next')} →
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
                {!verdict.correct && <li>{say(item.hint)}</li>}
              </ul>
            </div>
          )}

          {revealed && (
            <p className="prac__answer" data-testid="revealed">
              <span className="prac__answerlabel">{t('prac.theAnswer')}</span>
              <span className="prac__braille">{expected.map((mask) => maskToUnicode(mask)).join('')}</span>
              <span className="num">{item.latex}</span>
            </p>
          )}

          {!settings.speechOn && drill === 'write' && (
            <p className="hw__note">{t('prac.speechOff')}</p>
          )}
        </section>
      </div>
    </div>
  );
}

/** One row of the lesson list. Extracted only so the two lists cannot drift apart. */
function LessonButton({
  lesson,
  current,
  progress,
  onChoose,
  say,
}: {
  lesson: Lesson;
  current: boolean;
  progress: ProgressMap;
  onChoose: (lesson: Lesson) => void;
  say: (text: Bilingual) => string;
}) {
  const done = summariseLesson(progress, lesson.id, lesson.items.length);
  return (
    <li>
      <button
        type="button"
        className={`lessons__btn${current ? ' is-current' : ''}`}
        data-testid={`lesson-${lesson.id}`}
        onClick={() => onChoose(lesson)}
      >
        <span className="lessons__title">{say(lesson.title)}</span>
        <span className="lessons__score num">
          {done.correct}/{done.total}
        </span>
      </button>
    </li>
  );
}
