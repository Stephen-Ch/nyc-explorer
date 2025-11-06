import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

function parseGitLog(): { message: string; files: string[] } {
  const output = execSync('git log -1 --name-only --pretty=%B', { encoding: 'utf-8' }).trim();
  const lines = output.split(/\r?\n/);
  const messageLines = [] as string[];
  const fileLines = [] as string[];
  let readingFiles = false;
  for (const line of lines) {
    if (!readingFiles && line.trim() === '') {
      readingFiles = true;
      continue;
    }
    if (readingFiles) {
      if (line.trim() !== '') fileLines.push(line.trim());
    } else {
      messageLines.push(line);
    }
  }
  return { message: messageLines.join('\n'), files: fileLines };
}

function isRuntimePath(file: string): boolean {
  return /^(apps\/|wwwroot\/|tests\/e2e\/)/.test(file);
}

test('runtime commits include prompt + decisions metadata', async () => {
  const { message, files } = parseGitLog();
  const touchedRuntime = files.some(isRuntimePath);

  if (!touchedRuntime) {
    test.info().annotations.push({ type: 'info', description: 'Docs-only commit detected; guard skipped.' });
    return;
  }

  expect(message).toMatch(/P\d+/);
  expect(message).toContain('Outcome:');
  expect(message).toContain('Snapshot:');
});
