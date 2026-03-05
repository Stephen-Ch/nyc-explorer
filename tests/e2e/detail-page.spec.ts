import { test, expect } from '@playwright/test';

test('detail page shows POI summary and sources', async ({ request, page }) => {
  // Fetch POI data to get a valid ID and name
  const poiResponse = await request.get('/content/poi.v1.json');
  expect(poiResponse.ok()).toBeTruthy();
  
  const pois = await poiResponse.json();
  expect(Array.isArray(pois)).toBeTruthy();
  expect(pois.length).toBeGreaterThan(0);
  
  const firstPOI = pois[0];
  const { id, name } = firstPOI;
  
  // Navigate to detail page
  await page.goto(`/poi/${id}`, { waitUntil: 'commit' });
  
  // Verify POI title is displayed (already implemented)
  await expect(page.locator('#poi-title')).toContainText(name);
  
  // Verify summary is visible (new)
  await expect(page.locator('#poi-summary')).toBeVisible();
  
  // Verify at least one source is rendered (new)
  const sources = page.locator('[data-testid="poi-source"]');
  expect(await sources.count()).toBeGreaterThan(0);
});
