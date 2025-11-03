import { test, expect } from '@playwright/test';

test('GEO-UI-Perf-2a — To typeahead debounce ignores stale results', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.App = w.App || {};
    w.App.adapters = w.App.adapters || {};
    w.__calls = [];
    w.App.adapters.geo = w.App.adapters.geo || {};
    w.App.adapters.geo.search = async (query: string) => {
      w.__calls.push(query);
      const responses: Record<string, any[]> = {
        Sta: [
          { id: 'sta-1', label: 'Staten Island Ferry', lat: 40.643, lng: -74.073 },
          { id: 'sta-2', label: 'Stadium Entrance', lat: 40.829, lng: -73.926 },
        ],
        Stam: [
          { id: 'stam-1', label: 'Stamford Plaza', lat: 40.053, lng: -73.538 },
        ],
      };
      const delay = query === 'Sta' ? 200 : 50;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return responses[query] ?? [];
    };
    w.App.adapters.geo.reverse = async () => null;
  });

  await page.goto('/');
  const input = page.getByTestId('geo-to');
  const status = page.getByTestId('geo-status');
  await input.fill('Sta');
  await page.waitForTimeout(100);
  await input.type('m', { delay: 10 });

  await expect(status).toHaveText('Searching…');
  await expect(status).toHaveText('1 results', { timeout: 5000 });
  const options = page.locator('[data-testid="ta-option"]');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveText('Stamford Plaza');

  await options.first().click();
  await expect(input).toHaveValue('Stamford Plaza');
  await expect(page.locator('[data-testid="ta-list"]')).toBeHidden();

  const calls = await page.evaluate(() => (window as any).__calls);
  expect(calls.length).toBeGreaterThanOrEqual(2);
  expect(calls.at(-1)).toBe('Stam');
});
