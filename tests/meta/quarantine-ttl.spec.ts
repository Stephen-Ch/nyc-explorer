import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const REPO_ROOT = path.join(__dirname, '..', '..');
const TESTS_ROOT = path.join(REPO_ROOT, 'tests');

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      yield full;
    }
  }
}

function getLastChangeTimestamp(file: string): number {
  const relative = path.relative(REPO_ROOT, file);
  const output = execSync(`git log -1 --format=%ct -- "${relative}"`, { encoding: 'utf8' }).trim();
  return Number(output || '0');
}

test('quarantine skips expire within 48h', async () => {
  const now = Math.floor(Date.now() / 1000);
  const stale: Array<{ file: string; ageHours: number }> = [];

  for await (const file of walk(TESTS_ROOT)) {
    const contents = await fs.readFile(file, 'utf8');
    if (!contents.includes('test.skip') || !contents.includes('RED CONTRACT')) continue;
    const lastChange = getLastChangeTimestamp(file);
    if (!lastChange) continue;
    const ageHours = (now - lastChange) / 3600;
    if (ageHours > 48) {
      stale.push({ file, ageHours: Math.round(ageHours) });
    }
  }

  expect(stale, 'Quarantined specs older than 48h detected').toHaveLength(0);
});
