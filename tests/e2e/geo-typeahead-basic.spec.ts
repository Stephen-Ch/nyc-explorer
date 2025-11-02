import { test, expect } from '@playwright/test';

test.describe('GEO-UI-1a — typeahead From input', () => {
  test('shows options and updates value when an option is selected', async ({ page }) => {
    await page.addInitScript(() => {
      const result = { id: 'mock-1', label: 'Union Square Park', lat: 40.7359, lng: -73.9911, kind: 'place' };
      (window as any).App = (window as any).App || {};
      const adapters = ((window as any).App.adapters = (window as any).App.adapters || {});
      adapters.geo = {
        search: async () => [result],
        reverse: async () => result,
      };
    });

    await page.goto('./');

    const fromInput = page.locator('[data-testid="geo-from"]');
    await fromInput.fill('Uni');

    const list = page.locator('[data-testid="ta-list"]');
    await expect(list).toBeVisible();

  const options = page.locator('[data-testid="ta-option"]');
  await expect(options).toHaveCount(1);

    await options.first().click();
    await expect(fromInput).toHaveValue(/Union Square Park/);
    await expect(list).toBeHidden();
  });
});
