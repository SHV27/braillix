/**
 * The Board — where maths goes in and dots come out.
 *
 * This screen used to be two: "Read" (type LaTeX) and "Read handwriting" (photograph it). That was
 * an engineer's information architecture — it named the *technologies*. A teacher does not think
 * "now I will use the recogniser"; they think "I want this sum on the display", and whether it
 * arrives by typing or by camera is a detail of how they got there. So both are input methods of
 * one board, and everything downstream — the print preview, the reader, the cells — is shared.
 *
 * Three surfaces, deliberately in this order down the page:
 *   1. what you typed          — the teacher's own words
 *   2. how it reads in print   — the check a sighted teacher can actually make
 *   3. the braille and the dots — what the child gets
 */

import { useEffect, useRef, useState } from 'react';
import { useBraillix } from '../store';
import { DisplayDock } from './DisplayDock';
import { DisplayStrip } from './DisplayStrip';
import { MathKeypad, insertAtCaret } from './MathKeypad';
import { MathPreview } from './MathPreview';
import { QuestionStrip } from './QuestionStrip';
import { ReadbackPanel } from './ReadbackPanel';
import { AddToWorksheet } from './AddToWorksheet';
import { FirstRun } from './FirstRun';
import { ReaderPanel } from './ReaderPanel';
import { RecognisePanel } from './RecognisePanel';
import { useT } from './i18n';
import './ReadScreen.css';
import './BoardScreen.css';

/** One pre-loaded example so the first thing a new user sees is a working display, not a blank. */
const OPENING_EXAMPLE = 'x^2 + 3x + 2 = 0';

/**
 * Deliberately written the way a teacher would write them, not the way LaTeX wants them.
 * Every one of these is a demonstration that the box accepts ordinary maths.
 */
const EXAMPLES: { source: string; key: Parameters<ReturnType<typeof useT>>[0] }[] = [
  { source: 'x^2 + 3x + 2 = 0', key: 'ex.quadratic' },
  { source: '22/7', key: 'ex.fraction' },
  { source: 'sqrt(144) = 12', key: 'ex.root' },
  { source: '(-b +- sqrt(b^2 - 4ac))/(2a)', key: 'ex.formula' },
  { source: 'sin^2 theta + cos^2 theta = 1', key: 'ex.identity' },
  { source: '2/3 + 1/6 = 5/6', key: 'ex.addFractions' },
  { source: '45 degrees', key: 'ex.degrees' },
  { source: 'Rs 250 x 4 = Rs 1000', key: 'ex.money' },
  { source: 'दो संख्याओं का योग 12 है', key: 'ex.hindiQuestion' },
  { source: 'Find the value of 2x + 5 = 15', key: 'ex.wordProblem' },
];

type SourceTab = 'type' | 'photo';

export function BoardScreen() {
  const t = useT();
  const source = useBraillix((s) => s.source);
  const setSource = useBraillix((s) => s.setSource);
  const translation = useBraillix((s) => s.translation);
  const latex = useBraillix((s) => s.latex);
  const inputIssues = useBraillix((s) => s.inputIssues);
  const sre = useBraillix((s) => s.capabilities.sre);
  const announcement = useBraillix((s) => s.announcement);
  const spokenText = useBraillix((s) => s.spokenText);
  const mixedLine = useBraillix((s) => s.mixedLine);

  const [tab, setTab] = useState<SourceTab>('type');
  const field = useRef<HTMLTextAreaElement>(null);

  // Taste of success before any input is demanded.
  useEffect(() => {
    if (sre.state === 'ready' && source === '') setSource(OPENING_EXAMPLE);
  }, [sre.state, source, setSource]);

  const issues = translation?.issues ?? [];
  const parseIssue = issues.find((issue) => issue.kind === 'parse');

  function insert(text: string, back: number) {
    const node = field.current;
    if (!node) {
      setSource(source + text);
      return;
    }
    setSource(insertAtCaret(node, text, back));
  }

  return (
    <div className="read board">
      <section className="read__input" aria-labelledby="input-heading">
        <h1 id="input-heading" className="read__title board__title">
          {t('board.title')}
        </h1>
        <p className="read__lede">{t('board.lede')}</p>

        {/* Shown once, on a machine that has never used Braillix, and never again. */}
        <FirstRun />

        <div className="segmented board__tabs" role="group" aria-label={t('board.source')}>
          <button
            type="button"
            className={`segmented__btn${tab === 'type' ? ' is-current' : ''}`}
            aria-pressed={tab === 'type'}
            data-testid="source-type"
            onClick={() => setTab('type')}
          >
            {t('board.source.type')}
          </button>
          <button
            type="button"
            className={`segmented__btn${tab === 'photo' ? ' is-current' : ''}`}
            aria-pressed={tab === 'photo'}
            data-testid="source-photo"
            onClick={() => setTab('photo')}
          >
            {t('board.source.photo')}
          </button>
        </div>

        {tab === 'type' ? (
          <>
            <label className="field">
              <span className="field__label">{t('board.field')}</span>
              <textarea
                ref={field}
                className="field__input num"
                value={source}
                spellCheck={false}
                rows={2}
                name="expression"
                data-testid="latex-input"
                aria-describedby="input-help"
                onChange={(event) => setSource(event.target.value)}
              />
            </label>
            <p id="input-help" className="field__help">
              {t('board.help')}
            </p>

            <MathKeypad onInsert={insert} />

            <div className="board__printhead">
              <h2 className="field__label board__printlabel">
                {mixedLine ? t('board.question') : t('board.print')}
              </h2>
              {source && (
                <button type="button" className="chip" data-testid="clear-board" onClick={() => setSource('')}>
                  {t('board.clear')}
                </button>
              )}
            </div>
            {mixedLine ? (
              <QuestionStrip />
            ) : (
              <MathPreview latex={latex} label={spokenText} size="large" placeholder={t('board.print.empty')} />
            )}

            <ReadbackPanel />

            <AddToWorksheet source={source} />

            <div className="examples board__examples" role="group" aria-label={t('board.examples')}>
              {EXAMPLES.map((example) => (
                <button
                  key={example.source}
                  type="button"
                  className={`chip${source === example.source ? ' is-current' : ''}`}
                  onClick={() => setSource(example.source)}
                >
                  {t(example.key)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <RecognisePanel onSent={() => setTab('type')} />
        )}

        {/* Keyed by position, not by text: "((((" genuinely produces four identical complaints,
            and React is right to object to four children claiming the same identity. */}
        {inputIssues.map((issue, index) => (
          <p key={index} className="notice notice--warn" data-testid="input-issue">
            {issue.message}
            {issue.fix && <span className="notice__fix">{issue.fix}</span>}
          </p>
        ))}

        {parseIssue && (
          <p className="notice notice--bad" role="alert">
            <strong>{t('board.parseFailed')}</strong> {parseIssue.message}
            {parseIssue.fix && <span className="notice__fix">{parseIssue.fix}</span>}
          </p>
        )}
        {issues
          .filter((issue) => issue.kind !== 'parse')
          .map((issue, index) => (
            <p key={index} className="notice notice--warn">
              {issue.message}
              {issue.fix && <span className="notice__fix">{issue.fix}</span>}
            </p>
          ))}

      </section>

      {/* Output column: the cells, then how to read them, then the evidence for both. */}
      <div className="read__display">
        <DisplayDock />
        <ReaderPanel />
      </div>

      <DisplayStrip />

      <p className="visually-hidden" aria-live="polite" data-testid="live-region">
        {announcement}
      </p>
    </div>
  );
}
