import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test('inputs have accessible labels: Search, From, To', async ({ page }) => {
  await page.goto(`${BASE_URL}/`);

  // These will pass only when <label for="..."> exists and is bound to the inputs.
  await expect(page.getByLabel('Search')).toBeVisible();
  await expect(page.getByLabel('From')).toBeVisible();
  await expect(page.getByLabel('To')).toBeVisible();

  // Bonus: they should be focusable via label association
  await page.getByLabel('Search').focus();
  await page.getByLabel('From').focus();
  await page.getByLabel('To').focus();
});
