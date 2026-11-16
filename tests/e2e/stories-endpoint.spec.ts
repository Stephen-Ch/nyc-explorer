import { test, expect } from '@playwright/test';

// Plan 41 step 4 (slice 1a): the server serves the exported stories file.
// The missing-file 404 path is checked by hand in step 6 (one shared test server; see plan 41 amendment A2).
test('GET /content/stories.v1.json returns the exported 1877 stories', async ({ request }) => {
  const response = await request.get('/content/stories.v1.json');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body = await response.json();
  expect(body.version).toBe(1);
  expect(body.era).toBe(1877);
  expect(String(body.attribution)).toContain('OpenStreetMap');
  expect(Array.isArray(body.groups)).toBe(true);
  expect(body.groups.length).toBeGreaterThan(0);

  for (const group of body.groups) {
    expect(typeof group.id).toBe('string');
    expect(typeof group.name).toBe('string');
    expect(typeof group.lat).toBe('number');
    expect(typeof group.lng).toBe('number');
    expect(typeof group.approx).toBe('boolean');
    expect(group.stories.length).toBeGreaterThan(0);
  }
});

test('POI endpoint is unchanged by the stories endpoint', async ({ request }) => {
  const response = await request.get('/content/poi.v1.json');
  expect(response.status()).toBe(200);
  expect(Array.isArray(await response.json())).toBe(true);
});
