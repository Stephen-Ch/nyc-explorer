import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test('route steps update when POIs are filtered', async ({ request, page }) => {
  const response = await request.get(`${BASE_URL}/content/poi.v1.json`);
  expect(response.ok()).toBeTruthy();

  const pois = await response.json();
  const first = pois[0];
  const query = first.name.slice(0, 6);

  await page.goto(`${BASE_URL}/`);

  const search = page.locator('[data-testid="search-input"]');
  await search.fill(query);

  const poiItems = page.locator('[data-testid="poi-item"]');
  await expect(poiItems.filter({ hasText: query })).not.toHaveCount(0);

  const steps = page.locator('#route-steps [data-testid="route-step"]');
  await expect(steps.filter({ hasText: first.name })).not.toHaveCount(0);

  await search.fill('');
  await search.type('__nomatch__');

  await expect(steps).toHaveCount(0);
});
