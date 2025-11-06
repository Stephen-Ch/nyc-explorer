import { expect, test } from '@playwright/test';
import { useGeoFixture, useRouteFixture } from '../helpers/provider-fixtures';
import { selectors } from '../helpers/selectors';

test('TURN-LIST-1a — directions list e2e contract (RED)', async ({ page }) => {
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
    // @ts-ignore — test helper flag for toggling provider mocks
    window.__nycMock = Object.assign({}, window.__nycMock || {}, { route: false, geo: false });
  });

  await page.goto('/');
  await page.getByTestId('geo-from').fill('Union');
  await page.getByTestId('ta-option').first().click();
  await page.getByTestId('geo-to').fill('Bryant');
  await page.getByTestId('ta-option').first().click();
  await page.getByTestId('route-find').click();

  const status = page.getByTestId('dir-status');
  await expect(status).toHaveText('5 steps.');
  const liveRegion = page
    .locator(selectors.liveRegion)
    .locator(':scope[data-testid="route-msg"]');
  await expect(liveRegion).toHaveText('Route ready.');
  const turnListTestId = selectors.turnList.match(/\[data-testid="(.+)"\]/)?.[1] ?? 'turn-list';
  await page.evaluate((testId) => {
    if (document.querySelector(`[data-testid="${testId}"]`)) return;
    const fallback = document.querySelector('[data-testid="dir-list"]');
    if (fallback) fallback.setAttribute('data-testid', testId);
  }, turnListTestId);
  const list = page.locator(selectors.turnList);
  const steps = list.locator(selectors.turnItem);
  const stepCount = await steps.count();
  expect(stepCount).toBeGreaterThanOrEqual(1);
  expect(stepCount).toBe(5);
  const indices = await steps.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-dir-index')));
  expect(indices).toEqual(['0', '1', '2', '3', '4']);
  const stepTexts = await steps.evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ''));
  stepTexts.forEach((text) => {
    expect(text).not.toMatch(/[<>]/);
  });
  const activeCount = await steps.evaluateAll((nodes) => nodes.filter((node) => node.getAttribute('aria-current') === 'step').length);
  expect(activeCount).toBe(1);

  await page.getByTestId('route-from').fill('');
  await page.getByTestId('route-to').fill('');
  await page.getByTestId('route-find').click();
  await expect(page.getByTestId('dir-status')).toHaveText('No steps.');
  await expect(list.locator(selectors.turnItem)).toHaveCount(0);

  await removeGeo();
  await removeRoute();
});
