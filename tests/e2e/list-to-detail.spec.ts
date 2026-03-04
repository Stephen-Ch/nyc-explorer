import { test, expect } from '@playwright/test';

test('list item links to detail page showing POI title', async ({ request, page }) => {
  // Fetch POI data
  const poiResponse = await request.get('/content/poi.v1.json');
  expect(poiResponse.ok()).toBeTruthy();
  
  const pois = await poiResponse.json();
  expect(Array.isArray(pois)).toBeTruthy();
  expect(pois.length).toBeGreaterThan(0);
  
  const { id, name } = pois[0];
  
  // Navigate to home page
  await page.goto('/');
  
  // Find the POI list item by name
  const item = page.locator('[data-testid="poi-item"]', { hasText: name });
  await expect(item).toBeVisible();
  
  // Assert link exists within item (expected RED - poi-link doesn't exist yet)
  const link = item.locator('[data-testid="poi-link"]');
  await expect(link).toBeVisible();
  
  // Click link and verify navigation to detail page
  await Promise.all([
    page.waitForURL(`/poi/${id}`),
    link.click()
  ]);
  
  // Verify detail page shows POI title
  await expect(page.locator('#poi-title')).toContainText(name);
});
