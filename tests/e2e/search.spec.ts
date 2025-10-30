import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test('search input filters POI list by name (case-insensitive)', async ({ request, page }) => {
  // Fetch POI data to get a valid search query
  const poiResponse = await request.get(`${BASE_URL}/content/poi.v1.json`);
  expect(poiResponse.ok()).toBeTruthy();
  
  const pois = await poiResponse.json();
  expect(Array.isArray(pois)).toBeTruthy();
  expect(pois.length).toBeGreaterThan(0);
  
  // Use first 6 chars of first POI name as search query
  const q = pois[0].name.slice(0, 6);
  
  // Navigate to home page
  await page.goto(BASE_URL + '/');
  
  // Verify search input is visible (will fail - RED)
  const searchInput = page.locator('[data-testid="search-input"]');
  await expect(searchInput).toBeVisible();
  
  // Type search query
  await searchInput.fill(q);
  
  // Wait for filtering to apply
  await page.waitForTimeout(300);
  
  // Verify at least one POI item is visible
  const poiItems = page.locator('[data-testid="poi-item"]');
  const count = await poiItems.count();
  expect(count).toBeGreaterThan(0);
  
  // Verify all visible items contain the query (case-insensitive)
  for (let i = 0; i < count; i++) {
    const text = await poiItems.nth(i).textContent();
    expect(text?.toLowerCase()).toContain(q.toLowerCase());
  }
  
  // Clear and type nonsense query
  await searchInput.fill('__nomatch__');
  await page.waitForTimeout(300);
  
  // Verify no POI items are visible
  expect(await poiItems.count()).toBe(0);
});
