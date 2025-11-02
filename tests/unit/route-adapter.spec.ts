import { test, expect } from '@playwright/test';

test('ROUTE-ADAPTER-1a — RouteAdapter contract', async ({ page }) => {
  await page.goto('/');

  const adapterPresent = await page.evaluate(() => Boolean((window as any)?.App?.adapters?.route));
  expect(adapterPresent, 'RouteAdapter not implemented').toBe(true);

  const walkIsFunction = await page.evaluate(() => typeof (window as any)?.App?.adapters?.route?.walk === 'function');
  expect(walkIsFunction, 'RouteAdapter.walk not implemented').toBe(true);

  const from = { lat: 40.741048, lng: -73.989708 };
  const to = { lat: 40.735863, lng: -73.991084 };
  const result = await page.evaluate(async ({ from, to }) => {
    const adapter = (window as any).App.adapters.route;
    return adapter.walk(from, to);
  }, { from, to });

  expect(Array.isArray(result?.nodes), 'walk() must return { nodes: LatLng[], length_m: number }').toBe(true);
  expect(result.nodes.length).toBeGreaterThanOrEqual(2);
  expect(typeof result.length_m).toBe('number');
  expect(result.length_m).toBeGreaterThan(0);
});
