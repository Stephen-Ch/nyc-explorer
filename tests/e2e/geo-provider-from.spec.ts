import { expect, test } from '@playwright/test';
import { useGeoFixture } from '../helpers/provider-fixtures';

test('GEO-ADAPTER-2a — geocoder provider From contract (RED)', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.__nycMock = { ...(w.__nycMock || {}), geo: false };
  });
  const removeGeo = await useGeoFixture(page, {
    payload: [
      { label: 'Union Square East', lat: 40.7351, lng: -73.9901 },
      { label: 'Union Square West', lat: 40.7356, lng: -73.9906 },
      { label: 'Union Square North', lat: 40.7362, lng: -73.9909 },
    ],
  });

  await page.goto('/');
  const fromInput = page.getByTestId('geo-from');
  const status = page.getByTestId('geo-status');
  const list = page.getByTestId('ta-list');

  await fromInput.fill('union');
  await expect(status).toHaveText('Searching…');
  await expect(list).toBeVisible();
  const options = list.getByTestId('ta-option');
  await expect(options).toHaveCount(3);
  await expect(status).toHaveText('3 results');

  const firstOption = options.first();
  const htmlCheck = await firstOption.evaluate((node) => ({
    text: node.textContent ?? '',
    html: node.innerHTML,
  }));
  expect(htmlCheck.html.trim()).toBe(htmlCheck.text.trim());

  await firstOption.click();
  await expect(fromInput).toHaveValue('Union Square East');
  const dataset = await fromInput.evaluate((el) => ({ lat: el.dataset.geoLat, lng: el.dataset.geoLng }));
  expect(dataset.lat).toBe('40.7351');
  expect(dataset.lng).toBe('-73.9901');

  await removeGeo();
});
