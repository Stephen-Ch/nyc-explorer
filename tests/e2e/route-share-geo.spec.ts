import { test, expect } from '@playwright/test';

test.describe('ROUTE-SHARE-GEO-1a — adapter deep link', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any;
      w.App = w.App || {};w.App.adapters = w.App.adapters || {};
      const fromPoint = { lat: 40.715, lng: -73.99, label: 'From Geo' };
      const toPoint = { lat: 40.725, lng: -73.985, label: 'To Geo' };
      w.App.adapters.geo = {
        search: async (q: string) => ((q || '').toLowerCase().includes('from') ? [fromPoint] : [toPoint]),
        current: async () => fromPoint,
      };
      const route = (w.App.adapters.route = w.App.adapters.route || {});
      route.path = async () => [fromPoint, toPoint];
    });
  });

  test('pushes URL params and restores adapter path', async ({ page }) => {
    await page.goto('./');
    const from = page.getByTestId('geo-from');
    await from.fill('from place');
    await page.getByTestId('ta-option').first().click();
    const to = page.getByTestId('geo-to');
    await to.fill('to place');
    await page.getByTestId('ta-option').first().click();
    await page.getByTestId('route-find').click();
    const url = page.url();
    expect(url).toContain('gfrom=');
    expect(url).toContain('gto=');
    expect(url).toContain('gfl=From%20Geo');
    await page.reload();
    await expect(page.getByTestId('route-path')).toBeVisible();
    await expect(page.getByTestId('route-node')).toHaveCount(2);
    await expect(page.getByTestId('poi-marker-active')).toHaveCount(0);
    await expect(page.getByTestId('route-msg')).toHaveText('Route path from From Geo to To Geo.');
  });

  test('invalid params clear adapter state', async ({ page }) => {
    await page.goto('/?gfrom=40.715,-73.99&gfl=From%20Geo');
    await expect(page.getByTestId('route-path')).toHaveCount(0);
    await expect(page.getByTestId('route-node')).toHaveCount(0);
    await expect(page.getByTestId('poi-marker-active')).toHaveCount(0);
    await expect(page.getByTestId('route-msg')).toContainText('Select both From and To to see steps.');
  });
});
