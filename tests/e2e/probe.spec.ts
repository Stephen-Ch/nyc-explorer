import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test('smoke: home page title contains NYC Explorer', async ({ page }) => {
  try {
    await page.goto(BASE_URL, { timeout: 5000 });
    await expect(page).toHaveTitle(/NYC Explorer/, { timeout: 3000 });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('net::ERR') || err.message.includes('NS_ERROR')) {
      throw new Error(`Server not reachable at ${BASE_URL}`);
    }
    throw error;
  }
});
