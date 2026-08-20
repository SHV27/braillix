/**
 * Practice progress.
 *
 * Kept in `localStorage` and nowhere else. There is no account, no server and no upload — which is
 * how the brief's unanswered "data sensitivity" question is resolved for a product that children
 * will use: the data never leaves the machine it was made on, because there is nowhere for it to
 * go. The erase control is real and immediate.
 */

const STORAGE_KEY = 'braillix.progress.v1';

export interface ItemRecord {
  attempts: number;
  correct: number;
  /** Milliseconds since the epoch. */
  lastSeen: number;
}

export type ProgressMap = Record<string, ItemRecord>;

/** A stable key for one item within one lesson. */
export function itemKey(lessonId: string, index: number): string {
  return `${lessonId}#${index}`;
}

function isRecord(value: unknown): value is ItemRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<ItemRecord>;
  return (
    typeof record.attempts === 'number' &&
    typeof record.correct === 'number' &&
    typeof record.lastSeen === 'number'
  );
}

/**
 * Read what is stored.
 *
 * Anything unreadable is discarded rather than repaired: stored progress is a convenience, and a
 * corrupt file must never be able to stop a student practising.
 */
export function loadProgress(): ProgressMap {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};

    const clean: ProgressMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isRecord(value)) clean[key] = value;
    }
    return clean;
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressMap): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // A full or disabled storage is not a reason to interrupt practice.
  }
}

/** Record one attempt and return the updated map. Pure — the caller decides when to persist. */
export function recordAttempt(
  progress: ProgressMap,
  key: string,
  correct: boolean,
  now: number,
): ProgressMap {
  const existing = progress[key] ?? { attempts: 0, correct: 0, lastSeen: 0 };
  return {
    ...progress,
    [key]: {
      attempts: existing.attempts + 1,
      correct: existing.correct + (correct ? 1 : 0),
      lastSeen: now,
    },
  };
}

export function eraseProgress(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing useful to do */
  }
}

export interface LessonSummary {
  readonly attempted: number;
  readonly correct: number;
  readonly total: number;
}

/** How a lesson is going. `correct` counts items answered correctly at least once. */
export function summariseLesson(progress: ProgressMap, lessonId: string, itemCount: number): LessonSummary {
  let attempted = 0;
  let correct = 0;
  for (let i = 0; i < itemCount; i += 1) {
    const record = progress[itemKey(lessonId, i)];
    if (!record) continue;
    attempted += 1;
    if (record.correct > 0) correct += 1;
  }
  return { attempted, correct, total: itemCount };
}
