import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import * as path from 'path';

const DECISIONS_PATH = path.join(__dirname, '..', '..', 'docs', 'code-review.md');

const SNAPSHOT_ANCHOR = '<!-- DECISIONS_TEMPLATE_SNAPSHOT -->';

const ENTRY_REGEX = /^\[(?<timestamp>[^\]]+)]\s+(?<repo>[^\s]+)\s+(?<story>P\d+)\s+—\s+(?<summary>.+)$/;

const OUTCOME_REGEX = /Outcome:\s*(GREEN|RED|DOCS)/i;
const SNAPSHOT_REGEX = /^Snapshot:\s+.+$/i;

async function readDecisionsFile() {
  const contents = await fs.readFile(DECISIONS_PATH, 'utf8');
  return contents.split(/\r?\n/);
}

test.describe('decisions template enforcement', () => {
  test('every P-entry includes Outcome and Snapshot lines', async () => {
    const lines = await readDecisionsFile();
    expect(lines).toContain(SNAPSHOT_ANCHOR);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const match = line.match(ENTRY_REGEX);
      if (!match) continue;

      const following = [] as string[];
      let cursor = i + 1;
      while (cursor < lines.length && lines[cursor].trim().length > 0) {
        following.push(lines[cursor]);
        cursor += 1;
      }

      const hasOutcome = following.some((l) => OUTCOME_REGEX.test(l));
      const hasSnapshot = following.some((l) => SNAPSHOT_REGEX.test(l));

      expect.soft(hasOutcome, `Missing Outcome line for ${match.groups?.story}`).toBeTruthy();
      expect.soft(hasSnapshot, `Missing Snapshot line for ${match.groups?.story}`).toBeTruthy();
    }
  });
});
