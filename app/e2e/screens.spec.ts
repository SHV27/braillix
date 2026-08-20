/**
 * Screenshots of every screen, at every width.
 *
 * "It compiles" proves nothing about how something looks, and this project's taste bar is that
 * nothing should invite the criticism "this looks like a college demo". So every screen is
 * captured, and every capture asserts the page does not scroll sideways.
 */

import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const SHOTS = 'screenshots';
mkdirSync(SHOTS, { recursive: true });

const WIDTHS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

/**
 * Every screen a teacher can reach, by the control they would press to get there.
 * `steps` is the sequence of test ids to click from a cold start; the Board needs none.
 */
const SCREENS = [
  { id: 'board', steps: [], heading: 'Write maths. Read it with your hands.' },
  { id: 'practice', steps: ['nav-practice'], heading: 'Practice' },
  { id: 'recognise', steps: ['source-photo'], heading: 'Write maths. Read it with your hands.' },
  { id: 'class', steps: ['nav-class'], heading: 'Your class' },
  { id: 'device', steps: ['nav-device'], heading: 'Hardware' },
  { id: 'atlas', steps: ['nav-device', 'device-atlas'], heading: 'Cell atlas' },
] as const;

async function noSidewaysScroll(page: Page, where: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${where} must not scroll horizontally`).toBeLessThanOrEqual(1);
}

for (const size of WIDTHS) {
  test.describe(`${size.name} (${size.width}px)`, () => {
    for (const screen of SCREENS) {
      test(`${screen.id}`, async ({ page }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        await page.goto('/');
        await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });

        for (const step of screen.steps) await page.getByTestId(step).click();
        await expect(page.getByRole('heading', { name: screen.heading, level: 1 })).toBeVisible();

        // Give the cam animation time to settle so captures are not caught mid-transition.
        await page.waitForTimeout(600);
        await noSidewaysScroll(page, `${screen.id} at ${size.width}px`);
        await page.screenshot({ path: `${SHOTS}/${screen.id}-${size.name}.png`, fullPage: true });
      });
    }
  });
}

test.describe('states worth capturing', () => {
  test('the reader, mid-exploration', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
    await page.getByLabel('Speak as I read').uncheck();
    await page.getByTestId('latex-input').fill(String.raw`\frac{-b \pm \sqrt{b^2-4ac}}{2a}`);
    await page.waitForTimeout(600);
    await page.getByTestId('mode-explore').click();
    await expect(page.getByTestId('breadcrumb')).toHaveText('Fraction');
    await page.getByTestId('cell-count').fill('5');
    await page.waitForTimeout(600);
    await noSidewaysScroll(page, 'reader');
    await page.screenshot({ path: `${SHOTS}/reader-exploring.png`, fullPage: true });
  });

  test('the practice writing drill, mid-chord', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
    await page.getByTestId('nav-practice').click();
    await page.getByTestId('drill-write').click();
    await page.getByRole('heading', { name: 'Practice', level: 1 }).click();

    await page.keyboard.down('s');
    await page.keyboard.down('j');
    await page.keyboard.down('k');
    await page.keyboard.down('l');
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SHOTS}/practice-chord.png`, fullPage: true });
    await page.keyboard.up('s');
    await page.keyboard.up('j');
    await page.keyboard.up('k');
    await page.keyboard.up('l');
  });
});
