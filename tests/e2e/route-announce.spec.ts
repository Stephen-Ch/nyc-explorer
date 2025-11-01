import { test, expect } from '@playwright/test';
import { routeSegment } from '../../apps/web-mvc/route';

const SELECTOR = {
  from: '[data-testid="route-from"]',
  to: '[data-testid="route-to"]',
  find: '[data-testid="route-find"]',
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

test('route message announces route state changes', async ({ page }) => {
  const res = await page.request.get('/content/poi.v1.json');
  const pois = await res.json();
  const route = pickRoute(pois);
  expect(route.length).toBeGreaterThanOrEqual(2);
  const segment = routeSegment(route[0].id, route[route.length - 1].id, pois);
  const resetCopy = 'Select both From and To to see steps.';

  await page.goto('/');
  const msg = page.locator(SELECTOR.msg);
  await expect(msg).toHaveCount(1);
  await expect(msg).toHaveAttribute('aria-live', /polite/i);

  await page.fill(SELECTOR.from, segment[0].id);
  await page.fill(SELECTOR.to, segment[segment.length - 1].id);
  await page.click(SELECTOR.find);
  await expect(msg).toHaveText(/route|steps/i);

  await page.fill(SELECTOR.to, '');
  await page.click(SELECTOR.find);
  await expect(msg).toHaveText(resetCopy);
});
