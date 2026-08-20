/**
 * Every drill a student is marked against, read back.
 *
 * This is the highest-stakes content in the product. A wrong cell on the Board is a teacher's
 * problem for a minute; a wrong cell in a *lesson* is a child being taught something false and then
 * marked wrong for getting it right. The lessons are generated from the same engine that drives the
 * display, so they cannot drift from it — but "cannot drift" is a claim about the code, and this is
 * the check.
 *
 * Every item goes through the whole chain and comes back through the reader, and the verdict has to
 * be `agrees`. Not "translated without error" — agrees.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { initSre } from '../core/sre-service';
import { translateMixed } from '../core/mixed';
import { checkSegment } from '../core/roundtrip';
import { LESSONS } from './lessons';

beforeAll(async () => {
  const status = await initSre();
  expect(status.ok, `speech-rule-engine failed to start: ${status.reason ?? ''}`).toBe(true);
}, 60_000);

describe('the drills teach the right dots', () => {
  for (const lesson of LESSONS) {
    describe(lesson.id, () => {
      for (const item of lesson.items) {
        it(`${item.source}`, async () => {
          const line = await translateMixed(item.source);
          expect(line.cells.length, 'produced no braille at all').toBeGreaterThan(0);

          for (const segment of line.segments) {
            const trip = checkSegment(segment.kind, segment.text, segment.latex, segment.cells);
            expect(
              trip.verdict,
              `the dots read "${trip.reading}" but the item is "${trip.expected}"${
                trip.gaps.length ? ` (${trip.gaps.join('; ')})` : ''
              }`,
            ).toBe('agrees');
          }
        });
      }
    });
  }

  it('covers enough of Nemeth to be a course rather than a demo', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(10);
    expect(LESSONS.flatMap((lesson) => lesson.items).length).toBeGreaterThanOrEqual(30);
  });
});
