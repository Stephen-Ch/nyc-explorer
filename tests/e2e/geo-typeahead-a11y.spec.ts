import { test, expect } from '@playwright/test';

test('GEO-UI-1c-a — From typeahead keyboard + a11y contract', async ({ page }) => {
  await page.addInitScript(() => {
    const results = [
      { id: 'mock-1', label: 'Union Square Park', lat: 40.7359, lng: -73.9911, kind: 'place' },
      { id: 'mock-2', label: 'Union Square West', lat: 40.7363, lng: -73.9919, kind: 'intersection' },
      { id: 'mock-3', label: 'Union Square East', lat: 40.7355, lng: -73.9899, kind: 'intersection' }
    ];
    (window as any).App = (window as any).App || {};
    const adapters = ((window as any).App.adapters = (window as any).App.adapters || {});
    adapters.geo = {
      search: async () => results,
      reverse: async () => results[0]
    };
  });

  await page.goto('./');
  const input = page.locator('[data-testid="geo-from"]');
  await input.fill('Uni');

  const list = page.locator('[data-testid="ta-list"]');
  const options = page.locator('[data-testid="ta-option"]');
  await expect(list).toBeVisible();
  await expect(list).toHaveAttribute('role', 'listbox');
  await expect(options).toHaveCount(3);
  await expect(options.first()).toHaveAttribute('role', 'option');

  await input.press('ArrowDown');
  const active = page.locator('[data-testid="ta-option-active"]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute('aria-selected', 'true');
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
  await expect(page.locator('[data-testid="geo-status"]')).toContainText('3 results');

  await input.press('ArrowDown');
  await input.press('ArrowDown');
  await expect(page.locator('[data-testid="ta-option-active"]')).toContainText('Union Square East');
  await input.press('ArrowDown');
  await expect(page.locator('[data-testid="ta-option-active"]')).toContainText('Union Square East');

  await input.press('ArrowUp');
  await expect(page.locator('[data-testid="ta-option-active"]')).toContainText('Union Square West');
  await input.press('Enter');
  await expect(input).toHaveValue('Union Square West');
  await expect(list).toBeHidden();

  await input.fill('Uni');
  await expect(list).toBeVisible();
  await input.press('Escape');
  await expect(list).toBeHidden();
});
