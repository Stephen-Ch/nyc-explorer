import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Plan 41 slice 1b step 2: the server serves content/walk-graph.v1.json as is.
// Node ids reach 14,349,754,185 (bigger than a C# int), so the file must not be parsed and re-written.
// The missing-file 404 path is a hand check (one shared test server), as for stories.
test('GET /content/walk-graph.v1.json returns the street network file unchanged', async ({ request }) => {
  const response = await request.get('/content/walk-graph.v1.json');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const text = await response.text();
  const onDisk = fs.readFileSync(path.join(__dirname, '..', '..', 'content', 'walk-graph.v1.json'), 'utf8');
  expect(text).toBe(onDisk);
  expect(text).toContain('14349754185');
  const body = JSON.parse(text);
  expect(body.version).toBe(1);
  expect(String(body.attribution)).toContain('OpenStreetMap');
  expect(body.nodes.length).toBe(1568);
  expect(body.edges.length).toBe(1713);
  expect(body.nodes.some((n: number[]) => n[0] > 2147483647)).toBe(true);
});

test('stories endpoint is unchanged by the walk-graph endpoint', async ({ request }) => {
  const response = await request.get('/content/stories.v1.json');
  expect(response.status()).toBe(200);
});
