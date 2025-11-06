import { expect, test } from '@playwright/test';

test('view plumbing shadow route renders template content', async ({ page }) => {
  await page.goto('/__view-ok');
  await expect(page.getByTestId('view-ok')).toHaveText('view-ok');
});
