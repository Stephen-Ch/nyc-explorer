import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import type { POI } from '../schema/poi.schema';
import { buildRoute } from '../../apps/web-mvc/route';

test('buildRoute caps each block at three POIs', async () => {
  const file = path.resolve(__dirname, '..', '..', 'content', 'poi.v1.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8')) as POI[];

  const route = buildRoute(json, { tags: ['politics'], era: null });

  const byBlock = new Map<string, number>();
  for (const poi of route) {
    const current = byBlock.get(poi.block) ?? 0;
    byBlock.set(poi.block, current + 1);
  }

  for (const [block, count] of byBlock) {
    expect(count).toBeLessThanOrEqual(3);
  }
});
