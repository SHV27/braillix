/**
 * A teacher's work, and the promise that it survives.
 *
 * Two things are being defended here. The first is obvious: a worksheet must still exist after the
 * laptop is closed. The second is the one that actually bites — an exported file has to be readable
 * by a *different* copy of Braillix, possibly a slightly different version, possibly after somebody
 * opened it in Notepad. So the reader is tested against damage, not just against its own output.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  deserialiseClassData,
  loadClassData,
  mergeClassData,
  newId,
  parseClassData,
  serialiseClassData,
} from './storage';
import { progressByStudent, recordsToCsv, useClass } from './store';
import { EMPTY_CLASS, type ClassData } from './types';

const NOW = 1_755_000_000_000; // a fixed moment: nothing here is allowed to read the clock

function reset() {
  localStorage.clear();
  useClass.setState({ ...EMPTY_CLASS, currentStudentId: null, currentWorksheetId: null });
}

describe('the file a teacher carries', () => {
  it('round-trips everything', () => {
    const data: ClassData = {
      version: 1,
      students: [{ id: 's1', name: 'Asha', group: 'Class 6' }],
      worksheets: [
        {
          id: 'w1',
          title: 'Fractions, Tuesday',
          items: [{ id: 'i1', source: '1/2' }, { id: 'i2', source: '22/7', note: 'ask for pi' }],
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
      records: [{ studentId: 's1', worksheetId: 'w1', itemId: 'i1', correct: true, at: NOW }],
    };
    expect(deserialiseClassData(serialiseClassData(data)).data).toEqual(data);
  });

  it('survives a file that has been damaged', () => {
    for (const text of ['', 'not json at all', '{}', '[]', 'null', '{"students":"no"}']) {
      const result = deserialiseClassData(text);
      expect(result.data.version, text).toBe(1);
      expect(Array.isArray(result.data.worksheets), text).toBe(true);
    }
    expect(deserialiseClassData('oops').error).toBe('not-json');
  });

  it('throws away entries that are missing what makes them meaningful', () => {
    const data = parseClassData({
      students: [{ id: 's1', name: 'Asha' }, { id: '', name: 'nobody' }, { name: 'no id' }, 42],
      worksheets: [{ id: 'w1', items: [{ id: 'i1', source: 'x' }, { id: 'i2' }, 'nonsense'] }],
      records: [{ studentId: 's1', itemId: 'i1', correct: true, at: 1 }, { correct: true }],
    });
    expect(data.students).toHaveLength(1);
    expect(data.worksheets[0].items).toHaveLength(1);
    expect(data.records).toHaveLength(1);
    // A worksheet with no title still opens, with a name rather than a blank.
    expect(data.worksheets[0].title).toBe('Untitled');
  });

  it('describes what is in a file before it is imported', () => {
    const data: ClassData = {
      version: 1,
      students: [{ id: 's1', name: 'Asha' }],
      worksheets: [{ id: 'w1', title: 'Set A', items: [{ id: 'i1', source: '1/2' }], createdAt: 0, updatedAt: 0 }],
      records: [],
    };
    expect(deserialiseClassData(serialiseClassData(data)).summary).toEqual({
      students: 1,
      worksheets: 1,
      items: 1,
      records: 0,
    });
  });
});

describe('merging one laptop into another', () => {
  const here: ClassData = {
    version: 1,
    students: [{ id: 's1', name: 'Asha' }],
    worksheets: [{ id: 'w1', title: 'Old title', items: [], createdAt: 0, updatedAt: 100 }],
    records: [{ studentId: 's1', worksheetId: 'w1', itemId: 'i1', correct: true, at: 5 }],
  };

  it('keeps the students already on this machine', () => {
    const incoming: ClassData = { version: 1, students: [{ id: 's2', name: 'Ravi' }], worksheets: [], records: [] };
    expect(mergeClassData(here, incoming).students.map((student) => student.name)).toEqual(['Asha', 'Ravi']);
  });

  it('takes the newer version of a worksheet that exists on both', () => {
    const incoming: ClassData = {
      version: 1,
      students: [],
      worksheets: [{ id: 'w1', title: 'New title', items: [], createdAt: 0, updatedAt: 200 }],
      records: [],
    };
    expect(mergeClassData(here, incoming).worksheets[0].title).toBe('New title');

    const older = { ...incoming, worksheets: [{ ...incoming.worksheets[0], updatedAt: 50 }] };
    expect(mergeClassData(here, older).worksheets[0].title).toBe('Old title');
  });

  it('does not duplicate a record that is already here', () => {
    expect(mergeClassData(here, here).records).toHaveLength(1);
  });
});

describe('the store', () => {
  beforeEach(reset);

  it('keeps a worksheet across a reload', () => {
    const id = useClass.getState().addWorksheet('Tuesday', NOW);
    useClass.getState().addItem(id, '1/2', NOW);
    expect(loadClassData().worksheets[0].items[0].source).toBe('1/2');
  });

  it('reorders items, and refuses to move one off either end', () => {
    const id = useClass.getState().addWorksheet('Set', NOW);
    const a = useClass.getState().addItem(id, 'a', NOW);
    useClass.getState().addItem(id, 'b', NOW);

    useClass.getState().moveItem(id, a, 1, NOW);
    expect(useClass.getState().worksheets[0].items.map((item) => item.source)).toEqual(['b', 'a']);

    useClass.getState().moveItem(id, a, 1, NOW); // already last
    expect(useClass.getState().worksheets[0].items.map((item) => item.source)).toEqual(['b', 'a']);
  });

  it('touches updatedAt whenever the sheet changes, because merging depends on it', () => {
    const id = useClass.getState().addWorksheet('Set', NOW);
    useClass.getState().addItem(id, 'a', NOW + 1000);
    expect(useClass.getState().worksheets[0].updatedAt).toBe(NOW + 1000);
  });

  it('removes a student’s records with the student', () => {
    const student = useClass.getState().addStudent('Asha', 'Class 6', NOW);
    const sheet = useClass.getState().addWorksheet('Set', NOW);
    const item = useClass.getState().addItem(sheet, '1/2', NOW);
    useClass.getState().record({ studentId: student, worksheetId: sheet, itemId: item, correct: true, at: NOW });
    expect(useClass.getState().records).toHaveLength(1);

    useClass.getState().removeStudent(student);
    expect(useClass.getState().records, 'a record naming nobody is a leak').toHaveLength(0);
  });

  it('erases everything when asked, including from disk', () => {
    useClass.getState().addWorksheet('Set', NOW);
    useClass.getState().eraseAll();
    expect(useClass.getState().worksheets).toHaveLength(0);
    expect(loadClassData().worksheets).toHaveLength(0);
  });

  it('survives a corrupt stored value instead of failing to start', () => {
    localStorage.setItem('braillix.class.v1', '{not json');
    expect(loadClassData()).toEqual(EMPTY_CLASS);
  });
});

describe('what the teacher is shown', () => {
  const data: ClassData = {
    version: 1,
    students: [
      { id: 's1', name: 'Asha', group: 'Class 6' },
      { id: 's2', name: 'Ravi', group: 'Class 6' },
    ],
    worksheets: [
      { id: 'w1', title: 'Fractions', items: [{ id: 'i1', source: '1/2' }], createdAt: 0, updatedAt: 0 },
    ],
    records: [
      { studentId: 's1', worksheetId: 'w1', itemId: 'i1', correct: true, at: 10 },
      { studentId: 's1', worksheetId: 'w1', itemId: 'i1', correct: false, at: 20 },
    ],
  };

  it('counts attempts per student, including the ones who have not started', () => {
    const progress = progressByStudent(data);
    expect(progress).toHaveLength(2);
    expect(progress[0]).toMatchObject({ attempts: 2, correct: 1, lastAt: 20 });
    expect(progress[1]).toMatchObject({ attempts: 0, correct: 0, lastAt: null });
  });

  it('writes a CSV with the words in it, not the ids', () => {
    const csv = recordsToCsv(data);
    expect(csv.split('\n')[0]).toBe('student,group,worksheet,item,correct,when');
    expect(csv).toContain('"Asha"');
    expect(csv).toContain('"Fractions"');
    expect(csv).toContain('"1/2"');
    expect(csv).not.toContain('s1,');
  });

  it('escapes a quotation mark in a name rather than breaking the file', () => {
    const csv = recordsToCsv({
      ...data,
      students: [{ id: 's1', name: 'A "nickname" B' }],
    });
    expect(csv).toContain('"A ""nickname"" B"');
  });
});

describe('ids', () => {
  it('never collides, whichever path is taken', () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId(NOW)));
    expect(ids.size).toBe(500);
  });
});
