import { test, expect } from '@playwright/test';

test.describe('FETCH-GUARD-1a — POI load error contract', () => {
  test('shows error UI when the POI feed fails to load', async ({ page }) => {
    await page.route('**/content/poi.v1.json', async (route) => {
      await route.fulfill({ status: 500, body: 'server error' });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const errorRegion = page.getByTestId('poi-error');
    await expect(errorRegion).toBeVisible();
    await expect(errorRegion).toContainText('Unable to load POIs.');

    await expect(page.locator('#route-steps [data-testid="route-step"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="route-path"]')).toHaveCount(0);
    await expect(page.getByTestId('poi-list').locator('[data-testid="poi-item"]')).toHaveCount(0);
  });
});
