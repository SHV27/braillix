/**
 * Where a teacher's work is kept, and how it travels.
 *
 * `localStorage`, one key, and a file. That is the whole of it — and the reason is not
 * simplicity for its own sake: a school laptop may never see the internet, two teachers may share
 * one machine, and student work must have nowhere to leak to (DECISIONS D6.4). A file on a pen
 * drive is a synchronisation protocol that works in a room with no Wi-Fi and needs no password.
 *
 * Everything here is defensive about what it reads back. A corrupt or half-written value must
 * never take the app down with it: the worst outcome allowed is an empty class and a message
 * saying so (CLAUDE.md Law 4).
 */

import { EMPTY_CLASS, type AttemptRecord, type ClassData, type Student, type Worksheet } from './types';

const KEY = 'braillix.class.v1';

/** The file a teacher exports. Deliberately readable: it is a text file with their words in it. */
export const FILE_EXTENSION = '.braillix.json';

/* ------------------------------------------------------------------ validation */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function cleanString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function cleanNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function cleanStudent(value: unknown): Student | null {
  if (!isObject(value)) return null;
  const id = cleanString(value.id);
  const name = cleanString(value.name);
  if (!id || !name) return null;
  const group = cleanString(value.group);
  return group ? { id, name, group } : { id, name };
}

function cleanWorksheet(value: unknown): Worksheet | null {
  if (!isObject(value)) return null;
  const id = cleanString(value.id);
  if (!id) return null;
  const items = Array.isArray(value.items)
    ? value.items
        .map((item) => {
          if (!isObject(item)) return null;
          const itemId = cleanString(item.id);
          const source = cleanString(item.source);
          if (!itemId || !source) return null;
          const note = cleanString(item.note);
          return note ? { id: itemId, source, note } : { id: itemId, source };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];
  return {
    id,
    title: cleanString(value.title, 'Untitled'),
    items,
    createdAt: cleanNumber(value.createdAt),
    updatedAt: cleanNumber(value.updatedAt),
  };
}

function cleanRecord(value: unknown): AttemptRecord | null {
  if (!isObject(value)) return null;
  const studentId = cleanString(value.studentId);
  const itemId = cleanString(value.itemId);
  if (!studentId || !itemId) return null;
  const label = cleanString(value.label);
  return {
    studentId,
    worksheetId: cleanString(value.worksheetId),
    itemId,
    correct: value.correct === true,
    at: cleanNumber(value.at),
    ...(label ? { label } : {}),
  };
}

/**
 * Turn anything at all into valid class data.
 *
 * Used for both the stored value and an imported file, so a hand-edited file and a corrupted
 * localStorage entry go through exactly the same door.
 */
export function parseClassData(value: unknown): ClassData {
  if (!isObject(value)) return EMPTY_CLASS;
  const students = Array.isArray(value.students)
    ? value.students.map(cleanStudent).filter((entry): entry is Student => entry !== null)
    : [];
  const worksheets = Array.isArray(value.worksheets)
    ? value.worksheets.map(cleanWorksheet).filter((entry): entry is Worksheet => entry !== null)
    : [];
  const records = Array.isArray(value.records)
    ? value.records.map(cleanRecord).filter((entry): entry is AttemptRecord => entry !== null)
    : [];
  return { version: 1, students, worksheets, records };
}

/* ------------------------------------------------------------------ the store on disk */

export function loadClassData(): ClassData {
  if (typeof localStorage === 'undefined') return EMPTY_CLASS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_CLASS;
    return parseClassData(JSON.parse(raw));
  } catch {
    return EMPTY_CLASS;
  }
}

export function saveClassData(data: ClassData): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // A full disk quota must not stop the lesson. The teacher's work stays in memory for the
    // session, and the Class screen shows that saving failed.
  }
}

export function eraseClassData(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(KEY);
}

/* ------------------------------------------------------------------ the file */

/** What gets written to the exported file. Pretty-printed, because a teacher may open it. */
export function serialiseClassData(data: ClassData): string {
  return JSON.stringify(data, null, 2);
}

export interface ImportResult {
  readonly data: ClassData;
  /** What was found, in the teacher's terms, so the confirmation is about their work not our JSON. */
  readonly summary: { students: number; worksheets: number; items: number; records: number };
  readonly error?: string;
}

/** Read an exported file. Never throws: a bad file comes back as an empty import with a reason. */
export function deserialiseClassData(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { data: EMPTY_CLASS, summary: { students: 0, worksheets: 0, items: 0, records: 0 }, error: 'not-json' };
  }
  const data = parseClassData(parsed);
  return {
    data,
    summary: {
      students: data.students.length,
      worksheets: data.worksheets.length,
      items: data.worksheets.reduce((sum, sheet) => sum + sheet.items.length, 0),
      records: data.records.length,
    },
  };
}

/**
 * Fold an imported file into what is already here.
 *
 * Merging rather than replacing, because the common case is a teacher carrying a worksheet from one
 * laptop to another and NOT wanting to lose the students already on this one. Anything with the
 * same id is taken from the newer of the two by `updatedAt`; anything unknown is added.
 */
export function mergeClassData(current: ClassData, incoming: ClassData): ClassData {
  const students = new Map(current.students.map((student) => [student.id, student]));
  for (const student of incoming.students) students.set(student.id, student);

  const worksheets = new Map(current.worksheets.map((sheet) => [sheet.id, sheet]));
  for (const sheet of incoming.worksheets) {
    const existing = worksheets.get(sheet.id);
    if (!existing || sheet.updatedAt >= existing.updatedAt) worksheets.set(sheet.id, sheet);
  }

  // A record is one moment; two identical moments are the same moment.
  const key = (record: AttemptRecord) => `${record.studentId}|${record.itemId}|${record.at}`;
  const records = new Map(current.records.map((record) => [key(record), record]));
  for (const record of incoming.records) records.set(key(record), record);

  return {
    version: 1,
    students: [...students.values()],
    worksheets: [...worksheets.values()],
    records: [...records.values()],
  };
}

/* ------------------------------------------------------------------ ids */

/**
 * An id that is unique on this machine.
 *
 * `crypto.randomUUID` where it exists, and a counter plus the caller's timestamp where it does not
 * — because ids must not depend on a clock the tests cannot control, and a build that only works on
 * a secure origin is not a build.
 */
let counter = 0;
export function newId(now: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  counter += 1;
  return `${now.toString(36)}-${counter.toString(36)}`;
}
