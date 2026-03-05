import { test, expect } from '@playwright/test';

test('detail route /poi/{id} renders POI with back-to-map link', async ({ request, page }) => {
  // Fetch POI data to get a valid ID and name
  const poiResponse = await request.get('/content/poi.v1.json');
  expect(poiResponse.ok()).toBeTruthy();
  
  const pois = await poiResponse.json();
  expect(Array.isArray(pois)).toBeTruthy();
  expect(pois.length).toBeGreaterThan(0);
  
  const firstPOI = pois[0];
  const { id, name } = firstPOI;
  
  // Navigate to detail page
  await page.goto(`/poi/${id}`);
  
  // Verify POI title is displayed
  await expect(page.locator('#poi-title')).toContainText(name);
  
  // Verify back-to-map link is visible
  await expect(page.locator('[data-testid="back-to-map"]')).toBeVisible();
});

test('detail route /poi/__missing__ returns 404', async ({ request }) => {
  const res404 = await request.get('/poi/__missing__');
  expect(res404.status()).toBe(404);
});
