import { test, expect } from '@playwright/test';

test('marker button shows visible focus outline', async ({ request, page }) => {
  const response = await request.get('/content/poi.v1.json');
  expect(response.ok()).toBeTruthy();

  const pois = await response.json();
  expect(Array.isArray(pois)).toBeTruthy();
  expect(pois.length).toBeGreaterThan(0);

  await page.goto('/');

  const markers = page.locator('[data-testid="poi-marker"]');
  await expect(markers).toHaveCount(pois.length);

  const firstMarker = markers.first();
  await firstMarker.focus();
  await expect(firstMarker).toBeFocused();

  const outlineStyle = await firstMarker.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outlineStyle).not.toBe('none');
});
