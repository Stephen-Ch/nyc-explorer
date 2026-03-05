import { test, expect } from '@playwright/test';

test('detail page renders primary image with credit line', async ({ request, page }) => {
  const response = await request.get('/content/poi.v1.json');
  expect(response.ok()).toBeTruthy();

  const pois = await response.json();
  expect(Array.isArray(pois)).toBeTruthy();

  const withImage = pois.find((poi: any) => Array.isArray(poi.images) && poi.images.length > 0);
  expect(withImage).toBeTruthy();

  await page.goto(`/poi/${withImage.id}`, { waitUntil: 'commit' });

  const image = page.locator('img[data-testid="poi-image"]').first();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('alt', new RegExp(withImage.name, 'i'));

  const credit = page.locator('[data-testid="img-credit"]');
  await expect(credit.first()).toBeVisible();
});
