import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');
const codeReviewPath = path.join(repoRoot, 'docs', 'code-review.md');
const projectHistoryPath = path.join(repoRoot, 'docs', 'project-history.md');
const storyRegex = /\bP\d+\b/g;

function extractStories(content: string): Set<string> {
  const matches = content.match(storyRegex);
  return new Set(matches ?? []);
}

function extractSprint06Stories(content: string): Set<string> {
  const sprintStart = content.indexOf('## History (newest first)');
  if (sprintStart === -1) {
    return new Set();
  }
  const historySection = content.slice(sprintStart);
  const sprintEnd = historySection.indexOf('### [2025-11-05]');
  const sprintBlock = sprintEnd === -1 ? historySection : historySection.slice(0, sprintEnd);
  const matches = sprintBlock.match(storyRegex);
  return new Set(matches ?? []);
}

test('code-review decisions appear in Sprint-06 project history', () => {
  const codeReviewContent = fs.readFileSync(codeReviewPath, 'utf8');
  const historyContent = fs.readFileSync(projectHistoryPath, 'utf8');

  const codeReviewStories = extractStories(codeReviewContent);
  const sprint06Stories = extractSprint06Stories(historyContent);

  const missing = [...codeReviewStories].filter((story) => story.startsWith('P') && !sprint06Stories.has(story));
  expect(missing, `Stories missing from Sprint-06 history: ${missing.join(', ')}`).toHaveLength(0);
});
