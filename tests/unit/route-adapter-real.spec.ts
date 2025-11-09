import { expect, test } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { useRouteFixture } from '../helpers/provider-fixtures';

const load = (file: string) => JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'route', file), 'utf-8'));
const provider = load('provider-union-to-bryant.json');
const stepsOnly = load('provider-steps-only.json');
const from = { lat: 40.7359, lng: -73.9911 };
const to = { lat: 40.7536, lng: -73.9832 };

test('ROUTE-ADAPTER-2a — provider payload normalizes path + steps (RED)', async ({ page }) => {
  await page.addInitScript(() => { const w = window as any; w.__nycMock = { ...(w.__nycMock || {}), route: false }; });
  const dispose = await useRouteFixture(page, { payload: provider, once: true });
  await page.goto('/');
  const result = await page.evaluate(async ({ from, to }) => {
    const adapters = (window as any).App?.adapters;
    const path = await adapters.route.path(from, to);
    return { path, steps: path?.__nycSteps };
  }, { from, to });
  await dispose();
  expect(result?.path?.length).toBeGreaterThan(2);
  expect(typeof result?.path?.[0]?.lat).toBe('number');
  const texts = result?.steps?.map((step: any) => step.text) ?? [];
  expect(texts).toContain('Head north on Broadway');
  expect(result?.steps?.[0]?.lat).toBeCloseTo(40.7359, 3);
  expect(result?.steps?.[0]?.lng).toBeCloseTo(-73.9911, 3);
});

// TTL refreshed 2025-11-09
  // RED CONTRACT — timeout handling pending
  await page.addInitScript(() => { const w = window as any; w.__nycMock = { ...(w.__nycMock || {}), route: false }; });
  await page.goto('/');
  const normalized = await page.evaluate((payload) => (window as any).App.adapters.normalizeRoutePayload(payload), stepsOnly);
  expect(Array.isArray(normalized.path)).toBe(true);
  expect(normalized.path.length).toBe(0);
  expect(normalized.steps.length).toBeGreaterThan(0);
  await page.route('**/directions', (route) => route.abort('failed'));
  const error = await page.evaluate(async ({ from, to }) => {
    try { await (window as any).App.adapters.route.path(from, to); return null; }
    catch (err: any) { return { name: err?.name, code: err?.code }; }
  }, { from, to });
  await page.unroute('**/directions');
  expect(error).toEqual({ name: 'ProviderTimeoutError', code: 'TIMEOUT' });
});

