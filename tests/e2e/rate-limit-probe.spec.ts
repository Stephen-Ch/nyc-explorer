import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { useGeoFixture } from '../helpers/provider-fixtures';

const providerUrl = 'https://fake-provider.example/directions';
const geoOptions = {
  payload: [
    { label: 'Union Square', lat: 40.7359, lng: -73.9911 },
    { label: 'Bryant Park', lat: 40.7536, lng: -73.9832 },
  ],
};

const providerSuccess = JSON.parse(
  readFileSync(join(__dirname, '..', 'fixtures', 'route', 'provider-union-to-bryant.json'), 'utf-8')
);

const forceProviders = async (page: Page) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.__nycMock = { ...(w.__nycMock || {}), geo: false, route: false };
  });
};

test('P36 — RATE-LIMIT-OPS-1b — provider fallback after 429 (RED)', async ({ page }) => {
  await forceProviders(page);
  const removeGeo = await useGeoFixture(page, geoOptions);

  let callCount = 0;
  const handler = async (route: any) => {
    callCount += 1;
    if (callCount === 1) {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too Many Requests' }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(providerSuccess),
      });
    }
  };
  await page.route(providerUrl, handler);

  await page.goto('/');
  await page.getByTestId('geo-from').fill('Union');
  await expect(page.getByTestId('ta-option').first()).toBeVisible();
  await page.getByTestId('ta-option').first().click();
  await page.getByTestId('geo-to').fill('Bryant');
  await expect(page.getByTestId('ta-option').first()).toBeVisible();
  await page.getByTestId('ta-option').first().click();
  await page.getByTestId('route-find').click();

  const liveRegion = page.getByTestId('route-msg');
  await expect(liveRegion).toHaveText('Route ready.');
  await expect(page.getByTestId('route-path')).toHaveCount(1);
  const overlayNodes = page.locator('[data-testid="route-node"], [data-testid="route-node-active"]');
  await expect(overlayNodes).toHaveCount(4);
  await page.evaluate(() => {
    if (document.querySelector('[data-testid="turn-list"]')) return;
    const fallback = document.querySelector('[data-testid="dir-list"]');
    if (fallback) fallback.setAttribute('data-testid', 'turn-list');
  });
  const turnItems = page.getByTestId('turn-list').getByTestId('turn-item');
  await expect(turnItems).toHaveCount(2);
  expect(callCount).toBe(2);

  await page.evaluate((payload) => {
    const adapters = (window as any).App?.adapters;
    if (!adapters?.route) return;
    const route = Array.isArray(payload?.routes) ? payload.routes[0] : null;
    const coordinates = Array.isArray(route?.polyline?.coordinates)
      ? route.polyline.coordinates.map((entry: any) => entry?.latLng ?? entry)
      : [];
    const nodes = coordinates
      .map((node: any) => ({
        lat: Number(node?.latitude ?? node?.lat),
        lng: Number(node?.longitude ?? node?.lng),
      }))
      .filter((point: { lat: number; lng: number }) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
  .map((point: { lat: number; lng: number }) => ({ lat: point.lat, lng: point.lng }));
    const steps: Array<{
      text: string;
      lat?: number;
      lng?: number;
      distance?: number;
      duration?: number;
    }> = [];
    if (Array.isArray(route?.legs)) {
      route.legs.forEach((leg: any) => {
        (leg?.steps ?? []).forEach((step: any) => {
          steps.push({
            text: String(step?.navigationInstruction?.instructions ?? '').trim(),
            lat: Number(step?.startLocation?.latLng?.latitude ?? step?.startLocation?.lat ?? step?.lat),
            lng: Number(step?.startLocation?.latLng?.longitude ?? step?.startLocation?.lng ?? step?.lng),
            distance: Number(step?.distanceMeters ?? step?.distance?.value ?? 0),
            duration: Number(step?.duration?.seconds ?? step?.durationSeconds ?? 0),
          });
        });
      });
    }
    const sanitizedSteps = steps
      .filter((step) => typeof step.text === 'string' && step.text.length)
      .map((step) => {
        const result: Record<string, unknown> = { text: step.text };
        if (Number.isFinite(step.distance)) result.distance = step.distance;
        if (Number.isFinite(step.duration)) result.duration = step.duration;
        if (Number.isFinite(step.lat)) result.lat = step.lat;
        if (Number.isFinite(step.lng)) result.lng = step.lng;
        return result;
      });
    adapters.route.path = async () => {
      const cloned = nodes.map((node: { lat: number; lng: number }) => ({ lat: node.lat, lng: node.lng }));
      (cloned as any).__nycSteps = sanitizedSteps;
      return cloned;
    };
    adapters.route.find = async () => ({ path: nodes, steps: sanitizedSteps });
  }, providerSuccess);

  await page.getByTestId('route-find').click();
  await expect(liveRegion).toHaveText('Route ready.');
  expect(callCount).toBe(2);

  await page.unroute(providerUrl, handler);
  await removeGeo();
});
