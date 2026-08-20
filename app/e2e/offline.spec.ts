/**
 * The offline test.
 *
 * The brief's primary requirement is that the software is complete and genuinely working on its
 * own. This test enforces the strict reading of that: with **every external request blocked**, the
 * whole product still works. Any dependency that quietly reaches for a CDN — a font, a locale file,
 * a model hub — fails here rather than in a room with bad Wi-Fi.
 */

import { expect, test, type Page } from '@playwright/test';

/** Block everything that is not the app's own origin. */
async function goOffline(page: Page): Promise<string[]> {
  const blocked: string[] = [];
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith('http://127.0.0.1:4173') || url.startsWith('data:') || url.startsWith('blob:')) {
      await route.continue();
      return;
    }
    blocked.push(url);
    await route.abort();
  });
  return blocked;
}

test.describe('with the network unplugged', () => {
  test('the core journey works and nothing external is even attempted', async ({ page }) => {
    const blocked = await goOffline(page);
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 25_000 });

    // Translation, the display, and the cam numbers all work.
    await page.getByTestId('latex-input').fill('2+3=5');
    await expect(page.getByTestId('braille-unicode')).toHaveText('⠼⠆⠬⠒⠀⠨⠅⠀⠼⠢');
    await expect(page.getByTestId('cell-0')).toHaveAttribute('data-cam', '60');

    // Not one request left the origin. If a dependency ever starts reaching for a CDN, this fails.
    expect(blocked, `blocked external requests:\n${blocked.join('\n')}`).toEqual([]);
  });

  test('the reader, practice and atlas all work offline', async ({ page }) => {
    const blocked = await goOffline(page);
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 25_000 });

    await page.getByLabel('Speak as I read').uncheck();
    await page.getByTestId('latex-input').fill(String.raw`\frac{1}{2a}`);
    await page.waitForTimeout(400);
    await page.getByTestId('mode-explore').click();
    await expect(page.getByTestId('breadcrumb')).toHaveText('Fraction');
    await page.getByTestId('go-in').click();
    await expect(page.getByTestId('breadcrumb')).toHaveText('Fraction ▸ Numerator');

    await page.getByTestId('nav-practice').click();
    await page.getByTestId('answer-input').fill('1');
    await page.getByTestId('check-answer').click();
    await expect(page.getByTestId('verdict')).toContainText('Correct');

    await page.getByTestId('nav-device').click();
    await page.getByTestId('device-atlas').click();
    await expect(page.locator('.atlas__item')).toHaveCount(64);

    expect(blocked, `blocked external requests:\n${blocked.join('\n')}`).toEqual([]);
  });

  test('the typeface is the real one, not a fallback', async ({ page }) => {
    // A demo in a fallback font looks broken. Fonts are self-hosted for exactly this reason.
    await goOffline(page);
    await page.goto('/');
    await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 25_000 });

    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family);
    });
    expect(loaded.join(','), 'IBM Plex should have loaded from our own origin').toContain('IBM Plex');
  });
});
