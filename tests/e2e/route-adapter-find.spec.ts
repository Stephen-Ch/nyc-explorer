import { test, expect } from '@playwright/test';

test('ROUTE-ADAPTER-1c-a — Find prefers RouteAdapter segment output', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.App = w.App || {};
    w.App.adapters = w.App.adapters || {};
    const existing = w.App.adapters.route || {};
    w.App.adapters.route = {
      ...existing,
      segment: async () => [
        { id: 'X1', name: 'Adapter One' },
        { id: 'X2', name: 'Adapter Two' },
      ],
    };
  });

  await page.goto('/');
  await page.getByTestId('route-from').fill('Union Square Park');
  await page.getByTestId('route-to').fill('Flatiron Building');
  await page.getByTestId('route-find').click();

  const steps = page.locator('[data-testid="route-step"]');
  await expect(steps).toHaveCount(2);
  await expect(steps.nth(0)).toHaveText('Adapter One');
  await expect(steps.nth(1)).toHaveText('Adapter Two');
  await expect(page.locator('[data-testid="route-msg"]')).toContainText('Route: 2 steps');
});
