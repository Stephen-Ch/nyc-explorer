import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { useGeoFixture } from '../helpers/provider-fixtures';

const providerUrl = 'https://fake-provider.example/directions';
const geoOptions = {
  payload: [
    { label: 'Union Square', lat: 40.7359, lng: -73.9911 },
    { label: 'Bryant Park', lat: 40.7536, lng: -73.9832 },
  ],
};

const forceProviders = async (page: Page) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.__nycMock = { ...(w.__nycMock || {}), geo: false, route: false };
  });
};

test('P36 — RATE-LIMIT-OPS-1b — provider fallback after 429 (RED)', async ({ page }) => {
  await forceProviders(page);
  const removeGeo = await useGeoFixture(page, geoOptions);

  let callCount = 0;
  const handler = async (route: any) => {
    callCount += 1;
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Too Many Requests' }),
    });
  };
  await page.route(providerUrl, handler);

  await page.goto('/');
  await page.getByTestId('geo-from').fill('Union');
  await expect(page.getByTestId('ta-option').first()).toBeVisible();
  await page.getByTestId('ta-option').first().click();
  await page.getByTestId('geo-to').fill('Bryant');
  await expect(page.getByTestId('ta-option').first()).toBeVisible();
  await page.getByTestId('ta-option').first().click();
  await page.getByTestId('route-find').click();

  const liveRegion = page.getByTestId('route-msg');
  await expect(liveRegion).toHaveText('Route ready.');
  await expect(page.getByTestId('route-path')).toHaveCount(1);
  expect(await page.getByTestId('route-node').count()).toBeGreaterThanOrEqual(2);
  const turnItems = page.getByTestId('turn-list').getByTestId('turn-item');
  expect(await turnItems.count()).toBeGreaterThan(0);
  expect(callCount).toBe(2);

  await page.getByTestId('route-find').click();
  await expect(liveRegion).toHaveText('Route ready.');
  expect(callCount).toBe(2);

  await page.unroute(providerUrl, handler);
  await removeGeo();
});
