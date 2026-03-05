import { test, expect } from '@playwright/test';

test.describe('PATH-HELPER-1 — POI detail path contract', () => {
  test('returns 200 for known POI id', async ({ request }) => {
    const response = await request.get('/poi/flatiron-001');
    expect(response.status()).toBe(200);
  });

  test('returns 404 for unknown POI id', async ({ request }) => {
    const response = await request.get('/poi/__missing-id__');
    expect(response.status()).toBe(404);
  });
});
