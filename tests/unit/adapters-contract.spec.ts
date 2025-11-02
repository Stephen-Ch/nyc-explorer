import { test, expect } from '@playwright/test';

test('GEO-ADAPTER-1b — adapter contracts match docs', async ({ page }) => {
  await page.goto('/');

  const summary = await page.evaluate(async () => {
    const w = window as any;
    const adapters = w?.App?.adapters ?? {};
    const geo = adapters.geo ?? {};
    const route = adapters.route ?? {};
    let searchIsPromise = false;
    if (typeof geo.search === 'function') {
      try {
        const probe = geo.search('probe');
        searchIsPromise = probe instanceof Promise;
        if (searchIsPromise) await probe.catch(() => null);
      } catch (error) {}
    }
    return {
      app: Boolean(w?.App),
      adapters: Boolean(w?.App?.adapters),
      geoSearch: typeof geo.search,
      geoSearchArity: typeof geo.search === 'function' ? geo.search.length : -1,
      geoCurrent: typeof geo.current,
      geoCurrentArity: typeof geo.current === 'function' ? geo.current.length : -1,
      routeSegment: typeof route.segment,
      routeSegmentArity: typeof route.segment === 'function' ? route.segment.length : -1,
      routePath: typeof route.path,
      routePathArity: typeof route.path === 'function' ? route.path.length : -1,
      searchIsPromise,
    };
  });

  expect(summary.app, 'window.App missing').toBe(true);
  expect(summary.adapters, 'window.App.adapters missing').toBe(true);
  expect(summary.geoSearch).toBe('function');
  expect(summary.geoSearchArity).toBeGreaterThanOrEqual(1);
  expect(summary.geoCurrent).toBe('function');
  expect(summary.geoCurrentArity).toBeGreaterThanOrEqual(0);
  expect(summary.routeSegment).toBe('function');
  expect(summary.routeSegmentArity).toBeGreaterThanOrEqual(1);
  expect(summary.routePath).toBe('function');
  expect(summary.routePathArity).toBeGreaterThanOrEqual(1);
  expect(summary.searchIsPromise).toBe(true);
});
