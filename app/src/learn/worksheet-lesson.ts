/**
 * A teacher's worksheet, playable as a drill.
 *
 * This is the loop the Class screen exists to close: the teacher writes tomorrow's questions, the
 * student practises those questions rather than a curriculum somebody else chose, and what they got
 * right is kept against their name. It costs one adapter, because a worksheet item and a lesson
 * item are the same thing seen from two ends — a line of maths and its braille.
 *
 * The hint is the teacher's own note where they left one. Nothing is invented: an item with no note
 * simply has no hint, and the drill still names the exact cell that was wrong, which is the part
 * that teaches.
 */

import { toLatex } from '../core/mathinput';
import type { Worksheet } from '../class/types';
import type { Lesson } from './lessons';

/** Lesson ids for worksheets are prefixed so a record can never be mistaken for a built-in lesson. */
export const WORKSHEET_PREFIX = 'ws:';

export function isWorksheetLesson(id: string): boolean {
  return id.startsWith(WORKSHEET_PREFIX);
}

export function worksheetToLesson(worksheet: Worksheet): Lesson {
  return {
    id: `${WORKSHEET_PREFIX}${worksheet.id}`,
    title: [worksheet.title, worksheet.title],
    teaches: ['', ''],
    rule: ['', ''],
    items: worksheet.items.map((item) => ({
      latex: toLatex(item.source).latex,
      hint: [item.note ?? '', item.note ?? ''],
    })),
  };
}
