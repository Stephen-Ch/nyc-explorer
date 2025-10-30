import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

test('poi.v1.json has at least 5 POIs', () => {
  const p = resolve(process.cwd(), 'content', 'poi.v1.json');
  const raw = readFileSync(p, 'utf-8');
  const data = JSON.parse(raw);
  expect(Array.isArray(data)).toBeTruthy();
  expect(data.length).toBeGreaterThanOrEqual(5);
});
