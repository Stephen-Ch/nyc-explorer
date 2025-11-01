import { test, expect } from '@playwright/test';

const SELECTOR = {
  from: '[data-testid="route-from"]',
  to: '[data-testid="route-to"]',
  find: '[data-testid="route-find"]',
  steps: '#route-steps [data-testid="route-step"]',
  markerActive: '[data-testid="poi-marker-active"]'
};

const sortRoute = (list: any[]) => [...list].sort((a, b) => {
  if (typeof a.order === 'number' && typeof b.order === 'number' && a.order !== b.order) {
    return a.order - b.order;
  }
  return (a.name ?? '').localeCompare(b.name ?? '');
});

const segmentIds = (fromId: string, toId: string, pois: any[]) => {
  const from = pois.find((p) => p.id === fromId);
  const to = pois.find((p) => p.id === toId);
  if (!from || !to || from.route_id !== to.route_id) return [];
  const route = sortRoute(pois.filter((p) => p.route_id === from.route_id && p.coords));
  const start = route.findIndex((p) => p.id === fromId);
  const end = route.findIndex((p) => p.id === toId);
  if (start === -1 || end === -1) return [];
  const slice = start <= end ? route.slice(start, end + 1) : route.slice(end, start + 1).reverse();
  return slice.map((p) => p.id);
};

test('highlights active markers for each segment', async ({ page }) => {
  const res = await page.request.get('/content/poi.v1.json');
  const pois = await res.json();
  const groups = new Map<string, any[]>();
  pois.filter((p: any) => p.route_id).forEach((poi: any) => {
    const list = groups.get(poi.route_id) ?? [];
    list.push(poi);
    groups.set(poi.route_id, list);
  });
  const target = [...groups.values()].map(sortRoute).find((list) => list.length >= 4);
  if (!target) {
    throw new Error('expected route with ≥4 POIs');
  }
  const segmentOne = segmentIds(target[0].id, target[2].id, pois);
  const segmentTwo = segmentIds(target[1].id, target[3].id, pois);

  await page.goto('/');
  await page.fill(SELECTOR.from, target[0].id);
  await page.fill(SELECTOR.to, target[2].id);
  await page.click(SELECTOR.find);

  const steps = page.locator(SELECTOR.steps);
  await expect(steps).toHaveCount(segmentOne.length);
  const active = page.locator(SELECTOR.markerActive);
  await expect(active).toHaveCount(segmentOne.length);
  await expect(active.first()).toHaveAttribute('data-step-index', '0');
  const firstIndices = await active.evaluateAll((els) => els.map((el) => el.getAttribute('data-step-index')));
  expect(firstIndices).toEqual(segmentOne.map((_, idx) => String(idx)));
  const firstIds = await active.evaluateAll((els) => els.map((el) => el.getAttribute('data-id')));
  expect(firstIds).toEqual(segmentOne);
  for (let i = 0; i < segmentOne.length; i += 1) {
    await expect(active.nth(i)).toHaveAttribute('aria-current', 'step');
  }

  await page.fill(SELECTOR.from, target[1].id);
  await page.fill(SELECTOR.to, target[3].id);
  await page.click(SELECTOR.find);

  await expect(active).toHaveCount(segmentTwo.length);
  const secondIndices = await active.evaluateAll((els) => els.map((el) => el.getAttribute('data-step-index')));
  expect(secondIndices).toEqual(segmentTwo.map((_, idx) => String(idx)));
  const secondIds = await active.evaluateAll((els) => els.map((el) => el.getAttribute('data-id')));
  expect(secondIds).toEqual(segmentTwo);
  for (let i = 0; i < segmentTwo.length; i += 1) {
    await expect(active.nth(i)).toHaveAttribute('aria-current', 'step');
  }
});
