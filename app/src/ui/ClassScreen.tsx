/**
 * The Class screen — the half of this product that is not about braille at all.
 *
 * Research (RESEARCH.md part two, verdict 4) says the shape a school expects is already proven, by
 * an Indian company, in literacy: the teacher prepares content, sets it, and sees what the class
 * did — offline, in their own language. Nobody has done it for mathematics. This is that, for
 * mathematics.
 *
 * Three tabs and no fourth, because the fourth is where school software turns into paperwork:
 * worksheets (what to read), students (who reads it), records (what happened). Everything is
 * written to this laptop the moment it changes — there is no save button, because a save button is
 * a way to lose a lesson.
 */

import { useRef, useState, type ClipboardEvent } from 'react';
import { useBraillix } from '../store';
import { progressByStudent, recordsToCsv, useClass } from '../class/store';
import { deserialiseClassData, serialiseClassData, FILE_EXTENSION } from '../class/storage';
import type { Worksheet } from '../class/types';
import { translateMixed } from '../core/mixed';
import { worksheetToBrf } from '../core/brf';
import { SourcePreview } from './SourcePreview';
import { PrintSheet } from './PrintSheet';
import { TeachMode } from './TeachMode';
import { useT, type StringKey } from './i18n';
import './ClassScreen.css';

type Tab = 'worksheets' | 'students' | 'records';

const TABS: { id: Tab; label: StringKey }[] = [
  { id: 'worksheets', label: 'class.worksheets' },
  { id: 'students', label: 'class.students' },
  { id: 'records', label: 'class.records' },
];

/** Hand the browser a file. The only "export" a school laptop with no network can use. */
function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next turn: revoking synchronously can beat the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ClassScreen() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('worksheets');
  const [teaching, setTeaching] = useState<Worksheet | null>(null);

  return (
    <div className="cls">
      <header className="cls__head">
        <h1 className="read__title">{t('class.title')}</h1>
        <p className="read__lede">{t('class.lede')}</p>
      </header>

      <div className="segmented cls__tabs" role="group" aria-label={t('class.tabs')}>
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`segmented__btn${tab === entry.id ? ' is-current' : ''}`}
            aria-pressed={tab === entry.id}
            data-testid={`class-${entry.id}`}
            onClick={() => setTab(entry.id)}
          >
            {t(entry.label)}
          </button>
        ))}
      </div>

      {tab === 'worksheets' && <Worksheets onTeach={setTeaching} />}
      {tab === 'students' && <Students />}
      {tab === 'records' && <Records />}

      {teaching && <TeachMode worksheet={teaching} onClose={() => setTeaching(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ worksheets */

function Worksheets({ onTeach }: { onTeach: (worksheet: Worksheet) => void }) {
  const t = useT();
  const worksheets = useClass((s) => s.worksheets);
  const currentId = useClass((s) => s.currentWorksheetId);
  const setCurrent = useClass((s) => s.setCurrentWorksheet);
  const addWorksheet = useClass((s) => s.addWorksheet);

  const current = worksheets.find((sheet) => sheet.id === currentId) ?? worksheets[0] ?? null;

  return (
    <div className="cls__grid">
      <nav className="panel cls__list" aria-label={t('class.worksheets')}>
        <button
          type="button"
          className="btn btn--primary cls__new"
          data-testid="new-worksheet"
          onClick={() => addWorksheet(t('class.untitled'), Date.now())}
        >
          + {t('class.newWorksheet')}
        </button>

        {worksheets.length === 0 ? (
          <p className="cls__empty">{t('class.noWorksheets')}</p>
        ) : (
          <ol className="lessons">
            {worksheets.map((sheet) => (
              <li key={sheet.id}>
                <button
                  type="button"
                  className={`lessons__btn${sheet.id === current?.id ? ' is-current' : ''}`}
                  data-testid={`worksheet-${sheet.id}`}
                  aria-label={`${sheet.title} — ${
                    sheet.items.length === 1 ? t('class.itemsOne') : t('class.items', { count: sheet.items.length })
                  }`}
                  onClick={() => setCurrent(sheet.id)}
                >
                  <span className="lessons__title">{sheet.title}</span>
                  <span className="lessons__score num">{sheet.items.length}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </nav>

      {current ? <WorksheetEditor worksheet={current} onTeach={onTeach} /> : <div />}
    </div>
  );
}

function WorksheetEditor({ worksheet, onTeach }: { worksheet: Worksheet; onTeach: (worksheet: Worksheet) => void }) {
  const t = useT();
  const rename = useClass((s) => s.renameWorksheet);
  const addItem = useClass((s) => s.addItem);
  const [pasted, setPasted] = useState<number | null>(null);
  const removeItem = useClass((s) => s.removeItem);
  const moveItem = useClass((s) => s.moveItem);
  const deleteWorksheet = useClass((s) => s.deleteWorksheet);
  const setSource = useBraillix((s) => s.setSource);
  const setView = useBraillix((s) => s.setView);

  const [draft, setDraft] = useState('');

  /**
   * The worksheet as an embosser file.
   *
   * Translating here rather than storing the braille: what is embossed must be what the display
   * would show today, not what it would have shown when the item was typed.
   */
  async function saveForEmbosser() {
    const items = await Promise.all(
      worksheet.items.map(async (item) => ({ cells: (await translateMixed(item.source)).cells })),
    );
    const name = worksheet.title.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'worksheet';
    download(`${name}.brf`, worksheetToBrf(items), 'application/octet-stream');
  }

  function add() {
    const text = draft.trim();
    if (!text) return;
    addItem(worksheet.id, text, Date.now());
    setDraft('');
  }

  /**
   * A whole exercise, pasted.
   *
   * An exercise in a textbook is a numbered list, and a teacher preparing a lesson had to add it one
   * question at a time — twelve fields, twelve clicks, for one evening's worth of homework. Pasting
   * several lines now makes several questions, which is what anybody would expect it to do and what
   * it quietly did not.
   *
   * The numbering is stripped, because Braillix numbers the items itself and a braille reader would
   * otherwise meet "1. 1." at the top of every question. `\d+[.)]` only counts when a space
   * follows, so 1.5 keeps its decimal point.
   */
  function paste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData('text');
    if (!/\r|\n/.test(text)) return; // one line: let the field do what fields do

    const lines = text
      .split(/\r\n|\r|\n/)
      .map((line) => line.replace(/^\s*(?:Q\s*)?\d+\s*[.)]\s+/i, '').trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    event.preventDefault();
    let at = Date.now();
    for (const line of lines) {
      addItem(worksheet.id, line, at);
      at += 1; // distinct ids, and the order they were written in
    }
    setDraft('');
    setPasted(lines.length);
  }

  return (
    <section className="panel cls__editor" aria-label={worksheet.title}>
      <div className="cls__editorhead">
        <label className="field cls__namefield">
          <span className="field__label">{t('class.worksheetName')}</span>
          <input
            className="field__input"
            value={worksheet.title}
            name="worksheet-title"
            data-testid="worksheet-title"
            onChange={(event) => rename(worksheet.id, event.target.value, Date.now())}
          />
        </label>
        <div className="cls__editoractions">
          <button
            type="button"
            className="btn"
            disabled={worksheet.items.length === 0}
            data-testid="print-worksheet"
            onClick={() => window.print()}
          >
            {t('class.print')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={worksheet.items.length === 0}
            data-testid="save-brf"
            onClick={() => void saveForEmbosser()}
          >
            {t('class.brf')}
          </button>
          <button
            type="button"
            className="btn btn--primary cls__teach"
            disabled={worksheet.items.length === 0}
            data-testid="teach"
            onClick={() => onTeach(worksheet)}
          >
            {t('class.teach')} →
          </button>
        </div>
      </div>

      {worksheet.items.length === 0 ? (
        <p className="cls__empty">{t('class.noItems')}</p>
      ) : (
        <ol className="cls__items" data-testid="worksheet-items">
          {worksheet.items.map((item, index) => (
            <li key={item.id} className="cls__item">
              <span className="cls__itemnum num">{index + 1}</span>
              <div className="cls__itembody">
                <SourcePreview source={item.source} />
                <code className="cls__itemsource">{item.source}</code>
                {item.note && <span className="cls__itemnote">{item.note}</span>}
              </div>
              <div className="cls__itemactions">
                <button
                  type="button"
                  className="btn"
                  title={t('class.putOnBoard')}
                  aria-label={t('class.putOnBoard')}
                  onClick={() => {
                    setSource(item.source);
                    setView('board');
                  }}
                >
                  ▸
                </button>
                <button
                  type="button"
                  className="btn"
                  title={t('class.moveUp')}
                  aria-label={t('class.moveUp')}
                  disabled={index === 0}
                  onClick={() => moveItem(worksheet.id, item.id, -1, Date.now())}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn"
                  title={t('class.moveDown')}
                  aria-label={t('class.moveDown')}
                  disabled={index === worksheet.items.length - 1}
                  onClick={() => moveItem(worksheet.id, item.id, 1, Date.now())}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn"
                  title={t('class.removeItem')}
                  aria-label={t('class.removeItem')}
                  data-testid={`remove-${item.id}`}
                  onClick={() => removeItem(worksheet.id, item.id, Date.now())}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <label className="field cls__addfield">
        <span className="field__label">{t('class.addItem')}</span>
        <div className="hw__row">
          <input
            className="field__input num"
            value={draft}
            spellCheck={false}
            name="new-item"
            data-testid="new-item"
            onChange={(event) => setDraft(event.target.value)}
            onPaste={paste}
            onKeyDown={(event) => {
              if (event.key === 'Enter') add();
            }}
          />
          <button type="button" className="btn" data-testid="add-item" onClick={add}>
            {t('class.add')}
          </button>
        </div>
      </label>
      <p className="field__help">{t('class.addItemHint')}</p>
      {pasted !== null && (
        <p className="notice cls__pasted" role="status" data-testid="pasted-count">
          {pasted === 1 ? t('class.pastedOne') : t('class.pasted', { count: pasted })}
        </p>
      )}
      {draft.trim() && <SourcePreview source={draft} />}

      {/* Present in the page, invisible until somebody prints — so the sheet can never drift
          away from what is on screen. */}
      <PrintSheet worksheet={worksheet} />

      <div className="cls__danger">
        <button
          type="button"
          className="btn"
          data-testid="delete-worksheet"
          onClick={() => {
            if (window.confirm(t('class.confirmDelete', { name: worksheet.title }))) deleteWorksheet(worksheet.id);
          }}
        >
          {t('class.deleteWorksheet')}
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ students */

function Students() {
  const t = useT();
  const students = useClass((s) => s.students);
  const addStudent = useClass((s) => s.addStudent);
  const removeStudent = useClass((s) => s.removeStudent);
  const currentStudentId = useClass((s) => s.currentStudentId);
  const setCurrentStudent = useClass((s) => s.setCurrentStudent);

  const [name, setName] = useState('');
  const [group, setGroup] = useState('');

  function add() {
    if (!name.trim()) return;
    addStudent(name.trim(), group.trim() || undefined, Date.now());
    setName('');
  }

  return (
    <div className="cls__grid">
      <section className="panel" aria-label={t('class.addStudent')}>
        <label className="field">
          <span className="field__label">{t('class.studentName')}</span>
          <input
            className="field__input"
            value={name}
            name="student-name"
            data-testid="student-name"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') add();
            }}
          />
        </label>
        <label className="field">
          <span className="field__label">{t('class.studentGroup')}</span>
          <input
            className="field__input"
            value={group}
            name="student-group"
            data-testid="student-group"
            onChange={(event) => setGroup(event.target.value)}
          />
        </label>
        <div className="hw__actions">
          <button type="button" className="btn btn--primary" data-testid="add-student" onClick={add}>
            {t('class.addStudent')}
          </button>
        </div>

        <label className="field cls__whofield">
          <span className="field__label">{t('class.atTheDisplay')}</span>
          <select
            className="select"
            value={currentStudentId ?? ''}
            name="current-student"
            data-testid="current-student"
            onChange={(event) => setCurrentStudent(event.target.value || null)}
          >
            <option value="">{t('class.nobody')}</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
                {student.group ? ` · ${student.group}` : ''}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel" aria-label={t('class.students')}>
        {students.length === 0 ? (
          <p className="cls__empty">{t('class.noStudents')}</p>
        ) : (
          <ul className="cls__students" data-testid="student-list">
            {students.map((student) => (
              <li key={student.id} className="cls__student">
                <span className="cls__studentname">{student.name}</span>
                {student.group && <span className="cls__studentgroup">{student.group}</span>}
                <button
                  type="button"
                  className="btn"
                  data-testid={`remove-student-${student.id}`}
                  onClick={() => {
                    if (window.confirm(t('class.confirmRemoveStudent', { name: student.name })))
                      removeStudent(student.id);
                  }}
                >
                  {t('class.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ records */

function Records() {
  const t = useT();
  const data = useClass();
  const mergeIn = useClass((s) => s.mergeIn);
  const eraseAll = useClass((s) => s.eraseAll);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const progress = progressByStudent(data);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    const result = deserialiseClassData(text);
    if (result.error || (result.summary.worksheets === 0 && result.summary.students === 0)) {
      setFailed(true);
      setMessage(t('class.importFailed'));
      return;
    }
    mergeIn(result.data);
    setFailed(false);
    setMessage(
      t('class.imported', {
        worksheets: result.summary.worksheets,
        items: result.summary.items,
        students: result.summary.students,
        records: result.summary.records,
      }),
    );
  }

  return (
    <div className="cls__records">
      <section className="panel" aria-label={t('class.records')}>
        {progress.length === 0 ? (
          <p className="cls__empty">{t('class.noRecords')}</p>
        ) : (
          <table className="wire cls__table">
            <thead>
              <tr>
                <th scope="col">{t('class.colStudent')}</th>
                <th scope="col">{t('class.colGroup')}</th>
                <th scope="col">{t('class.colAttempts')}</th>
                <th scope="col">{t('class.colCorrect')}</th>
                <th scope="col">{t('class.colLast')}</th>
              </tr>
            </thead>
            <tbody data-testid="progress-table">
              {progress.map((row) => (
                <tr key={row.student.id}>
                  <td>{row.student.name}</td>
                  <td>{row.student.group ?? '—'}</td>
                  <td className="num">{row.attempts}</td>
                  <td className="num">{row.correct}</td>
                  <td className="num">
                    {row.lastAt ? new Date(row.lastAt).toLocaleDateString() : t('class.never')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel" aria-label={t('class.exportAll')}>
        <div className="hw__actions">
          <button
            type="button"
            className="btn"
            data-testid="export-csv"
            disabled={data.records.length === 0}
            onClick={() => download('braillix-records.csv', recordsToCsv(data), 'text/csv')}
          >
            {t('class.exportCsv')}
          </button>
          <button
            type="button"
            className="btn"
            data-testid="export-all"
            onClick={() => download(`braillix-class${FILE_EXTENSION}`, serialiseClassData(data), 'application/json')}
          >
            {t('class.exportAll')}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="visually-hidden"
            name="import-file"
            aria-label={t('class.import')}
            data-testid="import-file"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          <button type="button" className="btn" data-testid="import" onClick={() => fileInput.current?.click()}>
            {t('class.import')}
          </button>
        </div>

        {message && (
          <p className={`notice ${failed ? 'notice--bad' : ''}`} role="status" data-testid="import-message">
            {message}
          </p>
        )}

        <p className="hw__note">{t('class.privacy')}</p>

        <div className="cls__danger">
          <button
            type="button"
            className="btn"
            data-testid="erase-class"
            onClick={() => {
              if (window.confirm(t('class.confirmErase'))) eraseAll();
            }}
          >
            {t('class.eraseAll')}
          </button>
        </div>
      </section>
    </div>
  );
}
