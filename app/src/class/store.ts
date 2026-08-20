/**
 * The one owner of the teacher's class data.
 *
 * A second store, next to `src/store.ts`, on purpose. The main store owns *the display and what is
 * on it right now*; this owns *what a teacher has prepared and what their students have done*.
 * They have different lifetimes — one is a moment, the other is a term — and merging them would
 * mean every keystroke on the Board touched the same object as a student's record.
 *
 * Every mutation writes through to `localStorage` immediately. There is no save button, because a
 * save button is a way to lose a lesson.
 */

import { create } from 'zustand';
import { loadClassData, mergeClassData, newId, saveClassData, eraseClassData } from './storage';
import type { AttemptRecord, ClassData, Student, Worksheet, WorksheetItem } from './types';

interface ClassState extends ClassData {
  /** Which student the practice screen is recording against, if any. */
  currentStudentId: string | null;
  /** Which worksheet the Class screen and Teach mode are looking at. */
  currentWorksheetId: string | null;

  setCurrentStudent: (id: string | null) => void;
  setCurrentWorksheet: (id: string | null) => void;

  addWorksheet: (title: string, now: number) => string;
  renameWorksheet: (id: string, title: string, now: number) => void;
  deleteWorksheet: (id: string) => void;
  addItem: (worksheetId: string, source: string, now: number, note?: string) => string;
  updateItem: (worksheetId: string, itemId: string, patch: Partial<Omit<WorksheetItem, 'id'>>, now: number) => void;
  removeItem: (worksheetId: string, itemId: string, now: number) => void;
  moveItem: (worksheetId: string, itemId: string, direction: -1 | 1, now: number) => void;

  addStudent: (name: string, group: string | undefined, now: number) => string;
  removeStudent: (id: string) => void;

  record: (attempt: AttemptRecord) => void;

  /** Replace everything — used by import, and by "start again". */
  replaceAll: (data: ClassData) => void;
  mergeIn: (data: ClassData) => void;
  eraseAll: () => void;
}

/** Persist and return, so every mutation is one line. */
function persist(next: ClassData): ClassData {
  saveClassData(next);
  return next;
}

export const useClass = create<ClassState>((set, get) => {
  const initial = loadClassData();

  function withWorksheets(worksheets: readonly Worksheet[]): Partial<ClassState> {
    const state = get();
    return persist({ version: 1, students: state.students, worksheets, records: state.records });
  }

  function patchWorksheet(id: string, now: number, change: (sheet: Worksheet) => Worksheet): Partial<ClassState> {
    const worksheets = get().worksheets.map((sheet) =>
      sheet.id === id ? { ...change(sheet), updatedAt: now } : sheet,
    );
    return withWorksheets(worksheets);
  }

  return {
    ...initial,
    currentStudentId: null,
    currentWorksheetId: initial.worksheets[0]?.id ?? null,

    setCurrentStudent: (id) => set({ currentStudentId: id }),
    setCurrentWorksheet: (id) => set({ currentWorksheetId: id }),

    addWorksheet: (title, now) => {
      const id = newId(now);
      const sheet: Worksheet = { id, title, items: [], createdAt: now, updatedAt: now };
      set({ ...withWorksheets([...get().worksheets, sheet]), currentWorksheetId: id });
      return id;
    },

    renameWorksheet: (id, title, now) => set(patchWorksheet(id, now, (sheet) => ({ ...sheet, title }))),

    deleteWorksheet: (id) => {
      const worksheets = get().worksheets.filter((sheet) => sheet.id !== id);
      set({
        ...withWorksheets(worksheets),
        currentWorksheetId: get().currentWorksheetId === id ? (worksheets[0]?.id ?? null) : get().currentWorksheetId,
      });
    },

    addItem: (worksheetId, source, now, note) => {
      const id = newId(now);
      const item: WorksheetItem = note ? { id, source, note } : { id, source };
      set(patchWorksheet(worksheetId, now, (sheet) => ({ ...sheet, items: [...sheet.items, item] })));
      return id;
    },

    updateItem: (worksheetId, itemId, patch, now) =>
      set(
        patchWorksheet(worksheetId, now, (sheet) => ({
          ...sheet,
          items: sheet.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
        })),
      ),

    removeItem: (worksheetId, itemId, now) =>
      set(
        patchWorksheet(worksheetId, now, (sheet) => ({
          ...sheet,
          items: sheet.items.filter((item) => item.id !== itemId),
        })),
      ),

    moveItem: (worksheetId, itemId, direction, now) =>
      set(
        patchWorksheet(worksheetId, now, (sheet) => {
          const items = [...sheet.items];
          const from = items.findIndex((item) => item.id === itemId);
          const to = from + direction;
          if (from === -1 || to < 0 || to >= items.length) return sheet;
          [items[from], items[to]] = [items[to], items[from]];
          return { ...sheet, items };
        }),
      ),

    addStudent: (name, group, now) => {
      const id = newId(now);
      const student: Student = group ? { id, name, group } : { id, name };
      const state = get();
      set(persist({ version: 1, students: [...state.students, student], worksheets: state.worksheets, records: state.records }));
      return id;
    },

    removeStudent: (id) => {
      const state = get();
      set({
        ...persist({
          version: 1,
          students: state.students.filter((student) => student.id !== id),
          worksheets: state.worksheets,
          // The student is gone, so their records must go too: a record naming nobody is a leak.
          records: state.records.filter((entry) => entry.studentId !== id),
        }),
        currentStudentId: state.currentStudentId === id ? null : state.currentStudentId,
      });
    },

    record: (attempt) => {
      const state = get();
      set(persist({ version: 1, students: state.students, worksheets: state.worksheets, records: [...state.records, attempt] }));
    },

    replaceAll: (data) =>
      set({ ...persist(data), currentWorksheetId: data.worksheets[0]?.id ?? null, currentStudentId: null }),

    mergeIn: (data) => {
      const merged = mergeClassData(get(), data);
      set({ ...persist(merged), currentWorksheetId: get().currentWorksheetId ?? (merged.worksheets[0]?.id ?? null) });
    },

    eraseAll: () => {
      eraseClassData();
      set({ version: 1, students: [], worksheets: [], records: [], currentStudentId: null, currentWorksheetId: null });
    },
  };
});

/* ------------------------------------------------------------------ derived views */

export interface StudentProgress {
  readonly student: Student;
  readonly attempts: number;
  readonly correct: number;
  /** The most recent attempt, so a teacher can see who has not worked this week. */
  readonly lastAt: number | null;
}

/**
 * How each student is doing. Pure, so the Class screen never re-derives it a second way.
 */
export function progressByStudent(data: ClassData, worksheetId?: string): StudentProgress[] {
  return data.students.map((student) => {
    const records = data.records.filter(
      (entry) => entry.studentId === student.id && (!worksheetId || entry.worksheetId === worksheetId),
    );
    return {
      student,
      attempts: records.length,
      correct: records.filter((entry) => entry.correct).length,
      lastAt: records.reduce<number | null>((latest, entry) => (latest === null || entry.at > latest ? entry.at : latest), null),
    };
  });
}

/** The class records as a CSV a head teacher can open in any spreadsheet. */
export function recordsToCsv(data: ClassData): string {
  const worksheetTitle = new Map(data.worksheets.map((sheet) => [sheet.id, sheet.title]));
  const itemSource = new Map(
    data.worksheets.flatMap((sheet) => sheet.items.map((item) => [item.id, item.source] as const)),
  );
  const studentName = new Map(data.students.map((student) => [student.id, student.name]));

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = [['student', 'group', 'worksheet', 'item', 'correct', 'when'].join(',')];

  for (const entry of [...data.records].sort((a, b) => a.at - b.at)) {
    const student = data.students.find((candidate) => candidate.id === entry.studentId);
    rows.push(
      [
        escape(studentName.get(entry.studentId) ?? entry.studentId),
        escape(student?.group ?? ''),
        escape(worksheetTitle.get(entry.worksheetId) ?? ''),
        escape(entry.label ?? itemSource.get(entry.itemId) ?? entry.itemId),
        entry.correct ? 'yes' : 'no',
        escape(new Date(entry.at).toISOString()),
      ].join(','),
    );
  }
  return rows.join('\n');
}
