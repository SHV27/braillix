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

import { WORKSHEET_LESSON_PREFIX, type Worksheet } from '../class/types';
import type { Lesson } from './lessons';

export function worksheetToLesson(worksheet: Worksheet): Lesson {
  return {
    id: `${WORKSHEET_LESSON_PREFIX}${worksheet.id}`,
    title: [worksheet.title, worksheet.title],
    teaches: ['', ''],
    rule: ['', ''],
    // The source is carried across untouched: a worksheet item may be a question with Hindi words
    // in it, and turning it into LaTeX here would throw the words away.
    items: worksheet.items.map((item) => ({
      source: item.source,
      hint: [item.note ?? '', item.note ?? ''],
    })),
  };
}
