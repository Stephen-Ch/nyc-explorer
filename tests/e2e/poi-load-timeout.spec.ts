import { test, expect } from '@playwright/test';

const POI_FEED = '**/content/poi.v1.json';
const TIMEOUT_MS = 3200;
const ASSERTION_TIMEOUT = 4000;

test.describe('FETCH-GUARD-2a — POI fetch timeout contract', () => {
  test('shows timeout error when the POI feed stalls', async ({ page }) => {
    await page.route(POI_FEED, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS));
      await route.abort('timedout');
    });

    await page.goto('/');
    const errorRegion = page.getByTestId('poi-error');

    await expect(errorRegion).toBeVisible({ timeout: ASSERTION_TIMEOUT });
    await expect(errorRegion).toContainText('timeout', { timeout: ASSERTION_TIMEOUT });
  });

  test('clears timeout error after a successful reload', async ({ page }) => {
    await page.route(POI_FEED, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS));
      await route.abort('timedout');
    });

    await page.goto('/');
    const errorRegion = page.getByTestId('poi-error');

    await expect(errorRegion).toContainText('timeout', { timeout: ASSERTION_TIMEOUT });

    await page.unroute(POI_FEED);
    await page.reload();

    await expect(errorRegion).toBeHidden({ timeout: ASSERTION_TIMEOUT });
    const listItems = page.getByTestId('poi-list').locator('[data-testid="poi-item"]');
    await expect(listItems.first()).toBeVisible({ timeout: ASSERTION_TIMEOUT });
  });
});
