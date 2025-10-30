import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test('home page renders map and POI list from /content/poi.v1.json', async ({ page, request }) => {
  // First, verify the POI endpoint is working
  const poiResponse = await request.get(`${BASE_URL}/content/poi.v1.json`);
  
  if (poiResponse.status() !== 200) {
    throw new Error('Cannot fetch POIs at /content/poi.v1.json');
  }

  const pois = await poiResponse.json();
  
  if (!Array.isArray(pois) || pois.length < 3) {
    throw new Error('Cannot fetch POIs at /content/poi.v1.json');
  }

  // Navigate to home page
  await page.goto(BASE_URL);

  // Check for map container
  const mapContainer = page.locator('#map');
  if (!(await mapContainer.isVisible())) {
    throw new Error('#map not found on home page');
  }

  // Check for POI list items
  const poiItems = page.locator('[data-testid="poi-item"]');
  const count = await poiItems.count();
  
  if (count < 3) {
    throw new Error('POI list did not render ≥3 items');
  }

  // Verify first 3 POI names appear in the list
  const pageText = await page.textContent('body');
  
  for (let i = 0; i < 3; i++) {
    const poiName = pois[i].name;
    if (!pageText?.includes(poiName)) {
      throw new Error(`POI name "${poiName}" not found in page content`);
    }
  }

  // Verify map container is visible
  await expect(mapContainer).toBeVisible();
});
