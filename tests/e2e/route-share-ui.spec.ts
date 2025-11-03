import { test, expect } from '@playwright/test';
import { routeSegment } from '../../apps/web-mvc/route';

const pickSegment = (pois: any[]) => {
  const withRoute = pois.filter((poi: any) => poi.route_id);
  const first = withRoute[0];
  if (!first) {
    return [];
  }
  const target = withRoute.find((poi: any) => poi.route_id === first.route_id && poi.id !== first.id) ?? first;
  return routeSegment(first.id, target.id, pois);
};

test.describe('ROUTE-SHARE-UI-1a — copy link share control', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const writes: string[] = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText(value: string) {
            writes.push(String(value));
            (window as any).__clipboardWrites = writes;
            return Promise.resolve();
          },
        },
      });
      (window as any).__clipboardWrites = writes;
    });
  });

  test('copies current POI route URL', async ({ page }) => {
    const res = await page.request.get('/content/poi.v1.json');
    const pois = await res.json();
    const segment = pickSegment(pois);
    await page.goto(`/?from=${segment[0].id}&to=${segment[segment.length - 1].id}`);
    const share = page.getByTestId('share-link');
    await share.click();
    const writes = await page.evaluate(() => (window as any).__clipboardWrites ?? []);
    expect(writes.at(-1)).toContain('?from=');
    await expect(page.getByTestId('route-msg')).toHaveText('Link copied.');
  });

  test('copies adapter route after history navigation', async ({ page }) => {
    await page.goto('/?gfrom=40.7616,-73.9747&gto=40.7506,-73.9935&gfl=From&gtl=To');
    await page.goBack();
    await page.goForward();
    const share = page.getByTestId('share-link');
    await share.click();
    const writes = await page.evaluate(() => (window as any).__clipboardWrites ?? []);
    expect(writes.at(-1)).toContain('gfrom=');
    await expect(page.getByTestId('route-msg')).toHaveText('Link copied.');
  });

  test('is disabled when no route is active', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByTestId('share-link')).toBeDisabled();
  });
});
