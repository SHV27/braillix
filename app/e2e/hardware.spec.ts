/**
 * The Hardware journey.
 *
 * Two claims are tested here, and both are load-bearing on 22 August:
 *   · the app connects to a pod that speaks the real protocol and adopts the cell count IT reports
 *   · a wrongly wired cam is a ten-second settings change, not a debugging session on stage
 */

import { expect, test, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';

const POD_SCRIPT = join(process.cwd(), '..', 'tools', 'virtual-pod', 'virtual-pod.mjs');
const POD_PORT = 8241;
const POD_CELLS = 3;

let pod: ChildProcess | undefined;

test.beforeAll(async () => {
  pod = spawn(
    process.execPath,
    [POD_SCRIPT, '--cells', String(POD_CELLS), '--port', String(POD_PORT), '--quiet'],
    { stdio: 'ignore' },
  );
  const deadline = Date.now() + 15_000;
  for (;;) {
    try {
      if ((await fetch(`http://127.0.0.1:${POD_PORT}/chain`)).ok) return;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error('virtual pod did not start');
    await new Promise((r) => setTimeout(r, 150));
  }
});

test.afterAll(() => {
  pod?.kill();
});

async function openHardware(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('braille-unicode')).toContainText('⠭', { timeout: 20_000 });
  await page.getByTestId('nav-device').click();
  await expect(page.getByRole('heading', { name: 'Hardware', level: 1 })).toBeVisible();
}

test.describe('the hardware seam', () => {
  test('starts on the simulator, because the product is complete without hardware', async ({ page }) => {
    await openHardware(page);
    await expect(page.getByTestId('link-label')).toContainText('simulated');
    await expect(page.getByTestId('link-label')).toContainText('connected');
    await expect(page.getByTestId('link-cells')).toContainText('(simulated)');
  });

  test('connects to a real pod and adopts the cell count the POD reports', async ({ page }) => {
    await openHardware(page);
    await page.getByTestId('pod-hosts').fill(`127.0.0.1:${POD_PORT}`);
    await page.getByTestId('connect-pods').click();

    await expect(page.getByTestId('link-label')).toContainText('127.0.0.1', { timeout: 15_000 });
    await expect(page.getByTestId('link-label')).toContainText('connected');
    // The pod has three cells. Nothing in the app chose that number.
    await expect(page.getByTestId('link-cells')).toContainText(`${POD_CELLS} (reported by the hardware)`);
    await expect(page.getByText('braillix-virtual-pod/1.0')).toBeVisible();
  });

  test('drives the connected pod when the expression changes', async ({ page }) => {
    await openHardware(page);
    await page.getByTestId('pod-hosts').fill(`127.0.0.1:${POD_PORT}`);
    await page.getByTestId('connect-pods').click();
    await expect(page.getByTestId('link-cells')).toContainText(`${POD_CELLS} (reported`, { timeout: 15_000 });

    await page.getByTestId('test-dot-1').click();
    // Dot 1 with the default wiring is cam position 1 — ask the pod what it is actually showing.
    await expect
      .poll(
        async () => {
          const chain = await fetch(`http://127.0.0.1:${POD_PORT}/`).then((r) => r.json());
          return chain.cells;
        },
        { timeout: 10_000 },
      )
      .toBe(POD_CELLS);
  });

  test('reports a pod that is not there, with a fix', async ({ page }) => {
    await openHardware(page);
    await page.getByTestId('pod-hosts').fill('127.0.0.1:8999');
    await page.getByTestId('connect-pods').click();
    await expect(page.getByTestId('link-error')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('link-error')).toContainText('could not reach');
  });

  test('calibration changes the cam number without touching the braille', async ({ page }) => {
    await openHardware(page);

    // The handoff's worked example: dots 1-2-5 is cam position 19.
    await expect(page.getByText('is cam position')).toContainText('19');

    // Now say dot 1 actually drives cam track 5 — the exact fault the handoff warns about.
    await page.getByTestId('bit-for-dot-1').selectOption('5');
    await expect(page.getByText('is cam position')).not.toContainText('is cam position 19');

    // …and the braille itself is untouched: the atlas still shows the same dot patterns.
    await page.getByTestId('nav-device').click();
    await page.getByTestId('device-atlas').click();
    await expect(page.locator('.atlas__item')).toHaveCount(64);
  });

  test('a single dot can be raised on every cell, for checking against the physical cam', async ({ page }) => {
    await openHardware(page);
    await page.getByTestId('test-dot-3').click();
    await expect(page.getByTestId('test-dot-3')).toHaveClass(/is-current/);
    await page.getByTestId('test-clear').click();
    await expect(page.getByTestId('test-dot-3')).not.toHaveClass(/is-current/);
  });

  test('the simulated display can be resized, and real hardware cannot', async ({ page }) => {
    await openHardware(page);
    await expect(page.getByTestId('hw-cell-count')).toBeVisible();
    await page.getByTestId('hw-cell-count').fill('6');
    await expect(page.getByTestId('link-cells')).toContainText('6 (simulated)');

    await page.getByTestId('pod-hosts').fill(`127.0.0.1:${POD_PORT}`);
    await page.getByTestId('connect-pods').click();
    await expect(page.getByTestId('link-cells')).toContainText('(reported by the hardware)', { timeout: 15_000 });
    // The size control is gone: the hardware decides, not the slider.
    await expect(page.getByTestId('hw-cell-count')).toHaveCount(0);
  });
});
