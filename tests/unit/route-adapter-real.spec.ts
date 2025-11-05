import { expect, test } from '@playwright/test';

test('ROUTE-ADAPTER-REAL-1a — normalize provider payload (RED)', async ({ page }) => {
  await page.goto('/');
  const providerPayload = {
    polyline: [
      { latLng: { latitude: 40.7369, longitude: -73.9903 } },
      { latLng: { latitude: 40.7352, longitude: -73.9919 } },
    ],
    steps: [
      {
        navigationInstruction: { instructions: '<b>Head south</b>' },
        startLocation: { latLng: { latitude: 40.7369, longitude: -73.9903 } },
      },
      {
        navigationInstruction: { instructions: 'Turn right' },
        startLocation: { latLng: { latitude: 40.7352, longitude: -73.9919 } },
      },
    ],
  };

  const normalized = await page.evaluate((input) => {
    const adapters = (window as any).App?.adapters;
    if (typeof adapters?.normalizeRoutePayload !== 'function') {
      throw new Error('normalizeRoutePayload missing');
    }
    const result = adapters.normalizeRoutePayload(input);
    if (!Array.isArray(result?.path) || result.path.length < 2) {
      throw new Error('path must include ≥2 points');
    }
    if (!Array.isArray(result.steps) || result.steps.length < 1) {
      throw new Error('steps must include ≥1 item');
    }
    result.path.forEach((point: any) => {
      if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
        throw new Error('path lat/lng must be numbers');
      }
    });
    result.steps.forEach((step: any) => {
      if (typeof step.text !== 'string' || /<[^>]+>/.test(step.text)) {
        throw new Error('step text must be plain string');
      }
      if (typeof step.lat !== 'number' || typeof step.lng !== 'number') {
        throw new Error('step lat/lng must be numbers');
      }
    });
    return result;
  }, providerPayload);

  expect(Array.isArray(normalized.path)).toBe(true);
  expect(normalized.path.length).toBeGreaterThanOrEqual(2);
  expect(Array.isArray(normalized.steps)).toBe(true);
  expect(normalized.steps.length).toBeGreaterThanOrEqual(1);
  expect(typeof normalized.steps[0].text).toBe('string');
});
