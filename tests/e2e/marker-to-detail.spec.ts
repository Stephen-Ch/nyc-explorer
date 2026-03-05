import { test, expect } from '@playwright/test';

test('clicking marker navigates to detail page showing POI title', async ({ request, page }) => {
  // Fetch POI data
  const poiResponse = await request.get('/content/poi.v1.json');
  expect(poiResponse.ok()).toBeTruthy();
  
  const pois = await poiResponse.json();
  expect(Array.isArray(pois)).toBeTruthy();
  expect(pois.length).toBeGreaterThan(0);
  
  const first = pois[0];
  
  // Navigate to home page
  await page.goto('/');
  
  // Wait for markers to load using deterministic selector
  const markers = page.locator('[data-testid="poi-marker"]');
  await expect(markers).toHaveCount(pois.length);
  
  // Click first marker and expect navigation to detail page
  await markers.first().click({ force: true });
  await page.waitForURL(`/poi/${first.id}`);
  
  // Verify detail page shows POI title
  await expect(page.locator('#poi-title')).toContainText(first.name);
});
