import { test, expect } from '@playwright/test';
import { routeSegment } from '../../apps/web-mvc/route';

const SELECTOR = {
  from: '[data-testid="route-from"]',
  to: '[data-testid="route-to"]',
  find: '[data-testid="route-find"]',
  path: '[data-testid="route-path"]'
};

const pickRoute = (pois: any[]) => {
  const grouped = new Map<string, any[]>();
  pois.filter((p) => p.route_id).forEach((poi) => {
    const list = grouped.get(poi.route_id) ?? [];
    list.push(poi);
    grouped.set(poi.route_id, list);
  });
  return [...grouped.values()].find((list) => list.length >= 2) ?? [];
};

test('route path overlay toggles with active segment and reset', async ({ page }) => {
  const res = await page.request.get('/content/poi.v1.json');
  const pois = await res.json();
  const route = pickRoute(pois);
  expect(route.length).toBeGreaterThanOrEqual(2);
  const segment = routeSegment(route[0].id, route[route.length - 1].id, pois);

  await page.goto('/');
  await page.fill(SELECTOR.from, segment[0].id);
  await page.fill(SELECTOR.to, segment[segment.length - 1].id);
  await page.click(SELECTOR.find);
  await expect(page.locator(SELECTOR.path)).toHaveCount(1);

  await page.fill(SELECTOR.to, '');
  await page.click(SELECTOR.find);
  await expect(page.locator(SELECTOR.path)).toHaveCount(0);

  await page.goto(`/?from=${segment[0].id}&to=${segment[segment.length - 1].id}`);
  await expect(page.locator(SELECTOR.path)).toHaveCount(1);

  await page.fill(SELECTOR.from, '');
  await page.click(SELECTOR.find);
  await expect(page.locator(SELECTOR.path)).toHaveCount(0);
});
