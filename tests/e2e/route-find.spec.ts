import { test, expect } from '@playwright/test';

const SELECTOR = {
  from: '[data-testid="route-from"]',
  to: '[data-testid="route-to"]',
  find: '[data-testid="route-find"]',
  steps: '#route-steps [data-testid="route-step"]',
  msg: '[data-testid="route-msg"]'
};

const sortRoute = (list: any[]) => [...list].sort((a, b) => {
  if (typeof a.order === 'number' && typeof b.order === 'number') return a.order - b.order;
  if (typeof a.order === 'number') return -1;
  if (typeof b.order === 'number') return 1;
  return (a.name ?? '').localeCompare(b.name ?? '');
});

const segmentIds = (fromId: string, toId: string, pois: any[]) => {
  const fromPoi = pois.find((p) => p.id === fromId);
  const toPoi = pois.find((p) => p.id === toId);
  if (!fromPoi || !toPoi || fromPoi.route_id !== toPoi.route_id) return [];
  const route = sortRoute(pois.filter((p) => p.route_id === fromPoi.route_id && p.coords));
  const start = route.findIndex((p) => p.id === fromId);
  const end = route.findIndex((p) => p.id === toId);
  if (start === -1 || end === -1) return [];
  const slice = start <= end ? route.slice(start, end + 1) : route.slice(end, start + 1).reverse();
  return slice.map((p) => p.id);
};

test.describe('Find Route', () => {
  test('renders inclusive segment for matching ids', async ({ page }) => {
    const res = await page.request.get('/content/poi.v1.json');
    const pois = await res.json();
    const groups = new Map<string, any[]>();
    pois.filter((p: any) => p.route_id).forEach((poi: any) => {
      const list = groups.get(poi.route_id) ?? [];
      list.push(poi);
      groups.set(poi.route_id, list);
    });
    const target = [...groups.values()].map(sortRoute).find((list) => list.length >= 3) ?? [];
    const fromPoi = target[0];
    const toPoi = target[1];
    const expected = segmentIds(fromPoi.id, toPoi.id, pois);
    await page.goto('/');
    await page.fill(SELECTOR.from, fromPoi.id);
    await page.fill(SELECTOR.to, toPoi.id);
    await page.click(SELECTOR.find);
    const steps = page.locator(SELECTOR.steps);
    await expect(steps, 'expected segment length').toHaveCount(expected.length);
    const texts = await steps.allTextContents();
    expect(texts).toHaveLength(expected.length);
  });

  test('shows message when segment is missing', async ({ page }) => {
    await page.goto('/');
    await page.fill(SELECTOR.from, 'poi-nonexistent-a');
    await page.fill(SELECTOR.to, 'poi-nonexistent-b');
    await page.click(SELECTOR.find);
    await expect(page.locator(SELECTOR.steps), 'expected no steps on mismatch').toHaveCount(0);
    await expect(page.locator(SELECTOR.msg), 'expected route message').toBeVisible();
    await expect(page.locator(SELECTOR.msg)).toHaveText(/.+/);
  });
});
