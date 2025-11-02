import { test, expect } from '@playwright/test';

test.describe('GEO-UI-5a — current location affordance', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any;
      w.App = w.App || {};
      const adapters = (w.App.adapters = w.App.adapters || {});
      const geo = (adapters.geo = adapters.geo || {});
      w.__geoCurrentQueue = [];
      w.__geoCurrentInvocations = 0;
      geo.current = () => {
        w.__geoCurrentInvocations += 1;
        const mock = w.__geoCurrentQueue.shift();
        if (!mock) return Promise.reject(new Error('No mock provided'));
        const run = () => (mock.ok ? Promise.resolve(mock.value) : Promise.reject(mock.error || new Error('Location unavailable.')));
        return mock.delay
          ? new Promise((resolve, reject) => setTimeout(() => run().then(resolve, reject), mock.delay))
          : run();
      };
    });
  });

  test('fills From input with adapter result and hides list', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => (window as any).__geoCurrentQueue.push({ ok: true, delay: 100, value: { lat: 40.735, lng: -73.991, label: 'My location' } }));
    const button = page.locator('[data-testid="geo-current"][data-target="from"]');
    const status = page.locator('[data-testid="geo-status"]');
    const from = page.locator('[data-testid="geo-from"]');
    await button.click();
    await expect(status).toHaveText('Locating…');
    await expect(from).toHaveValue('My location');
    const coords = await from.evaluate((el) => ({ lat: Number(el.getAttribute('data-geo-lat')), lng: Number(el.getAttribute('data-geo-lng')) }));
    expect(coords).toEqual({ lat: 40.735, lng: -73.991 });
    await expect(page.locator('[data-testid="ta-list"]')).toBeHidden();
    await expect(page.locator('[data-testid="ta-option-active"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).__geoCurrentInvocations)).toBe(1);
  });

  test('announces error when adapter rejects', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => (window as any).__geoCurrentQueue.push({ ok: false, error: new Error('Location unavailable.') }));
    const button = page.locator('[data-testid="geo-current"][data-target="from"]');
    const status = page.locator('[data-testid="geo-status"]');
    const from = page.locator('[data-testid="geo-from"]');
    await button.click();
    await expect(status).toHaveText('Location unavailable.');
    await expect(from).toHaveValue('');
    const dataset = await from.evaluate((el) => ({ lat: el.getAttribute('data-geo-lat'), lng: el.getAttribute('data-geo-lng') }));
    expect(dataset.lat).toBeNull();
    expect(dataset.lng).toBeNull();
    expect(await page.evaluate(() => (window as any).__geoCurrentInvocations)).toBe(1);
  });
});
