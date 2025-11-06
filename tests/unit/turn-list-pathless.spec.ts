import { expect, test } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { useRouteFixture } from '../helpers/provider-fixtures';

const loadFixture = (file: string) => JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'route', file), 'utf-8'));
const stepsOnly = loadFixture('provider-steps-only.json');
const stepsOnlyCount = stepsOnly.routes?.[0]?.legs?.[0]?.steps?.length ?? 0;
const from = { label: 'Union Square', lat: 40.7359, lng: -73.9911 };
const to = { label: 'Bryant Park', lat: 40.7536, lng: -73.9832 };

test('P35 — Turn list persists when provider omits path', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.__nycMock = { ...(w.__nycMock || {}), route: false };
  });
  const disposeRoute = await useRouteFixture(page, { payload: stepsOnly });
  await page.goto('/');
  await page.evaluate(({ from, to }) => {
    const geoFrom = document.querySelector('[data-testid="geo-from"]') as HTMLInputElement | null;
    const geoTo = document.querySelector('[data-testid="geo-to"]') as HTMLInputElement | null;
    const routeFrom = document.querySelector('[data-testid="route-from"]') as HTMLInputElement | null;
    const routeTo = document.querySelector('[data-testid="route-to"]') as HTMLInputElement | null;
    if (geoFrom) {
      geoFrom.value = from.label;
      geoFrom.dataset.geoLat = String(from.lat);
      geoFrom.dataset.geoLng = String(from.lng);
      geoFrom.dataset.geoLabel = from.label;
    }
    if (geoTo) {
      geoTo.value = to.label;
      geoTo.dataset.geoLat = String(to.lat);
      geoTo.dataset.geoLng = String(to.lng);
      geoTo.dataset.geoLabel = to.label;
    }
    if (routeFrom) routeFrom.value = from.label;
    if (routeTo) routeTo.value = to.label;
  }, { from, to });

  await page.getByTestId('route-find').click();

  const liveRegion = page.getByTestId('route-msg');
  const turnItems = page.getByTestId('turn-list').getByTestId('turn-item');
  await expect(page.getByTestId('route-path')).toHaveCount(0);
  await expect(liveRegion).toHaveText('Route ready (turns only).');
  await expect(turnItems).toHaveCount(Math.max(stepsOnlyCount, 1));
  await expect(turnItems).toHaveCount(Math.max(stepsOnlyCount, 1));

  await disposeRoute();
});
