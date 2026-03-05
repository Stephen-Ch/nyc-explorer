import { test, expect } from '@playwright/test';

test('smoke: home page title contains NYC Explorer', async ({ page }) => {
  try {
    await page.goto('/', { timeout: 5000 });
    await expect(page).toHaveTitle(/NYC Explorer/, { timeout: 3000 });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('net::ERR') || err.message.includes('NS_ERROR')) {
      throw new Error('Server not reachable');
    }
    throw error;
  }
});
