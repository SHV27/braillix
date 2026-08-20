/**
 * A teacher's Tuesday, end to end.
 *
 * Write a question on the Board, keep it, teach it, and have the child's answer land against their
 * name. Every step of that has to work with nothing plugged in and no network, because that is the
 * room this product is for.
 *
 * The export/import round trip is the one worth staring at: it is Braillix's entire answer to
 * "how does this get to the other laptop", and it has to survive the file actually going to disk
 * and coming back.
 */

import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function openClass(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
  await page.getByTestId('nav-class').click();
  await expect(page.getByRole('heading', { name: 'Your class', level: 1 })).toBeVisible();
}

async function newWorksheetWith(page: Page, items: string[]) {
  await page.getByTestId('new-worksheet').click();
  for (const source of items) {
    await page.getByTestId('new-item').fill(source);
    await page.getByTestId('add-item').click();
  }
  await expect(page.getByTestId('worksheet-items').locator('li')).toHaveCount(items.length);
}

test.describe('a teacher prepares a lesson', () => {
  test('an empty class teaches what a worksheet is instead of showing an empty box', async ({ page }) => {
    await openClass(page);
    await expect(page.getByText(/A worksheet is just a list/)).toBeVisible();
  });

  test('keeps a worksheet, in order, and survives a reload', async ({ page }) => {
    await openClass(page);
    await newWorksheetWith(page, ['1/2', 'sqrt(144) = 12', 'दो संख्याओं का योग 12 है']);

    await page.getByTestId('worksheet-title').fill('Tuesday, fractions');

    await page.reload();
    await page.getByTestId('nav-class').click();
    await expect(page.getByTestId('worksheet-title')).toHaveValue('Tuesday, fractions');
    await expect(page.getByTestId('worksheet-items').locator('li')).toHaveCount(3);
  });

  test('shows each question as print, not as the code it was typed in', async ({ page }) => {
    await openClass(page);
    await newWorksheetWith(page, ['1/2']);
    // temml renders a real fraction: numerator and denominator as separate elements.
    await expect(page.getByTestId('worksheet-items').locator('math')).toBeVisible();
  });

  test('reorders and removes questions', async ({ page }) => {
    await openClass(page);
    await newWorksheetWith(page, ['1/2', '3/4']);

    const sources = page.getByTestId('worksheet-items').locator('code');
    await expect(sources.first()).toHaveText('1/2');

    await page.getByTestId('worksheet-items').locator('li').first().getByRole('button', { name: 'Move down' }).click();
    await expect(sources.first()).toHaveText('3/4');

    await page.getByTestId('worksheet-items').locator('li').first().getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByTestId('worksheet-items').locator('li')).toHaveCount(1);
  });

  test('a question written on the Board can be kept without retyping it', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });

    await page.getByTestId('latex-input').fill('2/3 + 1/6');
    await page.getByTestId('add-to-worksheet').click();
    await expect(page.getByTestId('added-message')).toBeVisible();

    await page.getByTestId('nav-class').click();
    await expect(page.getByTestId('worksheet-items').locator('code')).toHaveText('2/3 + 1/6');
  });
});

test.describe('teaching it', () => {
  test('puts each question on the display in turn, and closes on escape', async ({ page }) => {
    await openClass(page);
    await newWorksheetWith(page, ['1/2', '22/7']);

    await page.getByTestId('teach').click();
    const teach = page.getByTestId('teach-mode');
    await expect(teach).toBeVisible();

    // The first question is on the display: ⠹ opens a Nemeth fraction.
    await expect(page.getByTestId('teach-braille')).toContainText('⠹', { timeout: 10_000 });
    const first = await page.getByTestId('teach-braille').textContent();

    await page.getByTestId('teach-next').click();
    await expect(page.getByTestId('teach-braille')).not.toHaveText(first ?? '');

    await page.keyboard.press('Escape');
    await expect(teach).toBeHidden();
  });

  test('moves with the arrow keys, because a teacher is not holding a mouse', async ({ page }) => {
    await openClass(page);
    await newWorksheetWith(page, ['1/2', '22/7', 'x^2']);

    await page.getByTestId('teach').click();
    await expect(page.getByText('1 of 3')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('2 of 3')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('1 of 3')).toBeVisible();
  });
});

test.describe('the class, and what leaves this laptop', () => {
  test('records practice against the chosen student, and nobody else', async ({ page }) => {
    await openClass(page);
    await page.getByTestId('class-students').click();
    await page.getByTestId('student-name').fill('Asha');
    await page.getByTestId('student-group').fill('Class 6');
    await page.getByTestId('add-student').click();
    await expect(page.getByTestId('student-list').locator('li')).toHaveCount(1);

    // Until somebody is chosen, nothing is recorded — and the Practice screen says so.
    await page.getByTestId('nav-practice').click();
    await expect(page.getByTestId('recording-for')).toContainText('Nobody is chosen');

    await page.getByTestId('nav-class').click();
    await page.getByTestId('class-students').click();
    await page.getByTestId('current-student').selectOption({ label: 'Asha · Class 6' });

    await page.getByTestId('nav-practice').click();
    await expect(page.getByTestId('recording-for')).toContainText('Asha');
    await page.getByTestId('answer-input').fill('1');
    await page.getByTestId('check-answer').click();
    await expect(page.getByTestId('verdict')).toBeVisible();

    await page.getByTestId('nav-class').click();
    await page.getByTestId('class-records').click();
    const row = page.getByTestId('progress-table').locator('tr').first();
    await expect(row).toContainText('Asha');
    await expect(row).not.toContainText('not yet');
  });

  test('a worksheet goes to a file and comes back on another laptop', async ({ page }) => {
    await openClass(page);
    await newWorksheetWith(page, ['1/2', 'sqrt(9)']);
    await page.getByTestId('worksheet-title').fill('Carried across');

    await page.getByTestId('class-records').click();
    const download = await Promise.race([
      page.waitForEvent('download'),
      page.getByTestId('export-all').click().then(() => page.waitForEvent('download')),
    ]);
    const path = await download.path();
    expect(path, 'the file must actually reach the disk').toBeTruthy();

    // Now be a different laptop: erase everything, then read the file back.
    page.on('dialog', (dialog) => void dialog.accept());
    await page.getByTestId('erase-class').click();
    await page.getByTestId('class-worksheets').click();
    await expect(page.getByText(/A worksheet is just a list/)).toBeVisible();

    await page.getByTestId('class-records').click();
    await page.getByTestId('import-file').setInputFiles(path!);
    await expect(page.getByTestId('import-message')).toContainText('1 worksheets');

    await page.getByTestId('class-worksheets').click();
    await expect(page.getByTestId('worksheet-title')).toHaveValue('Carried across');
    await expect(page.getByTestId('worksheet-items').locator('li')).toHaveCount(2);
  });

  test('says plainly that nothing has left the laptop', async ({ page }) => {
    await openClass(page);
    await page.getByTestId('class-records').click();
    await expect(page.getByText(/no account and no server/)).toBeVisible();
  });
});

test.describe('paper', () => {
  test('saves a worksheet as an embosser file', async ({ page }) => {
    await openClass(page);
    await newWorksheetWith(page, ['1/2', '22/7']);

    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('save-brf').click(),
    ]).then(([event]) => event);

    expect(download.suggestedFilename()).toMatch(/\.brf$/);
    const path = await download.path();
    const text = readFileSync(path!, 'utf8');
    // Braille ASCII: "#A. " numbers the first question, "?1/2#" is one half in Nemeth.
    expect(text).toContain('#A. ?1/2#');
    expect(text).toContain('#B. ');
  });

  test('has a printable sheet with both the print and the braille on it', async ({ page }) => {
    await openClass(page);
    await newWorksheetWith(page, ['1/2']);

    const sheet = page.getByTestId('print-sheet');
    // Hidden on screen, present in the page: printing must never open a second window that could
    // show something different from what the teacher just checked.
    await expect(sheet).toBeHidden();
    await expect(sheet.locator('.printsheet__braille')).toContainText('⠹', { timeout: 10_000 });
    await expect(sheet.locator('math')).toHaveCount(1);
  });
});
