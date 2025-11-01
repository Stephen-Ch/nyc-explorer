import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test('route controls appear on home page', async ({ page }) => {
  await page.goto(BASE_URL);

  const fromInput = page.locator('[data-testid="route-from"]');
  const toInput = page.locator('[data-testid="route-to"]');
  const findButton = page.locator('[data-testid="route-find"]');

  await expect(fromInput).toBeVisible();
  await expect(toInput).toBeVisible();
  await expect(findButton).toBeVisible();
  await expect(findButton).toHaveText(/find route/i);

  await fromInput.fill('Flatiron Building');
  await toInput.fill('Union Square Park');

  await expect(fromInput).toHaveValue('Flatiron Building');
  await expect(toInput).toHaveValue('Union Square Park');
});
