import { test, expect } from '@playwright/test';

const SELECTOR = { from: '[data-testid="geo-from"]', to: '[data-testid="geo-to"]', option: '[data-testid="ta-option"],[data-testid="ta-option-active"]', find: '[data-testid="route-find"]', steps: '#route-steps [data-testid="route-step"]', active: '[data-testid="poi-marker-active"]', path: '[data-testid="route-path"]', node: '[data-testid="route-node"]', message: '[data-testid="route-msg"]' };

const enterLocation = async (page: any, selector: string, query: string, label: string) => {
  const input = page.locator(selector); await input.fill(''); await input.fill(query);
  const option = page.locator(SELECTOR.option).filter({ hasText: label }).first();
  await option.waitFor(); await option.click();
  await expect(input).toHaveValue(label);
};

const assertCleared = async (page: any) => {
  await expect(page.locator(SELECTOR.steps)).toHaveCount(0); await expect(page.locator(SELECTOR.active)).toHaveCount(0);
  await expect(page.locator(SELECTOR.path)).toHaveCount(0); await expect(page.locator(SELECTOR.node)).toHaveCount(0);
  await expect(page.locator(SELECTOR.message)).toHaveText('Unable to build route.');
};

type AdapterConfig = { mode: 'reject' | 'null' | 'empty' | 'data'; data?: any };
const installMock = (page: any, config: { segment?: AdapterConfig; path?: AdapterConfig }) => page.evaluate((options: { segment?: AdapterConfig; path?: AdapterConfig }) => {
  const factory = (entry?: AdapterConfig) => {
    if (!entry) return async () => [];
    if (entry.mode === 'reject') return async () => { throw new Error('mock'); };
    if (entry.mode === 'null') return async () => null;
    if (entry.mode === 'empty') return async () => [];
    return async () => entry.data;
  };
  const w = window as any; w.App = w.App || {}; w.App.adapters = w.App.adapters || {};
  const route = w.App.adapters.route || {};
  w.App.adapters.route = { ...route, segment: factory(options.segment), path: factory(options.path) };
}, config);

test.describe('ROUTE-ADAPTER-ERR-UX-1a — adapter failure UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any;
      w.__nycMock = { ...(w.__nycMock || {}), route: true };
    });
    await page.goto('/');
  await enterLocation(page, SELECTOR.from, 'Penn Station', 'Penn Station');
  await enterLocation(page, SELECTOR.to, '666 Fifth Avenue', '666 Fifth Avenue');
  });

  test('clears UI when adapter rejects', async ({ page }) => {
    await installMock(page, { segment: { mode: 'reject' }, path: { mode: 'reject' } });
    await page.click(SELECTOR.find); await assertCleared(page);
  });

  test('clears UI when adapter returns invalid payload', async ({ page }) => {
    await installMock(page, { segment: { mode: 'null' }, path: { mode: 'data', data: {} } });
    await page.click(SELECTOR.find); await assertCleared(page);
  });

  test('recovers after failure once adapter returns valid data', async ({ page }) => {
    await installMock(page, { segment: { mode: 'null' }, path: { mode: 'empty' } });
    await page.click(SELECTOR.find); await assertCleared(page);

    await installMock(page, {
      segment: { mode: 'data', data: [{ id: 'step-1', name: 'Adapter Step One' }, { id: 'step-2', name: 'Adapter Step Two' }] },
      path: { mode: 'data', data: [{ lat: 40.75057, lng: -73.99352 }, { lat: 40.75057, lng: -73.97539 }, { lat: 40.76162, lng: -73.97539 }] },
    });
    await page.click(SELECTOR.find);
    await expect(page.locator(SELECTOR.steps)).toHaveCount(2);
    await expect(page.locator(SELECTOR.path)).toHaveCount(1);
    await expect(page.locator(SELECTOR.message)).not.toHaveText('Unable to build route.');
  });
});
