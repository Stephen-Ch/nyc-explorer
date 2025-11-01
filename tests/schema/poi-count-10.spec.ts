import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('poi.v1.json has at least 10 POIs', async () => {
  const file = path.resolve(__dirname, '..', '..', 'content', 'poi.v1.json');
  expect(fs.existsSync(file)).toBeTruthy();

  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(Array.isArray(json)).toBeTruthy();

  const n = json.length;
  expect(n).toBeGreaterThanOrEqual(10);
});
