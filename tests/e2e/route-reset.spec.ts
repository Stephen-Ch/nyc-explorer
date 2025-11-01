import { test, expect } from '@playwright/test';
import { routeSegment } from '../../apps/web-mvc/route';

const SELECTOR = {
  from: '[data-testid="route-from"]',
  to: '[data-testid="route-to"]',
  find: '[data-testid="route-find"]',
  steps: '#route-steps [data-testid="route-step"]',
  active: '[data-testid="poi-marker-active"]',
  msg: '[data-testid="route-msg"]'
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

const successMessage = (segment: any[]) =>
  `Route: ${segment.length} steps from ${segment[0].name ?? segment[0].id} to ${segment[segment.length - 1].name ?? segment[segment.length - 1].id}.`;

test('route UI resets when inputs are cleared or invalid', async ({ page }) => {
  const res = await page.request.get('/content/poi.v1.json');
  const pois = await res.json();
  const route = pickRoute(pois);
  const segment = routeSegment(route[0].id, route[route.length - 1].id, pois);

  await page.goto('/');
  await page.fill(SELECTOR.from, segment[0].id);
  await page.fill(SELECTOR.to, segment[segment.length - 1].id);
  await page.click(SELECTOR.find);
  await expect(page.locator(SELECTOR.steps)).toHaveCount(segment.length);
  await expect(page.locator(SELECTOR.active)).toHaveCount(segment.length);
  await expect(page.locator(SELECTOR.msg)).toHaveText(successMessage(segment));

  await page.fill(SELECTOR.to, '');
  await page.click(SELECTOR.find);
  await expect(page.locator(SELECTOR.steps)).toHaveCount(0);
  await expect(page.locator(SELECTOR.active)).toHaveCount(0);
  await expect(page.locator(SELECTOR.msg)).toHaveText(/select both/i);

  await page.fill(SELECTOR.from, '__nope__');
  await page.fill(SELECTOR.to, '__nope__');
  await page.click(SELECTOR.find);
  await expect(page.locator(SELECTOR.steps)).toHaveCount(0);
  await expect(page.locator(SELECTOR.active)).toHaveCount(0);
  await expect(page.locator(SELECTOR.msg)).toBeVisible();

  await page.fill(SELECTOR.from, route[0].id);
  await page.fill(SELECTOR.to, route[1].id);
  await page.click(SELECTOR.find);
  const refreshed = routeSegment(route[0].id, route[1].id, pois);
  await expect(page.locator(SELECTOR.steps)).toHaveCount(refreshed.length);
  await expect(page.locator(SELECTOR.active)).toHaveCount(refreshed.length);
  await expect(page.locator(SELECTOR.msg)).toHaveText(successMessage(refreshed));
});
