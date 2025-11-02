import { test, expect } from '@playwright/test';

test('GEO-UI-4a — To typeahead pulls from GeoAdapter', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.App = w.App || {};
    w.App.adapters = w.App.adapters || {};
    w.__geoCalls = [];
    w.App.adapters.geo = {
      search: async (query: string) => {
        w.__geoCalls.push(query);
        await new Promise((resolve) => setTimeout(resolve, 150));
        const q = (query || '').toLowerCase();
        if (q.includes('union')) {
          return [
            { label: 'Union Square South', lat: 40.7356, lng: -73.9905 },
            { label: 'Union Square North', lat: 40.7371, lng: -73.9909 },
          ];
        }
        if (q.includes('err')) throw new Error('adapter-fail');
        return [];
      },
    };
  });

  await page.goto('/');
  const toInput = page.getByTestId('geo-to');
  const status = page.getByTestId('geo-status');
  const list = page.getByTestId('ta-list');

  await toInput.fill('Union');
  await expect(status).toContainText('Searching…');
  await expect(list).toBeVisible();
  const option = list.getByTestId('ta-option').first();
  await expect(option).toContainText('Union');
  await option.click();
  await expect(toInput).toHaveValue(/Union Square/);
  const dataset = await toInput.evaluate((el) => ({ lat: el.dataset.geoLat, lng: el.dataset.geoLng, label: el.dataset.geoLabel }));
  expect.soft(dataset.lat).toBeDefined(); // TODO GEO-UI-4b ensure data attrs exist
  expect.soft(dataset.lng).toBeDefined();
  expect.soft(dataset.label).toBeDefined();

  await toInput.fill('zz');
  await expect(status).toContainText('No results');
  await expect(list).toBeHidden();

  await toInput.fill('err');
  await expect(status).toContainText('Error contacting geocoder');
  await expect(list).toBeHidden();

  const calls = await page.evaluate(() => (window as any).__geoCalls);
  expect(calls).toEqual(['Union', 'zz', 'err']);
});
