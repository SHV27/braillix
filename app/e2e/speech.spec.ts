/**
 * The spoken transcript.
 *
 * Braillix speaks maths in English and Hindi, but a Windows machine without the Hindi language pack
 * has no Hindi voice — which is true of the laptop this was built on, and quite possibly of the one
 * it will be demonstrated on. Showing the transcript means the capability is visible and provable
 * either way, and a sighted teacher can see what the student is hearing.
 */

import { expect, test, type Page } from '@playwright/test';

async function openReader(page: Page, latex: string) {
  await page.goto('/');
  await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
  await page.getByRole('checkbox', { name: /speak as i read|पढ़ते समय बोलिए/i }).uncheck();
  await page.getByTestId('latex-input').fill(latex);
  await expect(page.getByTestId('latex-input')).toHaveValue(latex);
  await page.waitForTimeout(500);
  await page.getByTestId('mode-explore').click();
  await expect(page.getByTestId('breadcrumb')).not.toHaveText('—', { timeout: 10_000 });
}

test.describe('what the student hears', () => {
  test('shows the English transcript, even with speech switched off', async ({ page }) => {
    await openReader(page, 'x^2 + 1');
    await expect(page.getByTestId('spoken-text')).toContainText('squared', { timeout: 10_000 });
  });

  test('shows the Hindi transcript, whether or not a Hindi voice is installed', async ({ page }) => {
    await openReader(page, 'x^2 + 1');
    await page.getByTestId('lang-hi').click();
    // Re-render the current node in the new language.
    await page.getByTestId('go-in').click();
    // वर्ग = "squared". If this appears, the Hindi maths engine is genuinely working.
    await expect(page.getByTestId('spoken-text')).toContainText('वर्ग', { timeout: 10_000 });
  });

  test('the transcript follows the reader as it moves', async ({ page }) => {
    await openReader(page, String.raw`\frac{1}{2a}`);
    const spoken = page.getByTestId('spoken-text');
    await expect(spoken).toContainText('raction', { timeout: 10_000 });

    await page.getByTestId('go-in').click();
    await page.getByTestId('go-next').click();
    await expect(page.getByTestId('breadcrumb')).toHaveText('Fraction ▸ Denominator');
    await expect(spoken).not.toContainText('raction');
  });

  test('recognition reports itself correctly at startup, without opening its screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
    const strip = page.getByRole('contentinfo', { name: 'System status' });
    // Either state is legitimate — what matters is that it reflects the disk, not a guess, and
    // that it always offers a fix when it is not ready.
    const badge = strip.locator('.cap', { hasText: 'Recognition' });
    await expect(badge).toBeVisible();
    // Read the state span, not the whole badge: 'off' is a substring of 'offline', which is exactly
    // the sort of sloppy assertion that passes for the wrong reason.
    const state = (await badge.locator('.cap__state').textContent())?.trim();
    expect(['ready', 'off']).toContain(state);
    if (state === 'off') {
      await expect(badge.locator('.cap__fix')).toContainText('fetch:model');
    } else {
      await expect(badge.locator('.cap__reason')).toContainText('on this device');
    }
  });
});
