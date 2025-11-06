import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');
const testsRoot = path.join(repoRoot, 'tests');
const skipRegex = /test\.skip\(\s*['"`]([^'"`]+)['"`]/g;

function gatherSpecs(dir: string, acc: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      gatherSpecs(fullPath, acc);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.spec.ts') && !entry.name.endsWith('.d.ts')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

test('quarantine skip count stays under cap and is labeled', () => {
  const maxSkips = Number(process.env.QUARANTINE_MAX_COUNT ?? '5');
  const specFiles = gatherSpecs(testsRoot);
  const skips: { file: string; title: string }[] = [];
  for (const file of specFiles) {
    const contents = fs.readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;
    while ((match = skipRegex.exec(contents)) !== null) {
      skips.push({ file, title: match[1] });
    }
  }
  expect(skips.length, `Found ${skips.length} skips > cap ${maxSkips}`).toBeLessThanOrEqual(maxSkips);
  for (const entry of skips) {
    const normalized = entry.title.toUpperCase();
    const hasLabel = normalized.includes('RED CONTRACT') || normalized.includes('(RED)');
    const relativePath = path.relative(repoRoot, entry.file);
    expect(hasLabel, `Skipped test "${entry.title}" in ${relativePath} must include 'RED CONTRACT'.`).toBeTruthy();
  }
});
