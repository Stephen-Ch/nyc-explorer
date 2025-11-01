import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test('marker receives keyboard activation to navigate to detail page', async ({ request, page }) => {
  const response = await request.get(`${BASE_URL}/content/poi.v1.json`);
  expect(response.ok()).toBeTruthy();

  const pois = await response.json();
  expect(Array.isArray(pois)).toBeTruthy();
  expect(pois.length).toBeGreaterThan(0);

  const first = pois[0];

  await page.goto(`${BASE_URL}/`);

  const markers = page.locator('[data-testid="poi-marker"]');
  await expect(markers).toHaveCount(pois.length);

  await markers.first().focus();
  await page.keyboard.press('Enter');

  await page.waitForURL(`${BASE_URL}/poi/${first.id}`);
  await expect(page.locator('#poi-title')).toContainText(first.name);
});
