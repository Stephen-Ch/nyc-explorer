import { test, expect } from '@playwright/test';
import { routeSegment } from '../../apps/web-mvc/route';

const SELECTOR = {
  steps: '#route-steps [data-testid="route-step"]',
  activeMarker: '[data-testid="poi-marker-active"]',
  message: '[data-testid="route-msg"]'
};

const pickSegment = (pois: any[]) => {
  const grouped = new Map<string, any[]>();
  pois.filter((p) => p.route_id).forEach((poi) => {
    const list = grouped.get(poi.route_id) ?? [];
    list.push(poi);
    grouped.set(poi.route_id, list);
  });
  const [, list = []] = grouped.entries().next().value ?? [];
  return list.slice(0, 3);
};

test('applies deep-linked segment on load', async ({ page }) => {
  const res = await page.request.get('/content/poi.v1.json');
  const pois = await res.json();
  const [from, , to] = pickSegment(pois);
  const segment = routeSegment(from.id, to.id, pois);
  await page.goto(`/?from=${from.id}&to=${to.id}`);
  await expect(page.locator(SELECTOR.steps)).toHaveCount(segment.length);
  const actives = page.locator(SELECTOR.activeMarker);
  await expect(actives).toHaveCount(segment.length);
  await expect(actives.first()).toHaveAttribute('data-step-index', '0');
  await expect(page.locator(SELECTOR.message)).toBeHidden();
});

test('shows message when deep link cannot resolve segment', async ({ page }) => {
  const res = await page.request.get('/content/poi.v1.json');
  const pois = await res.json();
  const [valid] = pickSegment(pois);
  const mismatch = pois.find((p: any) => !p.route_id) ?? { id: 'poi-missing' };
  await page.goto(`/?from=${valid.id}&to=${mismatch.id}`);
  await expect(page.locator(SELECTOR.steps)).toHaveCount(0);
  await expect(page.locator(SELECTOR.activeMarker)).toHaveCount(0);
  await expect(page.locator(SELECTOR.message)).toBeVisible();
});

test('invalid ids behave like no route', async ({ page }) => {
  const res = await page.request.get('/content/poi.v1.json');
  const pois = await res.json();
  const [, , to] = pickSegment(pois);
  await page.goto(`/?from=__nope__&to=${to.id}`);
  await expect(page.locator(SELECTOR.steps)).toHaveCount(0);
  await expect(page.locator(SELECTOR.activeMarker)).toHaveCount(0);
  await expect(page.locator(SELECTOR.message)).toBeVisible();
});
