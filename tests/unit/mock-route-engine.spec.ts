import { test, expect } from '@playwright/test';
test('ROUTE-ADAPTER-1a — MockRouteEngine contract', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.__nycMock = { ...(w.__nycMock || {}), route: true };
  });
  await page.goto('/');

  const payloadA = { from: { lat: 40.75057, lng: -73.99352, label: 'Penn Station' }, to: { lat: 40.76162, lng: -73.97539, label: '666 Fifth Avenue' } };
  const payloadB = { from: { ...payloadA.to }, to: { ...payloadA.from } };

  const summary = await page.evaluate(() => {
  const w = window as any;
  const route = w.App?.adapters?.route;
    if (!route || typeof route.path !== 'function' || typeof route.segment !== 'function') {
      throw new Error('Route adapter missing');
    }

    const payloadA = { from: { lat: 40.75057, lng: -73.99352, label: 'Penn Station' }, to: { lat: 40.76162, lng: -73.97539, label: '666 Fifth Avenue' } };
    const payloadB = { from: { ...payloadA.to }, to: { ...payloadA.from } };

    const fetchType = typeof window.fetch; const originalFetch = window.fetch;
    let fetchCalls = 0;
    window.fetch = (...args: Parameters<typeof window.fetch>) => {
      fetchCalls++;
      return originalFetch.apply(window, args);
    };

    try {
      return {
        pathA: route.path(payloadA),
        pathB: route.path(payloadB),
        segmentA: route.segment(payloadA),
        segmentB: route.segment(payloadB),
        badPath: route.path({ from: {}, to: {} }),
        badSegment: route.segment({ from: {}, to: {} }),
        pathArity: route.path.length,
        segmentArity: route.segment.length,
        fetchType,
        fetchCalls,
      };
    } finally {
      window.fetch = originalFetch;
    }
  });

  const checkPath = (path: any[], expected: Array<{ lat: number; lng: number; label?: string }>) => {
    expect(path).toHaveLength(expected.length);
    expected.forEach((node, index) => {
      expect(path[index].lat).toBeCloseTo(node.lat, 5);
      expect(path[index].lng).toBeCloseTo(node.lng, 5);
      if (node.label) expect(path[index].label).toBe(node.label);
    });
  };
  const checkSegments = (segments: string[], start: string, end: string) => { expect(segments).toHaveLength(3); expect(segments[0]).toContain(start); expect(segments[2]).toContain(end); };

  checkPath(summary.pathA, [payloadA.from, { lat: payloadA.from.lat, lng: payloadA.to.lng }, payloadA.to]);
  checkPath(summary.pathB, [payloadB.from, { lat: payloadB.from.lat, lng: payloadB.to.lng }, payloadB.to]);
  checkSegments(summary.segmentA, payloadA.from.label, payloadA.to.label);
  checkSegments(summary.segmentB, payloadB.from.label, payloadB.to.label);

  expect(summary.badPath).toEqual([]);
  expect(summary.badSegment).toEqual([]);
  expect(summary.pathArity).toBeGreaterThanOrEqual(1);
  expect(summary.segmentArity).toBeGreaterThanOrEqual(1);
  expect(summary.fetchType).toBe('function');
  expect(summary.fetchCalls).toBe(0);
});
