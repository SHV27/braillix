/**
 * The lesson — the blackboard's memory.
 *
 * A blackboard is not one expression; it is a stack of lines written in order: the question,
 * the working, the answer. This store owns that stack and nothing else. What the dots say is
 * still owned entirely by the main store (`store.ts`) — selecting a line here hands its source
 * to `setSource`, the one entry point every input already goes through, so the lesson cannot
 * grow a second translation pipeline with a second set of bugs.
 *
 * THE CONFIRM GATE (CLAUDE.md design law 2) is structural here: a line's origin is either
 * 'typed' — the teacher wrote it herself, watching the print preview as she typed — or
 * 'recognised' with `confirmed: true`. There is no way to construct a recognised line without
 * that literal `true`, so unreviewed recognition output cannot reach a child's fingers by
 * compiling code, only by a human pressing the button that creates this value.
 */

import { create } from 'zustand';
import { useBraillix } from './store';

export type LineOrigin =
  | { readonly kind: 'typed' }
  | { readonly kind: 'recognised'; readonly confirmed: true };

export interface LessonLine {
  readonly id: string;
  /** Exactly what goes to the board — natural maths, LaTeX, or a worded question. */
  readonly source: string;
  readonly origin: LineOrigin;
}

const STORAGE_KEY = 'braillix.lesson.v1';

/** localStorage can be full, disabled, or a private-mode mirage — the lesson works regardless. */
function load(): LessonLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is { id: string; source: string } =>
          typeof entry === 'object' && entry !== null &&
          typeof (entry as { id?: unknown }).id === 'string' &&
          typeof (entry as { source?: unknown }).source === 'string',
      )
      // Whatever its origin was, it was confirmed before it was stored; reloading is not
      // a way to smuggle unreviewed content back in, because storing required the gate.
      .map((entry) => ({ id: entry.id, source: entry.source, origin: { kind: 'typed' as const } }));
  } catch {
    return [];
  }
}

function persist(lines: readonly LessonLine[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.map(({ id, source }) => ({ id, source }))));
  } catch {
    // Nothing to do: the in-memory lesson still works; only reload-survival is lost.
  }
}

let nextId = 1;
function makeId(): string {
  return `line-${Date.now().toString(36)}-${(nextId++).toString(36)}`;
}

interface LessonState {
  lines: readonly LessonLine[];
  /** Which line the display is on. Null = the board is empty or the teacher is drafting. */
  currentIndex: number | null;

  /** Append a line and put it on the display. The origin type IS the confirm gate. */
  addLine: (source: string, origin: LineOrigin) => void;
  /** Put an existing line back on the display — the teacher pointing at the board. */
  selectLine: (index: number) => void;
  /** Replace a line's source (the teacher correcting the board) and re-show it. */
  editLine: (index: number, source: string) => void;
  removeLine: (index: number) => void;
  /** Wipe the board for the next lesson. */
  clearLesson: () => void;
  /** Move the display one line up or down the board. Used by keys and pod buttons. */
  step: (direction: -1 | 1) => void;
}

export const useLesson = create<LessonState>((set, get) => {
  /** The one hand-off to the display pipeline. */
  function show(index: number): void {
    const line = get().lines[index];
    if (!line) return;
    set({ currentIndex: index });
    useBraillix.getState().setSource(line.source);
  }

  return {
    lines: load(),
    currentIndex: null,

    addLine: (source, origin) => {
      const trimmed = source.trim();
      if (!trimmed) return;
      const lines = [...get().lines, { id: makeId(), source: trimmed, origin }];
      set({ lines });
      persist(lines);
      show(lines.length - 1);
    },

    selectLine: (index) => {
      if (index < 0 || index >= get().lines.length) return;
      show(index);
    },

    editLine: (index, source) => {
      const trimmed = source.trim();
      const current = get().lines;
      if (!current[index]) return;
      if (!trimmed) {
        get().removeLine(index);
        return;
      }
      const lines = current.map((line, i) => (i === index ? { ...line, source: trimmed } : line));
      set({ lines });
      persist(lines);
      if (get().currentIndex === index) show(index);
    },

    removeLine: (index) => {
      const current = get().lines;
      if (!current[index]) return;
      const lines = current.filter((_, i) => i !== index);
      const selected = get().currentIndex;
      let nextSelected: number | null = selected;
      if (selected !== null) {
        if (selected === index) nextSelected = null;
        else if (selected > index) nextSelected = selected - 1;
      }
      set({ lines, currentIndex: nextSelected });
      persist(lines);
    },

    clearLesson: () => {
      set({ lines: [], currentIndex: null });
      persist([]);
    },

    step: (direction) => {
      const { lines, currentIndex } = get();
      if (lines.length === 0) return;
      const from = currentIndex ?? (direction === 1 ? -1 : lines.length);
      const next = Math.min(Math.max(from + direction, 0), lines.length - 1);
      if (next === currentIndex) return;
      show(next);
    },
  };
});
