import { expect, test } from '@playwright/test';
import { useGeoFixture, useRouteFixture } from '../helpers/provider-fixtures';

test('TURN-LIST-1d — map parity contract (RED)', async ({ page }) => {
  page.on('console', (msg) => console.log('BROWSER:', msg.text()));
  const removeGeo = await useGeoFixture(page, {
    payload: [
      { label: 'Union Square', lat: 40.7359, lng: -73.9911 },
      { label: 'Bryant Park', lat: 40.7536, lng: -73.9832 },
    ],
  });
  const removeRoute = await useRouteFixture(page, {
    payload: {
      path: [
        { lat: 40.7359, lng: -73.9911 },
        { lat: 40.742, lng: -73.987 },
        { lat: 40.746, lng: -73.985 },
        { lat: 40.75, lng: -73.984 },
        { lat: 40.7536, lng: -73.9832 },
      ],
      steps: Array.from({ length: 5 }).map((_, index) => ({ text: `Step ${index + 1}` })),
    },
  });

  await page.addInitScript(() => {
    // @ts-ignore - provider toggle helper
    window.__nycMock = Object.assign({}, window.__nycMock || {}, { route: false, geo: false });
  });

  await page.goto('/');
  await page.getByTestId('geo-from').fill('Union');
  await page.getByTestId('ta-option').first().click();
  await page.getByTestId('geo-to').fill('Bryant');
  await page.getByTestId('ta-option').first().click();
  await page.getByTestId('route-find').click();

  await expect(page.getByTestId('dir-status')).toHaveText('5 steps.');
  const list = page.getByTestId('dir-list');
  const steps = list.getByTestId('dir-step');
  await expect(steps).toHaveCount(5);
  await page.focus('[data-testid="dir-list"]');
  await expect(list).toBeFocused();

  // TODO(TURN-LIST-1d): expect overlay to expose [data-testid="route-node-active"][data-step-index]
  const activeNode = page.locator('[data-testid="route-node-active"][data-step-index="0"]');
  await expect(activeNode).toBeVisible();

  await page.keyboard.press('ArrowDown');
  console.log('DOM nodes after ArrowDown:', await page.evaluate(() => Array.from(document.querySelectorAll('[data-testid^="route-node"]')).map(n => ({ testid: n.getAttribute('data-testid'), idx: n.getAttribute('data-step-index') }))));
  await expect(page.locator('[data-testid="route-node-active"][data-step-index="1"]')).toBeVisible();

  await removeRoute();
  await removeGeo();
});
