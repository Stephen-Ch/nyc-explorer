import { expect, test } from '@playwright/test';
import { useGeoFixture, useRouteFixture } from '../helpers/provider-fixtures';

test('geo and route fixtures fulfill provider requests', async ({ page }) => {
  await page.goto('about:blank');

  const removeGeo = await useGeoFixture(page, {
    payload: [{ label: 'Test Place', lat: 40.74, lng: -73.99 }],
  });

  const geoResult = await page.evaluate(async () => {
    const response = await fetch('https://fake-provider.example/geocode?q=union');
    return response.json();
  });

  expect(Array.isArray(geoResult)).toBe(true);
  expect(geoResult).toHaveLength(1);
  expect(geoResult[0].label).toBe('Test Place');

  await removeGeo();

  const removeRoute = await useRouteFixture(page, {
    payload: {
      path: [
        { lat: 40.73, lng: -73.99 },
        { lat: 40.74, lng: -73.98 },
      ],
      steps: [{ text: 'Head north', lat: 40.73, lng: -73.99 }],
    },
  });

  const routeResult = await page.evaluate(async () => {
    const response = await fetch('https://fake-provider.example/directions?from=40.73,-73.99&to=40.74,-73.98');
    return response.json();
  });

  expect(routeResult.path).toHaveLength(2);
  expect(routeResult.path[0].lat).toBeCloseTo(40.73);
  expect(routeResult.steps[0].text).toBe('Head north');

  await removeRoute();
  await page.unroute('**/*');
});
