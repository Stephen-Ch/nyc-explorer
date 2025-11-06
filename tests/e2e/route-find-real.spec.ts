import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { useGeoFixture, useRouteFixture } from '../helpers/provider-fixtures';
import { selectors } from '../helpers/selectors';

const loadFixture = (file: string) => {
  const fullPath = join(__dirname, '..', 'fixtures', 'route', file);
  return JSON.parse(readFileSync(fullPath, 'utf-8'));
};

const unionRoute = loadFixture('provider-union-to-bryant.json');
const stepsOnlyRoute = loadFixture('provider-steps-only.json');
const unionStepCount = unionRoute.routes?.[0]?.legs?.[0]?.steps?.length ?? 0;
const stepsOnlyCount = stepsOnlyRoute.routes?.[0]?.legs?.[0]?.steps?.length ?? 0;

const geoPayload = [
  { label: 'Union Square', lat: 40.7359, lng: -73.9911 },
  { label: 'Bryant Park', lat: 40.7536, lng: -73.9832 },
];

const forceProviders = async (page: Page) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.__nycMock = { ...(w.__nycMock || {}), geo: false, route: false };
  });
};

const configureGeo = (page: Page) => useGeoFixture(page, { payload: geoPayload });

const enterStops = async (page: Page) => {
  const fromInput = page.getByTestId('geo-from');
  const toInput = page.getByTestId('geo-to');
  await fromInput.fill('Union');
  await expect(page.getByTestId('ta-option').first()).toBeVisible();
  await page.getByTestId('ta-option').first().click();
  await toInput.fill('Bryant');
  await expect(page.getByTestId('ta-option').first()).toBeVisible();
  await page.getByTestId('ta-option').first().click();
  await page.getByTestId('route-find').click();
};

test.describe('ROUTE-FIND-4a — provider wiring contract (RED)', () => {
  test('renders provider path and turns when fixtures supply polyline', async ({ page }) => {
    await forceProviders(page);
    const removeGeo = await configureGeo(page);
    const removeRoute = await useRouteFixture(page, { payload: unionRoute });

    await page.goto('/');
    await enterStops(page);

    const pathNodes = page.getByTestId('route-node');
    const turnList = page.locator(selectors.turnList);
    const turnItems = turnList.locator(selectors.turnItem);
    const liveRegion = page
      .locator(selectors.liveRegion)
      .locator(':scope[data-testid="route-msg"]');

    await expect(page.getByTestId('route-path')).toHaveCount(1);
    expect(await pathNodes.count()).toBeGreaterThanOrEqual(2);
    await expect(turnList).toBeVisible();
    await expect(turnItems).toHaveCount(unionStepCount);
    await expect(liveRegion).toHaveText('Route ready.');

    await removeGeo();
    await removeRoute();
  });

  test('falls back to turn list when provider omits polyline', async ({ page }) => {
    // RED CONTRACT — provider fallback pending
    await forceProviders(page);
    const removeGeo = await configureGeo(page);
    const removeRoute = await useRouteFixture(page, { payload: stepsOnlyRoute });

    await page.goto('/');
    await enterStops(page);

    const turnItems = page.locator(selectors.turnList).locator(selectors.turnItem);
    const liveRegion = page
      .locator(selectors.liveRegion)
      .locator(':scope[data-testid="route-msg"]');
    const status = page.getByTestId('dir-status');

    const expectedSteps = Math.max(stepsOnlyCount, 1);
    const expectedStatus = expectedSteps === 1 ? '1 step.' : `${expectedSteps} steps.`;
    await expect(page.getByTestId('route-path')).toHaveCount(0);
    await expect(status).toHaveText(expectedStatus);
    await expect(turnItems).toHaveCount(expectedSteps);
    await expect(liveRegion).toHaveText('Route ready (turns only).');

    await removeGeo();
    await removeRoute();
  });

  test('announces provider timeout without crashing', async ({ page }) => {
    // RED CONTRACT — timeout handling pending
    await forceProviders(page);
    const removeGeo = await configureGeo(page);

    const timeoutHandler = async (route: any) => route.abort('failed');
    await page.route('**/directions', timeoutHandler);

    await page.goto('/');
    await enterStops(page);

    const liveRegion = page
      .locator(selectors.liveRegion)
      .locator(':scope[data-testid="route-msg"]');
    await expect(liveRegion).toHaveText(/Unable to build route/i);
    await expect(page.getByTestId('turn-item')).toHaveCount(0);

    await page.unroute('**/directions', timeoutHandler);
    await removeGeo();
  });
});
