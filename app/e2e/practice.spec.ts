/**
 * The practice journey.
 *
 * The boardroom's condition on this feature was that the student answers *in braille*, and that
 * feedback names the exact cell and dot rather than saying "wrong". Both are tested here, because
 * both are what separate this from a quiz with a braille wallpaper.
 */

import { expect, test, type Page } from '@playwright/test';

async function openPractice(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
  await page.getByTestId('nav-practice').click();
  await expect(page.getByRole('heading', { name: 'Practice', level: 1 })).toBeVisible();
}

/** Press a braille chord the way a Perkins user would: all together, then release. */
async function chord(page: Page, keys: string[]) {
  for (const key of keys) await page.keyboard.down(key);
  for (const key of keys) await page.keyboard.up(key);
}

test.describe('practice', () => {
  test('offers a full curriculum, digits first', async ({ page }) => {
    await openPractice(page);
    await expect(page.locator('.lessons__btn')).toHaveCount(10);
    await expect(page.getByTestId('lesson-digits')).toContainText('The dropped numbers');
    // The rule is explained before anything is asked.
    await expect(page.getByText(/Nemeth writes digits one row DOWN/)).toBeVisible();
  });

  test('a reading drill puts real dots on the real display', async ({ page }) => {
    await openPractice(page);
    // Lesson 1 item 1 is "1": the numeric indicator (cam 60) then the dropped 1 (cam 2).
    await expect(page.getByTestId('revealed')).toHaveCount(0);
    await page.getByTestId('reveal').click();
    await expect(page.getByTestId('revealed')).toContainText('⠼⠂');
  });

  test('marks a reading answer on the braille, not on the spelling', async ({ page }) => {
    await openPractice(page);
    await page.getByTestId('lesson-fractions').click();
    // Item 1 is \frac{a}{b}; a student typing "a/b" means exactly the same thing.
    await page.getByTestId('answer-input').fill('a/b');
    await page.getByTestId('check-answer').click();
    await expect(page.getByTestId('verdict')).toContainText('Correct');
  });

  test('names the exact dot that is wrong, not just “wrong”', async ({ page }) => {
    await openPractice(page);
    await page.getByTestId('answer-input').fill('2');
    await page.getByTestId('check-answer').click();

    const verdict = page.getByTestId('verdict');
    await expect(verdict).toBeVisible();
    await expect(verdict).not.toContainText('Correct');
    // The feedback must say which dot and what the wrong cell means.
    await expect(verdict).toContainText(/dot \d/);
    await expect(verdict).toContainText('digit');
  });

  test('a writing drill accepts a six-key braille chord', async ({ page }) => {
    await openPractice(page);
    await page.getByTestId('drill-write').click();
    await page.getByRole('heading', { name: 'Practice', level: 1 }).click(); // focus off any field

    // "1" in Nemeth is the numeric indicator (dots 3-4-5-6 = S J K L) then dropped 1 (dot 2 = D).
    await chord(page, ['s', 'j', 'k', 'l']);
    await chord(page, ['d']);

    await expect(page.getByTestId('written-cells').locator('.cell')).toHaveCount(2);
    await page.getByTestId('check-answer').click();
    await expect(page.getByTestId('verdict')).toContainText('Correct');
  });

  test('a chord released one finger at a time still writes ONE cell', async ({ page }) => {
    await openPractice(page);
    await page.getByTestId('drill-write').click();
    await page.getByRole('heading', { name: 'Practice', level: 1 }).click();

    await page.keyboard.down('f');
    await page.keyboard.down('d');
    await page.keyboard.down('k');
    await page.keyboard.up('d');
    await page.keyboard.up('k');
    await page.keyboard.up('f');

    await expect(page.getByTestId('written-cells').locator('.cell')).toHaveCount(1);
  });

  test('shows the chord being built, so a learner can see their own fingers', async ({ page }) => {
    await openPractice(page);
    await page.getByTestId('drill-write').click();
    await page.getByRole('heading', { name: 'Practice', level: 1 }).click();

    await page.keyboard.down('f');
    await page.keyboard.down('k');
    await expect(page.getByTestId('chord-hint')).toHaveText('dots 1-5');
    await page.keyboard.up('f');
    await page.keyboard.up('k');
  });

  test('“Show me” reveals the answer in braille and in maths', async ({ page }) => {
    await openPractice(page);
    await page.getByTestId('reveal').click();
    await expect(page.getByTestId('revealed')).toContainText('⠼⠂');
  });

  test('progress is kept on this machine and can be erased', async ({ page }) => {
    await openPractice(page);
    await page.getByTestId('answer-input').fill('1');
    await page.getByTestId('check-answer').click();
    await expect(page.getByTestId('verdict')).toContainText('Correct');
    await expect(page.getByTestId('lesson-digits')).toContainText('1/6');

    // It survives a reload, because it is real storage and not component state…
    await page.reload();
    await page.getByTestId('nav-practice').click();
    await expect(page.getByTestId('lesson-digits')).toContainText('1/6');

    // …and the erase control genuinely erases it.
    await page.getByTestId('erase-progress').click();
    await expect(page.getByTestId('lesson-digits')).toContainText('0/6');
  });

  test('every drill is playable on a one-cell display', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
    await expect(page.getByTestId('cell-count')).toHaveValue('1');

    await page.getByTestId('nav-practice').click();
    await page.getByTestId('lesson-together').click();
    // A long expression on one cell still works — it pages, and the count is honest about it.
    await expect(page.getByText(/cells are on the display \(1 at a time\)/)).toBeVisible();
  });
});
