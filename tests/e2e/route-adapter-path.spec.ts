import { test, expect } from '@playwright/test';

test('ROUTE-ADAPTER-PATH-1a — renders adapter path overlay', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.App = w.App || {};
    w.App.adapters = w.App.adapters || {};
    w.App.adapters.geo = w.App.adapters.geo || {};
    w.App.adapters.geo.search = async (query: string) => {
      const q = (query || '').toLowerCase();
      if (q.includes('start')) {
        return [{ label: 'Union Start', lat: 40.7359, lng: -73.9912 }];
      }
      if (q.includes('end')) {
        return [{ label: 'Union End', lat: 40.7412, lng: -73.9887 }];
      }
      return [];
    };
    w.__pathArgs = [];
    w.App.adapters.route = w.App.adapters.route || {};
    w.App.adapters.route.path = async (from: any, to: any) => {
      w.__pathArgs.push({ from, to });
      return [
        { lat: 40.7359, lng: -73.9912 },
        { lat: 40.7388, lng: -73.9898 },
        { lat: 40.7412, lng: -73.9887 },
      ];
    };
  });

  await page.goto('/');
  const fromInput = page.getByTestId('geo-from');
  await fromInput.fill('Union start');
  await page.locator('#geo-from-list [data-testid="ta-option"]').first().click();

  const toInput = page.getByTestId('geo-to');
  await toInput.fill('Union end');
  await page.locator('#geo-to-list [data-testid="ta-option"]').first().click();

  await page.getByTestId('route-find').click();
  await expect(page.locator('[data-testid="route-path"]')).toHaveCount(1);
  const overlayNodes = page.locator('[data-testid="route-node"], [data-testid="route-node-active"]');
  await expect(overlayNodes).toHaveCount(3);
  await expect(page.locator('[data-testid="poi-marker-active"]')).toHaveCount(0);

  const pathArgs = await page.evaluate(() => (window as any).__pathArgs);
  expect(pathArgs).toHaveLength(1);
  expect(pathArgs[0].from).toMatchObject({ lat: 40.7359, lng: -73.9912 });
  expect(pathArgs[0].to).toMatchObject({ lat: 40.7412, lng: -73.9887 });

  await toInput.fill('Mismatch');
  await page.getByTestId('route-find').click();
  await expect(page.locator('[data-testid="route-path"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="route-node"]')).toHaveCount(0);
  await expect(page.getByTestId('route-msg')).toContainText(/Select|No matching/i);
});
