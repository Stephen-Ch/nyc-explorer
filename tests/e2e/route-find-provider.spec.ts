import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { useGeoFixture, useRouteFixture } from '../helpers/provider-fixtures';

const selectGeoSuggestion = async (page: Page, field: 'geo-from' | 'geo-to', query: string) => {
  const input = page.getByTestId(field);
  await input.fill(query);
  const listId = field === 'geo-from' ? 'geo-from-list' : 'geo-to-list';
  const option = page.locator(`#${listId}`).getByTestId('ta-option').first();
  await expect(option).toBeVisible();
  await option.click();
};

test.describe('ROUTE-FIND-4b — provider wiring (GREEN)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any;
      w.__nycMock = Object.assign({}, w.__nycMock || {}, { route: false, geo: false });
    });
  });

  test('renders provider polyline and turn list', async ({ page }) => {
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
          { lat: 40.742, lng: -73.987 },
          { lat: 40.7536, lng: -73.9832 },
        ],
        steps: [
          { text: 'Head north on Broadway', lat: 40.7359, lng: -73.9911 },
          { text: 'Turn right toward Bryant Park', lat: 40.753, lng: -73.984 },
        ],
      },
    });

    await page.goto('/');
    await selectGeoSuggestion(page, 'geo-from', 'Union');
    await selectGeoSuggestion(page, 'geo-to', 'Bryant');
    await page.getByTestId('route-find').click();

    await expect(page.getByTestId('route-path')).toHaveCount(1);
    await expect(page.getByTestId('route-msg')).toHaveText('Route ready.');
    await expect(page.getByTestId('dir-status')).toHaveText('2 steps.');
  const steps = page.getByTestId('turn-list').getByTestId('turn-item');
    await expect(steps).toHaveCount(2);
    await expect(steps.nth(0)).toHaveText('Head north on Broadway');

    await removeRoute();
    await removeGeo();
  });

  test('handles steps-only payload with partial copy', async ({ page }) => {
    const removeGeo = await useGeoFixture(page, {
      payload: [
        { label: 'Union Square', lat: 40.7359, lng: -73.9911 },
        { label: 'Bryant Park', lat: 40.7536, lng: -73.9832 },
      ],
    });
    const removeRoute = await useRouteFixture(page, {
      payload: {
        path: [],
        steps: [
          { text: 'Continue toward 5th Avenue', lat: 40.7362, lng: -73.9909 },
          { text: 'Arrive at Bryant Park', lat: 40.7536, lng: -73.9832 },
        ],
      },
    });

    await page.goto('/');
    await selectGeoSuggestion(page, 'geo-from', 'Union');
    await selectGeoSuggestion(page, 'geo-to', 'Bryant');
    await page.getByTestId('route-find').click();

    await expect(page.getByTestId('route-path')).toHaveCount(0);
    await expect(page.getByTestId('route-msg')).toHaveText('Route ready (turns only).');
    await expect(page.getByTestId('dir-status')).toHaveText('2 steps.');
  await expect(page.getByTestId('turn-list').getByTestId('turn-item')).toHaveCount(2);

    await removeRoute();
    await removeGeo();
  });

  test('surfaces provider timeout gracefully', async ({ page }) => {
    const removeGeo = await useGeoFixture(page, {
      payload: [
        { label: 'Union Square', lat: 40.7359, lng: -73.9911 },
        { label: 'Bryant Park', lat: 40.7536, lng: -73.9832 },
      ],
    });

    await page.route('**/directions**', (route) => route.abort('failed'));

    await page.goto('/');
    await selectGeoSuggestion(page, 'geo-from', 'Union');
    await selectGeoSuggestion(page, 'geo-to', 'Bryant');
    await page.getByTestId('route-find').click();

    await expect(page.getByTestId('route-msg')).toHaveText('Unable to build route.');
    await expect(page.getByTestId('dir-status')).toHaveText('No steps.');
  await expect(page.getByTestId('turn-list').getByTestId('turn-item')).toHaveCount(0);
    await expect(page.getByTestId('route-path')).toHaveCount(0);

    await page.unroute('**/directions**');
    await removeGeo();
  });
});
