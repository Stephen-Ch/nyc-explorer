import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import * as path from 'path';

const E2E_ROOT = path.join(__dirname, '..', 'e2e');
const TARGET_SELECTORS = [
  '[data-testid="turn-list"]',
  '[data-testid="turn-item"]',
];

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

async function fileUsesHelper(filePath: string): Promise<boolean> {
  const contents = await fs.readFile(filePath, 'utf8');
  return /from\s+'\.\.\/helpers\/selectors'/.test(contents);
}

async function fileContainsTargetSelectors(filePath: string): Promise<boolean> {
  const contents = await fs.readFile(filePath, 'utf8');
  return TARGET_SELECTORS.some((selector) => contents.includes(selector));
}

test('selector helper adoption nudges', async () => {
  const offenders: string[] = [];

  for await (const file of walk(E2E_ROOT)) {
    const hasTargets = await fileContainsTargetSelectors(file);
    if (!hasTargets) continue;
    const hasHelper = await fileUsesHelper(file);
    if (!hasHelper) {
      offenders.push(path.relative(E2E_ROOT, file));
    }
  }

  if (process.env.SELECTOR_HELPER_STRICT === '1') {
    expect(offenders, 'Specs should import selector helper').toHaveLength(0);
  } else if (offenders.length) {
    test.info().annotations.push({ type: 'warning', description: `Selector helper missing in: ${offenders.join(', ')}` });
  }
});
