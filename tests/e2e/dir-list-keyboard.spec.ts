import { expect, test } from '@playwright/test';
import { useGeoFixture, useRouteFixture } from '../helpers/provider-fixtures';

test('TURN-LIST-1c — directions keyboard nav + aria parity', async ({ page }) => {
  page.on('console', (msg) => console.log('BROWSER:', msg.text()));
  page.on('pageerror', (error) => console.log('PAGEERROR:', error?.stack ?? error?.message ?? error));
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

  const status = page.getByTestId('dir-status');
  await expect(status).toHaveText('5 steps.');
  const directionsSrc = await page.evaluate(() => fetch('/js/directions.js').then((res) => res.text()));
  console.log('directions.js length:', directionsSrc.length);
  console.log(directionsSrc.slice(0, 120));
  await page.waitForFunction(() => {
    // @ts-ignore evaluating App helpers in browser scope
    return typeof window.App?.dir?.render === 'function';
  });
  const dirState = await page.evaluate(() => {
    // @ts-ignore inspecting App helpers in browser scope
    const dir = window.App?.dir;
    return {
      hasDir: Boolean(dir),
      bound: dir && typeof dir.isBound === 'function' ? dir.isBound() : false,
      activeIndex: dir && typeof dir.getActiveIndex === 'function' ? dir.getActiveIndex() : null,
    };
  });
  console.log('dir init state:', dirState);
  const list = page.getByTestId('dir-list');
  const steps = list.getByTestId('dir-step');
  await expect(steps).toHaveCount(5);
  console.log('initial aria-current:', await steps.evaluateAll((els) => els.map((el) => el.getAttribute('aria-current'))));

  await expect(list).toHaveJSProperty('tabIndex', 0);
  await page.focus('[data-testid="dir-list"]');
  await expect(list).toBeFocused();
  const expectActive = async (index: number) => {
    await expect.poll(async () => {
      const vals = await steps.evaluateAll((els) => els.map((el) => el.getAttribute('aria-current')));
      const activeCount = vals.filter((v) => v === 'step').length;
      return { vals, activeCount };
    }).toEqual({ vals: Array.from({ length: 5 }, (_, idx) => (index >= 0 && idx === index ? 'step' : null)), activeCount: 1 });
  };

  // Kick off navigation from keyboard — when the map promotes step 0 the first ArrowDown moves
  // the list to step 1; continue cycling and verify wrap-around/Up behavior.
  await page.keyboard.press('ArrowDown');
  await expectActive(1);
  await page.keyboard.press('ArrowDown');
  await expectActive(2);
  await page.keyboard.press('ArrowDown');
  await expectActive(3);
  for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowDown');
  await expectActive(1);
  await page.keyboard.press('ArrowUp');
  await expectActive(0);

  await page.getByTestId('route-from').fill('');
  await page.getByTestId('route-to').fill('');
  await page.getByTestId('route-find').click();
  await expect(page.getByTestId('dir-status')).toHaveText('No steps.');
  await expect(page.getByTestId('dir-list').getByTestId('dir-step')).toHaveCount(0);

  await removeRoute();
  await removeGeo();
});
