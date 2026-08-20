/**
 * What a teacher's day is made of.
 *
 * Three nouns, deliberately no more: a **worksheet** is a list of things to read, a **student** is
 * a name, and a **record** is one attempt by one student at one item. Everything the Class screen
 * does is built from those three, because the fourth noun is where school software starts to feel
 * like paperwork.
 *
 * All of it lives on this laptop and moves between laptops as a file. There is no account, no
 * server and nothing to sign into — see DECISIONS.md D6.4 and D7.6. That is not a limitation we are
 * working around; it is the reason a school can use this without asking anyone's permission.
 */

/** One thing to put on the display: an expression, or a question with words in it. */
export interface WorksheetItem {
  readonly id: string;
  /** Exactly what the teacher typed — natural maths, LaTeX, or a mixed line. */
  readonly source: string;
  /** Optional line for the teacher's own eyes: "ask them to say it aloud first". */
  readonly note?: string;
}

export interface Worksheet {
  readonly id: string;
  readonly title: string;
  readonly items: readonly WorksheetItem[];
  /** Milliseconds since the epoch. Passed in by the caller so this module has no clock. */
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface Student {
  readonly id: string;
  readonly name: string;
  /** Free text — "Class 6", "Sunday group". Never validated, never required. */
  readonly group?: string;
}

/** One attempt, by one student, at one item. The unit the progress table is built from. */
export interface AttemptRecord {
  readonly studentId: string;
  readonly worksheetId: string;
  readonly itemId: string;
  readonly correct: boolean;
  readonly at: number;
  /**
   * What was attempted, in words, captured at the time.
   *
   * A record is a historical fact and must stay readable after the worksheet it came from has been
   * renamed, edited or deleted. Looking the text up later would make the past depend on the present.
   */
  readonly label?: string;
}

export interface ClassData {
  readonly version: 1;
  readonly students: readonly Student[];
  readonly worksheets: readonly Worksheet[];
  readonly records: readonly AttemptRecord[];
}

export const EMPTY_CLASS: ClassData = { version: 1, students: [], worksheets: [], records: [] };
