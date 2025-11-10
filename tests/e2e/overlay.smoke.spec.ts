import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Global type for overlay-core module
declare global {
  interface Window {
    NYCOverlayCore?: {
      buildSvgPath: (points: Array<[number, number]>) => string;
      toPointsFromPolyline: (poly: string) => Array<[number, number]>;
      renderSvgPolyline: (containerSelector: string | null, points: Array<[number, number]>) => { d: string; count: number };
      renderPolylineOrError: (containerSelector: string | null, response: any) => { status: 'ok' | 'error'; count?: number; d?: string; reason?: string };
      renderTimeoutBanner: (sel: string | null, err: any) => { status: 'error'; reason: 'timeout'|'ignored' };
    };
  }
}

// Overlay smoke (frozen overlay; selectors v0.7)
// Fixtures (added in OR-01): route-happy.json, route-missing-polyline.json, route-timeout.json
test.describe('overlay smoke (frozen)', () => {
  test('happy path loads overlay-core', async ({ page }) => {
    const fp = path.resolve(__dirname, '../fixtures/overlay/route-happy.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const poly = data.response.polyline;

    await page.goto('/');
    await page.addScriptTag({ url: '/js/_overlay/overlay-core.js' });
    const res = await page.evaluate((poly) => {
      const pts = window.NYCOverlayCore!.toPointsFromPolyline(poly);
      const out = window.NYCOverlayCore!.renderSvgPolyline(null, pts);
      const d = document.querySelector('svg[data-testid="overlay-polyline"] path')?.getAttribute('d') || '';
      return { d, count: out.count };
    }, poly);

    expect(res.count).toBeGreaterThan(0);
    expect(res.d.length).toBeGreaterThan(0);
  });

  test('missing polyline fails gracefully', async ({ page }) => {
    const fp = path.resolve(__dirname, '../fixtures/overlay/route-missing-polyline.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    await page.goto('/');
    await page.addScriptTag({ url: '/js/_overlay/overlay-core.js' });
    const res = await page.evaluate((resp) => window.NYCOverlayCore!.renderPolylineOrError(null, resp), data.response);
    const msg = await page.locator('[data-testid="overlay-error"]').innerText();
    expect(res.status).toBe('error');
    expect(res.reason).toBe('missing-polyline');
    expect(msg).toBe('No polyline');
  });

  test('timeout shows timeout banner', async ({ page }) => {
    const fp = path.resolve(__dirname, '../fixtures/overlay/route-timeout.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    await page.goto('/');
    await page.addScriptTag({ url: '/js/_overlay/overlay-core.js' });
    const res = await page.evaluate((err) => window.NYCOverlayCore!.renderTimeoutBanner(null, err), data.error);
    const msg = await page.locator('[data-testid="overlay-timeout"]').innerText();
    expect(res.status).toBe('error');
    expect(res.reason).toBe('timeout');
    expect(msg).toBe('Route provider timed out');
  });
});
