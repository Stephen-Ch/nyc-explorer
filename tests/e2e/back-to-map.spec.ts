import { test, expect } from '@playwright/test';

test('back-to-map link navigates from detail page to home with map and POIs', async ({ request, page }) => {
  // Fetch POI data to get a valid ID
  const poiResponse = await request.get('/content/poi.v1.json');
  expect(poiResponse.ok()).toBeTruthy();
  
  const pois = await poiResponse.json();
  expect(Array.isArray(pois)).toBeTruthy();
  expect(pois.length).toBeGreaterThan(0);
  
  const firstPOI = pois[0];
  const { id } = firstPOI;
  
  // Navigate to detail page
  // waitUntil:'commit' avoids hanging on subresource load (e.g. missing images)
  await page.goto(`/poi/${id}`, { waitUntil: 'commit' });
  
  // Verify we're on the detail page
  await expect(page.locator('#poi-title')).toBeVisible();
  
  // Click back-to-map link
  await page.locator('[data-testid="back-to-map"]').click();
  
  // Verify we're back at home page
  await expect(page).toHaveURL('/');
  
  // Verify map is visible
  await expect(page.locator('#map')).toBeVisible();
  
  // Verify POI items are rendered
  const poiItems = page.locator('[data-testid="poi-item"]');
  await expect(poiItems.nth(2)).toBeVisible();
  
  // Verify Leaflet markers are rendered
  const markers = page.locator('.leaflet-marker-icon');
  await expect(markers.nth(2)).toBeVisible();
});
