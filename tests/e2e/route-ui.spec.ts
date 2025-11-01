import { test, expect } from '@playwright/test';
import { buildRoute } from '../../apps/web-mvc/route';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test('route steps render from buildRoute output', async ({ request, page }) => {
  const response = await request.get(`${BASE_URL}/content/poi.v1.json`);
  expect(response.ok()).toBeTruthy();

  const pois = await response.json();
  const expected = buildRoute(pois, {});

  await page.goto(`${BASE_URL}/`);

  const container = page.locator('#route-steps');
  await expect(container).toBeVisible();

  const steps = container.locator('[data-testid="route-step"]');
  await expect(steps).toHaveCount(expected.length);

  if (expected.length > 0) {
    await expect(steps.first()).toContainText(expected[0].name);
    await expect(steps.last()).toContainText(expected[expected.length - 1].name);
  }
});
