import { expect, test } from '@playwright/test';
import { useGeoFixture } from '../helpers/provider-fixtures';

test('GEO-ADAPTER-2c-a — geocoder timeout contract (RED)', async ({ page }) => {
  const removeGeo = await useGeoFixture(page, {
    payload: [],
    once: true,
  });

  await page.route('**/geocode**', async (route) => {
    if (route.request().url().includes('?q=')) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
    await route.fallback();
  });

  await page.goto('/');
  const fromInput = page.getByTestId('geo-from');
  const status = page.getByTestId('geo-status');
  const list = page.getByTestId('ta-list');

  await fromInput.fill('Union Square');
  await expect(status).toHaveText('Searching…');
  await expect(list).toBeHidden();
  await expect(status).toHaveText('Unable to search locations (timeout)');
  await expect(list).toBeHidden();

  await removeGeo();
});
