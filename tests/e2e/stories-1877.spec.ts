import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Plan 41 step 4 (slice 1a): era picker, 1877 story pins and story card.
// Stories come from a fixture so the test does not depend on the real export.

const FIXTURE = fs.readFileSync(
  path.join(__dirname, '..', 'fixtures', 'stories', 'stories-1877.fixture.json'),
  'utf8',
);

const stubStories = async (page: Page, status = 200) => {
  await page.route('**/content/stories.v1.json', async (route) => {
    if (status === 200) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: FIXTURE });
    } else {
      await route.fulfill({ status, body: 'missing' });
    }
  });
};

const pickEra = async (page: Page, era: 'today' | '1877') => {
  await page.locator(`[data-testid="era-option"][data-era="${era}"]`).click();
};

const pin = (page: Page, id: string) => page.locator(`[data-testid="story-pin"][data-point-id="${id}"]`);
const card = (page: Page) => page.getByTestId('story-card');

test.describe('PLAN-41 slice 1a — 1877 stories', () => {
  test('era picker defaults to Today and present-day pins show (D2)', async ({ page }) => {
    await stubStories(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const picker = page.getByTestId('era-picker');
    await expect(picker).toBeVisible();
    await expect(picker).toHaveAttribute('role', 'group');
    await expect(page.locator('[data-testid="era-option"][data-era="today"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-testid="era-option"][data-era="1877"]')).toHaveAttribute('aria-pressed', 'false');

    expect(await page.locator('[data-testid="poi-marker"]').count()).toBeGreaterThan(0);
    await expect(page.locator('[data-testid="story-pin"]')).toHaveCount(0);
  });

  test('1877 shows one pin per point and hides present-day pins (D1, D7)', async ({ page }) => {
    await stubStories(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await pickEra(page, '1877');
    await expect(page.locator('[data-testid="era-option"][data-era="1877"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-testid="story-pin"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="poi-marker"]')).toHaveCount(0);
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(3);
    await expect(pin(page, 'fixture-union-square')).toHaveAttribute('aria-label', /Union Square/);

    await pin(page, 'fixture-union-square').click();
    await expect(card(page)).toBeVisible();

    await pickEra(page, 'today');
    await expect(page.locator('[data-testid="story-pin"]')).toHaveCount(0);
    expect(await page.locator('[data-testid="poi-marker"]').count()).toBeGreaterThan(0);
    await expect(card(page)).toBeHidden();
  });

  test('pin opens a card with every story at that point; Esc closes it (D3, D7)', async ({ page }) => {
    await stubStories(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');

    await pin(page, 'fixture-union-square').click();
    const c = card(page);
    await expect(c).toBeVisible();
    await expect(c).toHaveAttribute('role', 'dialog');
    await expect(c.getByTestId('story-card-title')).toHaveText('Union Square');

    const items = c.getByTestId('story-item');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0).getByTestId('story-hook')).toHaveText('A crowd filled the square for the fixture parade.');
    await expect(items.nth(0).getByTestId('story-text')).toHaveText('Fixture text one. It is plain text.');
    await expect(items.nth(0).getByTestId('story-source')).toHaveText('The Sun (New York), 1877-05-01, page 2');
    // D3: no text = hook only, with a note
    await expect(items.nth(1).getByTestId('story-text')).toHaveText('Full story coming.');
    await expect(items.nth(1).getByTestId('story-link')).toHaveCount(0);

    await expect(c.getByTestId('story-attribution')).toContainText('OpenStreetMap');

    await page.keyboard.press('Escape');
    await expect(c).toBeHidden();
    await expect(pin(page, 'fixture-union-square')).toBeFocused();
  });

  test('approx. label shows only on approximate points (D4)', async ({ page }) => {
    await stubStories(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');

    await pin(page, 'fixture-academy-of-music').click();
    await expect(card(page).getByTestId('story-approx')).toHaveText('approx.');
    await page.keyboard.press('Escape');

    await pin(page, 'fixture-union-square').click();
    await expect(card(page).getByTestId('story-approx')).toHaveCount(0);
  });

  test('keyboard: Tab reaches pins, Enter opens the card, focus moves into it, live region announces', async ({ page }) => {
    await stubStories(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');

    await expect(page.locator('[data-testid="story-pin"]')).toHaveCount(3);
    const era1877 = page.locator('[data-testid="era-option"][data-era="1877"]');
    await era1877.focus();
    let reached = false;
    for (let i = 0; i < 60 && !reached; i += 1) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'story-pin');
    }
    expect(reached).toBe(true);

    await pin(page, 'fixture-union-square').focus();
    await page.keyboard.press('Enter');
    await expect(card(page)).toBeVisible();
    await expect(page.getByTestId('story-card-close')).toBeFocused();
    await expect(page.getByTestId('story-status')).toHaveAttribute('aria-live', 'polite');
    await expect(page.getByTestId('story-status')).toHaveText('Showing 2 stories at Union Square');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focusedInCard = await page.evaluate(() => !!document.activeElement?.closest('[data-testid="story-card"]'));
    expect(focusedInCard).toBe(true);
  });

  test('safety: story content is plain text, never HTML; unsafe links are not rendered', async ({ page }) => {
    await stubStories(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');

    await pin(page, 'fixture-academy-of-music').click();
    const c = card(page);
    await expect(c.getByTestId('story-hook')).toHaveText('Bold <b>claim</b> <img src=x onerror="window.__storyXss=1">');
    await expect(c.getByTestId('story-text')).toContainText('<script>');
    await expect(c.locator('b, img, script')).toHaveCount(0);
    await page.keyboard.press('Escape');

    await pin(page, 'fixture-tiffany').click();
    await expect(card(page).getByTestId('story-link')).toHaveCount(0);
    await page.keyboard.press('Escape');

    await pin(page, 'fixture-union-square').click();
    const link = card(page).getByTestId('story-link');
    await expect(link).toHaveAttribute('href', 'https://www.loc.gov/resource/fixture-1/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);

    // Story pins never use Leaflet popups or HTML tooltips.
    await expect(page.locator('.leaflet-popup')).toHaveCount(0);
    await expect(page.locator('.leaflet-tooltip *')).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).__storyXss)).toBeUndefined();
  });

  test('missing stories file shows its own message; present-day map still works', async ({ page }) => {
    await stubStories(page, 404);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(await page.locator('[data-testid="poi-marker"]').count()).toBeGreaterThan(0);
    expect(await page.locator('[data-testid="poi-item"]').count()).toBeGreaterThan(0);
    await expect(page.getByTestId('poi-error')).toHaveText('');

    await pickEra(page, '1877');
    await expect(page.getByTestId('stories-error')).toHaveText('Unable to load 1877 stories.');
    await expect(page.locator('[data-testid="story-pin"]')).toHaveCount(0);

    await pickEra(page, 'today');
    expect(await page.locator('[data-testid="poi-marker"]').count()).toBeGreaterThan(0);
  });

  test('a failed POI file does not stop 1877 stories or wipe the page', async ({ page }) => {
    await stubStories(page);
    await page.route('**/content/poi.v1.json', (route) => route.fulfill({ status: 500, body: 'server error' }));
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('poi-error')).toContainText('Unable to load POIs.');
    await pickEra(page, '1877');
    await expect(page.locator('[data-testid="story-pin"]')).toHaveCount(3);
  });

  test('unreadable POI JSON shows the POI error instead of replacing the page', async ({ page }) => {
    await stubStories(page);
    await page.route('**/content/poi.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{not json' }),
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('era-picker')).toBeVisible();
    await expect(page.getByTestId('poi-error')).toBeVisible();
    await expect(page.getByTestId('poi-error')).toContainText('Unable to load POIs.');
    await expect(page.locator('body')).not.toHaveText('Failed to load POIs');
  });
});
