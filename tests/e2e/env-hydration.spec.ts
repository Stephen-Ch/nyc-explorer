import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function captureEnv(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.getByTestId('poi-list').waitFor({ state: 'visible' });
  return page.evaluate(() => {
    const env = (window as { ENV?: unknown }).ENV;
    const placeholder = document.documentElement.innerHTML.includes('__APP_CONFIG__');
    const scriptCount = Array.from(document.getElementsByTagName('script')).filter(
      node => node.textContent?.includes('window.ENV'),
    ).length;
    return { env, placeholder, scriptCount };
  });
}

test('hydrated window.ENV matches between home and shadow view', async ({ page }) => {
  const home = await captureEnv(page, '/');
  expect(home.placeholder).toBe(false);
  expect(home.scriptCount).toBeGreaterThan(0);

  const shadow = await captureEnv(page, '/__view-home');
  expect(shadow.placeholder).toBe(false);
  expect(shadow.scriptCount).toBe(home.scriptCount);
  expect(shadow.env).toEqual(home.env);
});
