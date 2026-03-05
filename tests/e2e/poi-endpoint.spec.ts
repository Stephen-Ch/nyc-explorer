import { test, expect } from '@playwright/test';

test('GET /content/poi.v1.json returns valid POI array', async ({ request }) => {
  let response;
  
  try {
    response = await request.get('/content/poi.v1.json');
  } catch (error) {
    throw new Error(`Endpoint /content/poi.v1.json not available`);
  }

  if (response.status() !== 200) {
    throw new Error(`Endpoint /content/poi.v1.json not available (status: ${response.status()})`);
  }

  const contentType = response.headers()['content-type'];
  expect(contentType).toContain('application/json');

  const body = await response.json();

  if (!Array.isArray(body)) {
    throw new Error('Invalid POI payload at /content/poi.v1.json: not an array');
  }

  if (body.length < 3) {
    throw new Error(`Invalid POI payload at /content/poi.v1.json: length ${body.length} < 3`);
  }

  for (const poi of body) {
    expect(poi).toHaveProperty('id');
    expect(poi).toHaveProperty('name');
    expect(poi).toHaveProperty('coords');
    expect(poi).toHaveProperty('borough');
    expect(poi).toHaveProperty('area');
  }
});
