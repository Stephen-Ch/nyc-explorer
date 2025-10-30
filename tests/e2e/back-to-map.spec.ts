import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test('back-to-map link navigates from detail page to home with map and POIs', async ({ request, page }) => {
  // Fetch POI data to get a valid ID
  const poiResponse = await request.get(`${BASE_URL}/content/poi.v1.json`);
  expect(poiResponse.ok()).toBeTruthy();
  
  const pois = await poiResponse.json();
  expect(Array.isArray(pois)).toBeTruthy();
  expect(pois.length).toBeGreaterThan(0);
  
  const firstPOI = pois[0];
  const { id } = firstPOI;
  
  // Navigate to detail page
  await page.goto(`${BASE_URL}/poi/${id}`);
  
  // Verify we're on the detail page
  await expect(page.locator('#poi-title')).toBeVisible();
  
  // Click back-to-map link
  await page.locator('[data-testid="back-to-map"]').click();
  
  // Verify we're back at home page
  await expect(page).toHaveURL(BASE_URL + '/');
  
  // Verify map is visible
  await expect(page.locator('#map')).toBeVisible();
  
  // Verify POI items are rendered
  const poiItems = page.locator('[data-testid="poi-item"]');
  expect(await poiItems.count()).toBeGreaterThanOrEqual(3);
  
  // Verify Leaflet markers are rendered
  const markers = page.locator('.leaflet-marker-icon');
  expect(await markers.count()).toBeGreaterThanOrEqual(3);
});
