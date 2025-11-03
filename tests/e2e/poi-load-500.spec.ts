import { test, expect } from '@playwright/test';

const POI_FEED = '**/content/poi.v1.json';

test.describe('ERR-LOG-POI-1c — POI load 500 contract', () => {
  test('shows generic error when POI feed returns 500', async ({ page }) => {
    await page.route(POI_FEED, async (route) => {
      await route.fulfill({ status: 500, body: 'boom' });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const errorRegion = page.getByTestId('poi-error');
    await expect(errorRegion).toBeVisible();
    await expect(errorRegion).toContainText('Unable to load POIs.');

    await expect(page.getByTestId('poi-list').locator('[data-testid="poi-item"]')).toHaveCount(0);
    await expect(page.locator('#route-steps [data-testid="route-step"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="route-path"]')).toHaveCount(0);
    await expect(page.getByTestId('share-link')).toBeDisabled();
  });
});
