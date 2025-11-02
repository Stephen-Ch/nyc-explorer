import { test, expect } from '@playwright/test';

test('GEO-ADAPTER-1a — From typeahead pulls data from GeoAdapter', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.App = w.App || {};
    w.App.adapters = w.App.adapters || {};
    w.__geoCalls = 0;
    w.App.adapters.geo = {
      search: async (query: string) => {
        w.__geoCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 180));
        if (typeof query === 'string' && query.toLowerCase().includes('union')) {
          return [
            { label: 'Union Square Park', lat: 40.7359, lng: -73.9911 },
            { label: 'Union Square West', lat: 40.7364, lng: -73.9904 },
          ];
        }
        return [];
      },
    };
  });

  await page.goto('/');
  const fromInput = page.getByTestId('geo-from');
  await fromInput.fill('Union');
  const status = page.getByTestId('geo-status');
  await expect(status).toContainText('Searching…');
  const list = page.getByTestId('ta-list');
  await expect(list).toBeVisible();
  const firstOption = list.getByTestId('ta-option').first();
  await expect(firstOption).toContainText('Union');
  await firstOption.click();
  await expect(fromInput).toHaveValue(/Union Square/);
  const dataset = await fromInput.evaluate((el) => ({ lat: el.dataset.geoLat, lng: el.dataset.geoLng }));
  expect(dataset.lat).toBe('40.7359');
  expect(dataset.lng).toBe('-73.9911');
  const calls = await page.evaluate(() => (window as any).__geoCalls);
  expect(calls).toBe(1);

  await fromInput.fill('');
  await fromInput.fill('zzzzzz');
  await expect(status).toContainText('No matches');
  await expect(list).toBeHidden();
});
