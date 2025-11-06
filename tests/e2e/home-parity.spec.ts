import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const LIVE_REGIONS = ['geo-status', 'dir-status', 'route-msg'];
const KEY_SELECTORS = ['#map', '[data-testid="poi-list"]', '[data-testid="turn-list"]', '[data-testid="route-msg"]'];

async function collectSnapshot(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  const ready = await page.getByTestId('poi-list').isVisible();
  const snapshot = await page.evaluate(({ lives, selectors }: { lives: string[]; selectors: string[] }) => {
    const counts: Record<string, number> = {};
    Array.from(document.querySelectorAll('[data-testid]')).forEach(node => {
      const id = node.getAttribute('data-testid');
      if (!id) return;
      counts[id] = (counts[id] || 0) + 1;
    });
    const live = Object.fromEntries(lives.map((id: string) => [
      id,
      ((document.querySelector(`[data-testid="${id}"]`)?.textContent || '').trim()) || null,
    ]));
    const containers = Object.fromEntries(selectors.map((sel: string) => [sel, !!document.querySelector(sel)]));
    return { counts, live, containers };
  }, { lives: LIVE_REGIONS, selectors: KEY_SELECTORS });
  return { ready, ...snapshot };
}

test('shadow home view matches home DOM invariants', async ({ page }) => {
  const canonical = await collectSnapshot(page, '/');
  expect(canonical.ready).toBe(true);

  const shadow = await collectSnapshot(page, '/__view-home');
  expect(shadow.ready).toBe(true);
  expect(shadow.containers).toEqual(canonical.containers);
  expect(shadow.counts).toEqual(canonical.counts);
  expect(shadow.live).toEqual(canonical.live);
});
