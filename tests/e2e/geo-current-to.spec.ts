import { test, expect } from '@playwright/test';

test.describe('GEO-UI-5c-a — To current location contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any;
      w.App = w.App || {};
      const adapters = (w.App.adapters = w.App.adapters || {});
      const geo = (adapters.geo = adapters.geo || {});
      w.__geoCurrentQueue = [];
      w.__geoCurrentCalls = 0;
      geo.current = () => {
        w.__geoCurrentCalls += 1;
        const mock = w.__geoCurrentQueue.shift();
        if (!mock) return Promise.reject(new Error('No mock provided'));
        const run = () => (mock.ok ? Promise.resolve(mock.value) : Promise.reject(mock.error || new Error('Location unavailable.')));
        return mock.delay
          ? new Promise((resolve, reject) => setTimeout(() => run().then(resolve, reject), mock.delay))
          : run();
      };
    });
  });

  test('fills To input when adapter resolves', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => (window as any).__geoCurrentQueue.push({ ok: true, delay: 100, value: { lat: 40.74, lng: -73.99, label: 'My location' } }));
    const button = page.locator('[data-testid="geo-current"][data-target="to"]');
    const status = page.locator('[data-testid="geo-status"]');
    const toInput = page.locator('[data-testid="geo-to"]');
    await button.click();
    await expect(button).toBeDisabled();
    await expect(status).toHaveText('Locating…');
    await expect(toInput).toHaveValue('My location');
    const dataset = await toInput.evaluate((el) => ({
      lat: Number(el.getAttribute('data-geo-lat')),
      lng: Number(el.getAttribute('data-geo-lng')),
      label: el.getAttribute('data-geo-label'),
    }));
    expect(dataset).toEqual({ lat: 40.74, lng: -73.99, label: 'My location' });
    await expect(page.locator('[data-testid="ta-list"]')).toBeHidden();
    await expect(page.locator('[data-testid="ta-option-active"]')).toHaveCount(0);
    await expect(status).toHaveText('Using current location.');
    await expect(button).toBeEnabled();
    expect(await page.evaluate(() => (window as any).__geoCurrentCalls)).toBe(1);
  });

  test('announces error when adapter rejects', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => (window as any).__geoCurrentQueue.push({ ok: false, error: new Error('Location unavailable.') }));
    const button = page.locator('[data-testid="geo-current"][data-target="to"]');
    const status = page.locator('[data-testid="geo-status"]');
    const toInput = page.locator('[data-testid="geo-to"]');
    await button.click();
    await expect(status).toHaveText('Location unavailable.');
    await expect(toInput).toHaveValue('');
    const dataset = await toInput.evaluate((el) => ({
      lat: el.getAttribute('data-geo-lat'),
      lng: el.getAttribute('data-geo-lng'),
      label: el.getAttribute('data-geo-label'),
    }));
    expect(dataset.lat).toBeNull();
    expect(dataset.lng).toBeNull();
    expect(dataset.label).toBeNull();
    await expect(button).toBeEnabled();
    expect(await page.evaluate(() => (window as any).__geoCurrentCalls)).toBe(1);
  });
});
