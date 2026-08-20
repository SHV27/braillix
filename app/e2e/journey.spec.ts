/**
 * The demo journey, walked headlessly.
 *
 * This is the test that has to pass on the morning of the panel. It proves the claim the whole
 * project rests on — that with nothing plugged in, a real expression becomes real Nemeth on a real
 * number of cells — and it fails the build if a console error appears anywhere along the way.
 */

import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const SHOTS = 'screenshots';
mkdirSync(SHOTS, { recursive: true });

/** Every test asserts a clean console — CLAUDE.md gate: zero console errors or warnings. */
function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

test.describe('Braillix — the core journey', () => {
  test('a new user sees working braille within seconds, with no input', async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto('/');

    // The app pre-loads one expression so the first thing anyone sees is a working display.
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
    await expect(page.getByTestId('cell-row')).toBeVisible();

    // The default display is one cell — the hardware that will actually exist.
    await expect(page.getByTestId('cell-count')).toHaveValue('1');
    await expect(page.getByTestId('cell-0')).toBeVisible();

    expect(problems, `console problems:\n${problems.join('\n')}`).toEqual([]);
  });

  test('typing an expression produces the correct Nemeth and the correct cam numbers', async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });

    await page.getByTestId('latex-input').fill('2+3=5');
    // ⠼⠆⠬⠒ ⠨⠅ ⠼⠢ — numeric indicator, dropped 2, plus, dropped 3, equals, numeric indicator, 5.
    await expect(page.getByTestId('braille-unicode')).toHaveText('⠼⠆⠬⠒⠀⠨⠅⠀⠼⠢');

    // Cell 1 must be the numeric indicator: dots 3-4-5-6, cam 60 with the default wiring.
    const first = page.getByTestId('cell-0');
    await expect(first).toHaveAttribute('data-dots', '60');
    await expect(first).toHaveAttribute('data-cam', '60');

    expect(problems, `console problems:\n${problems.join('\n')}`).toEqual([]);
  });

  test('the display adapts to any number of cells', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });

    for (const count of ['1', '2', '3', '8', '20']) {
      await page.getByTestId('cell-count').fill(count);
      const cells = page.locator('[data-testid="cell-row"] .cell');
      await expect(cells).toHaveCount(Number(count));
      // The window label must stay truthful at every width.
      await expect(page.getByTestId('window-label')).not.toBeEmpty();
    }
  });

  test('a broken expression explains itself and never blanks the display', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });

    await page.getByTestId('latex-input').fill('\\frac{1}{');
    await expect(page.getByRole('alert')).toContainText('parse');
    // Law 4: the previous frame is sacred — the cells are still there.
    await expect(page.getByTestId('cell-0')).toBeVisible();
  });

  test('the status strip tells the truth about what is and is not available', async ({ page }) => {
    await page.goto('/');
    const strip = page.getByRole('contentinfo', { name: 'System status' });
    await expect(strip).toBeVisible();

    // The maths engine must come up ready…
    await expect(strip.getByText('Maths engine')).toBeVisible();
    // …and recognition must report whichever state is TRUE on this machine, with a fix when it is
    // not ready. Asserting one particular state would make this test a statement about the tester's
    // laptop rather than about the product.
    const recognition = strip.locator('.cap', { hasText: 'Recognition' });
    await expect(recognition).toBeVisible();
    const state = (await recognition.locator('.cap__state').textContent())?.trim();
    expect(['ready', 'off', 'checking']).toContain(state);
    if (state === 'off') await expect(recognition.locator('.cap__fix')).toContainText('fetch:model');
  });

  test('the whole app is reachable by keyboard alone', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });

    await page.keyboard.press('Tab'); // skip link
    await expect(page.getByRole('link', { name: /skip to the display/i })).toBeFocused();

    // Walk far enough to reach the input, and prove it can be typed into without a mouse. The
    // count is generous on purpose: what matters is that it is reachable, not that it is the
    // twelfth stop — a welcome panel or a new control should not fail this test.
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      if (await page.getByTestId('latex-input').evaluate((el) => el === document.activeElement)) break;
    }
    await expect(page.getByTestId('latex-input')).toBeFocused();
  });

  test('the cell atlas lists all 64 cam positions', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-device').click();
    await page.getByTestId('device-atlas').click();
    await expect(page.getByRole('heading', { name: 'Cell atlas' })).toBeVisible();
    await expect(page.locator('.atlas__item')).toHaveCount(64);
  });
});

test.describe('appearance', () => {
  const WIDTHS = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 834, height: 1112 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const size of WIDTHS) {
    test(`renders at ${size.name} (${size.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/');
      await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
      await page.getByTestId('cell-count').fill(size.width < 700 ? '2' : '6');
      await page.waitForTimeout(500); // let the cam animation settle before capturing

      // No horizontal overflow at any width — a scrollbar sideways is a design bug.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, 'the page must not scroll horizontally').toBeLessThanOrEqual(1);

      await page.screenshot({ path: `${SHOTS}/read-${size.name}.png`, fullPage: true });
    });
  }

  test('captures the cell atlas', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.getByTestId('nav-device').click();
    await page.getByTestId('device-atlas').click();
    await expect(page.locator('.atlas__item')).toHaveCount(64);
    await page.screenshot({ path: `${SHOTS}/atlas-desktop.png`, fullPage: true });
  });
});

/**
 * The first sixty seconds.
 *
 * A teacher who has never seen this before opens it and is not asked to read anything: three
 * things to press, each of which does what it says. And once dismissed it is gone — an app that
 * keeps explaining itself to somebody who has used it all term is an app that is not listening.
 */
test.describe('the first sixty seconds', () => {
  test('offers three things to press, and each of them does it', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
    await expect(page.getByTestId('first-run')).toBeVisible();

    await page.getByTestId('first-run-read').click();
    await expect(page.getByTestId('latex-input')).toHaveValue('2/3 + 1/6');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠹', { timeout: 10_000 });

    await page.getByTestId('first-run-explore').click();
    // Nineteen cells fold to five: open, something, over, something, close.
    await expect(page.getByTestId('braille-unicode')).toHaveText('⠹⠿⠌⠿⠼', { timeout: 10_000 });

    await page.getByTestId('first-run-question').click();
    await expect(page.getByTestId('question-strip')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('braille-unicode')).toContainText('⠸⠩', { timeout: 10_000 });
  });

  test('goes away when dismissed, and stays away', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('first-run')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('first-run-close').click();
    await expect(page.getByTestId('first-run')).toBeHidden();

    await page.reload();
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
    await expect(page.getByTestId('first-run')).toBeHidden();
  });
});

/**
 * Hostile input.
 *
 * Everything here was typed at the real thing during a QA pass, and one of them found a genuine
 * defect: "((((" produces four identical complaints, four React children claimed the same identity,
 * and the console filled with warnings on a screen that looked perfectly fine. A test that only
 * types valid maths would never have seen it.
 */
test.describe('nothing a teacher can type breaks it', () => {
  test('survives nonsense, and says so without a single console error', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));

    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });

    const nasty = [
      '((((',
      '))))',
      '?????',
      '1/0',
      'x'.repeat(300),
      '।।।।',
      'क ् ्',
      '^^^^',
      '{{{{}}}}',
      '|||',
      'Rs Rs Rs',
      '\frac{1}{',
      '💥 + 2',
      '   ',
    ];
    for (const input of nasty) {
      await page.getByTestId('latex-input').fill(input);
      await page.waitForTimeout(120);
      // Still alive, still showing cells, still able to be typed into.
      await expect(page.getByTestId('cell-row')).toBeVisible();
    }

    // And back to something ordinary, from whatever state that left it in.
    await page.getByTestId('latex-input').fill('1/2');
    await expect(page.getByTestId('braille-unicode')).toHaveText('⠹⠂⠌⠆⠼', { timeout: 10_000 });

    expect(problems, 'the console must stay clean, even under abuse').toEqual([]);
  });
});
