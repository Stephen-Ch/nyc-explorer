import { expect, test } from '@playwright/test';
import { useGeoFixture, useRouteFixture } from '../helpers/provider-fixtures';

test('ROUTE-FIND-WIRE-1a — provider Find contract (RED)', async ({ page }) => {
  const removeGeo = await useGeoFixture(page, {
    payload: [
      { label: 'Union Square', lat: 40.7359, lng: -73.9911 },
      { label: 'Bryant Park', lat: 40.7536, lng: -73.9832 },
    ],
  });
  const removeRoute = await useRouteFixture(page, {
    payload: {
      path: [
        { lat: 40.7359, lng: -73.9911 },
        { lat: 40.7536, lng: -73.9832 },
      ],
      steps: [{ text: 'Walk north', lat: 40.7359, lng: -73.9911 }],
    },
  });

  await page.goto('/');
  const fromInput = page.getByTestId('geo-from');
  const toInput = page.getByTestId('geo-to');

  await fromInput.fill('Union Square');
  await expect(page.getByTestId('ta-option').first()).toBeVisible();
  await page.getByTestId('ta-option').first().click();

  await toInput.fill('Bryant Park');
  await expect(page.getByTestId('ta-option').first()).toBeVisible();
  await page.getByTestId('ta-option').first().click();

  await page.getByTestId('route-find').click();

  await expect(page.getByTestId('route-path')).toHaveCount(1);
  const nodeCount = await page.getByTestId('route-node').count();
  expect(nodeCount).toBeGreaterThan(0);
  await expect(page.getByTestId('poi-marker-active')).toHaveCount(0);
  await expect(page.getByTestId('route-msg')).toContainText('Route:');

  const currentUrl = await page.evaluate(() => window.location.href);
  expect(currentUrl).toContain('?');
  expect(currentUrl).toContain('gfrom=');
  expect(currentUrl).toContain('gto=');
  expect(currentUrl).toContain('gfl=');
  expect(currentUrl).toContain('gtl=');

  await removeGeo();
  await removeRoute();
});
