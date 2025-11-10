import { test, expect } from '@playwright/test';

// Global type for overlay-core module
declare global {
  interface Window {
    NYCOverlayCore?: {
      buildSvgPath: (points: Array<[number, number]>) => string;
    };
  }
}

// Overlay smoke (frozen overlay; selectors v0.7)
// Fixtures (added in OR-01): route-happy.json, route-missing-polyline.json, route-timeout.json
test.describe('overlay smoke (frozen)', () => {
  test('happy path loads overlay-core', async ({ page }) => {
    await page.goto('/');
    await page.addScriptTag({ url: '/js/_overlay/overlay-core.js' });
    const ok = await page.evaluate(() =>
      !!window.NYCOverlayCore &&
      typeof window.NYCOverlayCore.buildSvgPath === 'function'
    );
    expect(ok).toBe(true);
  });

  test.skip('missing polyline fails gracefully', async ({ page }) => {
    // Unskip in OR-07 when resilience paths are implemented
  });

  test.skip('timeout surfaces retry UX', async ({ page }) => {
    // Unskip in OR-07 when resilience paths are implemented
  });
});
