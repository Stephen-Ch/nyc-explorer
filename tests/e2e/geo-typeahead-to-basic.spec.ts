import { test, expect } from '@playwright/test';

test.describe('GEO-UI-2a — typeahead To input', () => {
  test('shows options and updates value when an option is selected', async ({ page }) => {
    await page.addInitScript(() => {
      const result = { id: 'mock-2', label: 'Union Square East', lat: 40.7355, lng: -73.9899, kind: 'intersection' };
      (window as any).App = (window as any).App || {};
      const adapters = ((window as any).App.adapters = (window as any).App.adapters || {});
      adapters.geo = {
        search: async () => [result],
        reverse: async () => result,
      };
    });

    await page.goto('./');

    const toInput = page.locator('[data-testid="geo-to"]');
    await toInput.fill('Uni');

    const list = page.locator('[data-testid="ta-list"]');
    await expect(list).toBeVisible();

    const options = page.locator('[data-testid="ta-option"]');
    await expect(options).toHaveCount(1);

    await options.first().click();
    await expect(toInput).toHaveValue(/Union Square East/);
    await expect(list).toBeHidden();
  });
});
