import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('poi.v1.json contains POIs from more than one area', () => {
  const file = path.resolve(__dirname, '..', '..', 'content', 'poi.v1.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const areas = new Set(json.map((p: { area: string }) => p.area));
  expect(areas.size).toBeGreaterThanOrEqual(2);
});

test('second-area POI has required fields', () => {
  const file = path.resolve(__dirname, '..', '..', 'content', 'poi.v1.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const nonOriginal = json.filter(
    (p: { area: string }) => p.area !== 'Union Square' && p.area !== 'Flatiron District'
  );
  expect(nonOriginal.length).toBeGreaterThanOrEqual(1);
  const poi = nonOriginal[0];
  expect(poi).toHaveProperty('id');
  expect(poi).toHaveProperty('name');
  expect(poi).toHaveProperty('coords');
  expect(poi).toHaveProperty('borough', 'Manhattan');
  expect(poi).toHaveProperty('area');
  expect(poi).toHaveProperty('neighborhood');
  expect(poi).toHaveProperty('tags');
  expect(poi).toHaveProperty('sources');
});
