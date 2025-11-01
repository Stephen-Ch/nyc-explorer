// tests/e2e/placeholder-encoding.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test('search/from/to placeholders render with correct UTF-8 ellipsis', async ({ page }) => {
  await page.goto(`${BASE_URL}/`);

  const search = page.locator('[data-testid="search-input"]');
  const from = page.locator('[data-testid="route-from"]');
  const to = page.locator('[data-testid="route-to"]');

  await expect(search).toBeVisible();
  await expect(from).toBeVisible();
  await expect(to).toBeVisible();

  // No mojibake (no � replacement char)
  const searchPh = await search.getAttribute('placeholder');
  const fromPh = await from.getAttribute('placeholder');
  const toPh = await to.getAttribute('placeholder');

  expect(searchPh).not.toMatch(/�|â/);
  expect(fromPh).not.toMatch(/�|â/);
  expect(toPh).not.toMatch(/�|â/);

  // Exact expected copy with true ellipsis U+2026
  expect(searchPh).toBe('Search POIs…');
  expect(fromPh).toBe('From…');
  expect(toPh).toBe('To…');
});
