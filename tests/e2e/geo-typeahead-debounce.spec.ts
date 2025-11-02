import { test, expect } from '@playwright/test';

test('GEO-UI-Perf-1b — From typeahead debounce ignores stale results', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.App = w.App || {};
    w.App.adapters = w.App.adapters || {};
    w.__calls = [];
    const responses = new Map([
      ['u', [{ id: 'u-1', label: 'U Street', lat: 40.7, lng: -73.9 }]],
      ['un', [{ id: 'un-1', label: 'Union St', lat: 40.71, lng: -73.91 }]],
      ['uni', [{ id: 'uni-1', label: 'University Pl', lat: 40.72, lng: -73.92 }]],
      ['union', [
        { id: 'union-1', label: 'Union Square Park', lat: 40.7359, lng: -73.9911 },
        { id: 'union-2', label: 'Union Square East', lat: 40.7355, lng: -73.9902 },
      ]],
    ]);
    w.App.adapters.geo = {
      search: async (query: string) => {
        w.__calls.push(query);
        const delay = query.length * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return responses.get(query) ?? [];
      },
      reverse: async () => null,
    };
  });

  await page.goto('/');
  const input = page.getByTestId('geo-from');
  const status = page.getByTestId('geo-status');
  await input.fill('u');
  await input.type('nion', { delay: 10 });

  await expect(status).toHaveText('Searching…');
  await expect(status).toHaveText('2 results', { timeout: 5000 });
  const options = page.locator('[data-testid="ta-option"]');
  await expect(options).toHaveCount(2);
  await expect(options.first()).toHaveText('Union Square Park');
  await expect(options.nth(1)).toHaveText('Union Square East');

  const calls = await page.evaluate(() => (window as any).__calls);
  expect(calls).toEqual(['union']);
});
