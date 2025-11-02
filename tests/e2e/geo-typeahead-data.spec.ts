import { test, expect } from '@playwright/test';

test('GEO-UI-3a — typeahead selections persist coords for RouteAdapter', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.App = w.App || {};
    w.App.adapters = w.App.adapters || {};
    w.App.adapters.geo = {
      suggest: async () => [
        { id: 'from-1', label: 'From Suggestion', lat: 40.7351, lng: -73.9902 },
        { id: 'to-1', label: 'To Suggestion', lat: 40.7422, lng: -73.9915 },
      ],
      reverse: async () => null,
    };
    w.__lastArgs = null;
    w.App.adapters.route = w.App.adapters.route || {};
    w.App.adapters.route.segment = async (args: any) => {
      w.__lastArgs = args;
      return [{ id: 's1', name: 'Step 1', coords: { lat: 40.73, lng: -73.99 } }];
    };
  });

  await page.goto('/');
  await page.getByTestId('geo-from').fill('from place');
  const fromOption = page.locator('#geo-from-list [data-testid="ta-option"]').first();
  await expect(fromOption).toBeVisible();
  await fromOption.click();
  await page.getByTestId('geo-to').fill('destination');
  const toOption = page.locator('#geo-to-list [data-testid="ta-option"]').nth(1);
  await expect(toOption).toBeVisible();
  await toOption.click();
  await page.getByTestId('route-find').click();

  const datasets = await page.evaluate(() => {
    const from = document.querySelector('[data-testid="geo-from"]') as HTMLInputElement | null;
    const to = document.querySelector('[data-testid="geo-to"]') as HTMLInputElement | null;
    return {
      fromLat: from?.dataset.geoLat,
      fromLng: from?.dataset.geoLng,
      toLat: to?.dataset.geoLat,
      toLng: to?.dataset.geoLng,
    };
  });

  expect(datasets.fromLat).toBe('40.7351');
  expect(datasets.fromLng).toBe('-73.9902');
  expect(datasets.toLat).toBe('40.7422');
  expect(datasets.toLng).toBe('-73.9915');

  const lastArgs = await page.evaluate(() => (window as any).__lastArgs);
  expect(lastArgs?.from?.lat).toBe(40.7351);
  expect(lastArgs?.from?.lng).toBe(-73.9902);
  expect(lastArgs?.to?.lat).toBe(40.7422);
  expect(lastArgs?.to?.lng).toBe(-73.9915);
});
