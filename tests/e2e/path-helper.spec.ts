import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test.describe('PATH-HELPER-1 — POI detail path contract', () => {
  test('returns 200 for known POI id', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/poi/flatiron-001`);
    expect(response.status()).toBe(200);
  });

  test('returns 404 for unknown POI id', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/poi/__missing-id__`);
    expect(response.status()).toBe(404);
  });
});
