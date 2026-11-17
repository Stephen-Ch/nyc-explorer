import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Plan 41 slice 1b step 2: "Walk in 1877" panel (walk between two 1877 places, list the story places along it).
// Fixture grid: 3 avenues x 4 streets, 12 places. Expected lists were worked out by hand from the layout
// (see tests/fixtures/walk/README.md).

const FIX = path.join(__dirname, '..', 'fixtures', 'walk');
const STORIES = fs.readFileSync(path.join(FIX, 'stories-walk.fixture.json'), 'utf8');
const GRAPH = fs.readFileSync(path.join(FIX, 'walk-graph.fixture.json'), 'utf8');

const stub = async (page: Page, graphStatus = 200) => {
  await page.route('**/content/stories.v1.json', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: STORIES }),
  );
  await page.route('**/content/walk-graph.v1.json', (route) =>
    graphStatus === 200
      ? route.fulfill({ status: 200, contentType: 'application/json', body: GRAPH })
      : route.fulfill({ status: graphStatus, body: 'missing' }),
  );
};

const open1877 = async (page: Page, graphStatus = 200) => {
  await stub(page, graphStatus);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="era-option"][data-era="1877"]').click();
  await expect(page.locator('[data-testid="story-pin"]')).toHaveCount(12);
};

const pickEra = (page: Page, era: 'today' | '1877') =>
  page.locator(`[data-testid="era-option"][data-era="${era}"]`).click();

const walk = async (page: Page, fromId: string, toId: string) => {
  await page.getByTestId('walk-from').selectOption(fromId);
  await page.getByTestId('walk-to').selectOption(toId);
  await page.getByTestId('walk-go').click();
};

const listNames = (page: Page) => page.getByTestId('walk-item');

test.describe('PLAN-41 slice 1b — walk in 1877', () => {
  test('panel shows only in 1877; Today\'s From/To boxes hide in 1877 and come back (D11)', async ({ page }) => {
    await stub(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('walk-panel')).toHaveCount(0);
    for (const id of ['route-inputs', 'geo-typeahead', 'geo-to-typeahead']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }

    await pickEra(page, '1877');
    const panel = page.getByTestId('walk-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('heading', { name: 'Walk in 1877' })).toBeVisible();
    for (const id of ['route-inputs', 'geo-typeahead', 'geo-to-typeahead']) {
      await expect(page.locator(`#${id}`)).toBeHidden();
    }

    // Panel sits above the map.
    const panelBox = await panel.boundingBox();
    const mapBox = await page.locator('#map-wrap').boundingBox();
    expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(mapBox!.y + 1);

    await pickEra(page, 'today');
    await expect(page.getByTestId('walk-panel')).toHaveCount(0);
    for (const id of ['route-inputs', 'geo-typeahead', 'geo-to-typeahead']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    // Exact inline display comes back (route-inputs is a flex row).
    expect(await page.locator('#route-inputs').evaluate((e) => (e as HTMLElement).style.display)).toBe('flex');
  });

  test('From and To list the 1877 places sorted by name (D8), with labels', async ({ page }) => {
    await open1877(page);
    const expected = [
      'Astor Hall', 'Bowery Bank', 'Cooper Club', 'Delmonico Room', 'Echo Hall', 'Fable House',
      'Grange Inn', 'Hudson Hotel', 'Irving Place Inn', 'Jumel House', 'Knickerbocker', 'Lafayette Hall',
    ];
    for (const id of ['walk-from', 'walk-to']) {
      const select = page.getByTestId(id);
      const options = select.locator('option');
      await expect(options).toHaveCount(13);
      await expect(options.first()).toHaveAttribute('value', '');
      await expect(options.first()).toHaveText('Choose a place');
      expect((await options.allTextContents()).slice(1)).toEqual(expected);
    }
    // Today's own From/To labels stay in the page (hidden), so look inside the panel.
    const panel = page.getByTestId('walk-panel');
    await expect(panel.getByLabel('From', { exact: true })).toHaveAttribute('data-testid', 'walk-from');
    await expect(panel.getByLabel('To', { exact: true })).toHaveAttribute('data-testid', 'walk-to');
  });

  test('walk 1 (up one avenue): list in walk order, tie broken by distance then name', async ({ page }) => {
    await open1877(page);
    await walk(page, 'fx-astor', 'fx-bowery');
    await expect(page.locator('[data-testid="walk-line"]')).toHaveCount(1);
    await expect(listNames(page)).toHaveText([
      'Astor Hall, 1 story',
      'Cooper Club, 2 stories',
      'Grange Inn, 1 story',
      'Echo Hall, 1 story',
      'Fable House, 1 story',
      'Bowery Bank, 1 story',
    ]);
    await expect(page.getByTestId('walk-message')).toHaveText('6 places on this walk');
  });

  test('walk 2 (avenue then street, through a corner place) and walk 3 replace the old list and line', async ({ page }) => {
    await open1877(page);
    await walk(page, 'fx-astor', 'fx-hudson');
    await expect(listNames(page)).toHaveText([
      'Astor Hall, 1 story',
      'Cooper Club, 2 stories',
      'Jumel House, 1 story',
      'Irving Place Inn, 1 story',
      'Hudson Hotel, 1 story',
    ]);

    await walk(page, 'fx-hudson', 'fx-knick');
    await expect(page.locator('[data-testid="walk-line"]')).toHaveCount(1);
    await expect(listNames(page)).toHaveText([
      'Hudson Hotel, 1 story',
      'Lafayette Hall, 1 story',
      'Knickerbocker, 1 story',
    ]);
  });

  test('list button opens that place\'s story card; Esc returns focus to the button', async ({ page }) => {
    await open1877(page);
    await walk(page, 'fx-astor', 'fx-bowery');
    const item = page.locator('[data-testid="walk-item"][data-point-id="fx-cooper"]');
    await item.click();
    const card = page.getByTestId('story-card');
    await expect(card).toBeVisible();
    await expect(card.getByTestId('story-card-title')).toHaveText('Cooper Club');
    await expect(card.getByTestId('story-item')).toHaveCount(2);
    await expect(card.getByTestId('story-card-close')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await expect(item).toBeFocused();

    // Same card already open: clicking its list button again keeps one card and focuses Close.
    await item.click();
    await item.evaluate((el) => (el as HTMLElement).click());
    await expect(page.getByTestId('story-card')).toHaveCount(1);
    await expect(page.getByTestId('story-card-close')).toBeFocused();
  });

  test('switching to Today clears the line, the list and an open card', async ({ page }) => {
    await open1877(page);
    await walk(page, 'fx-astor', 'fx-bowery');
    await page.locator('[data-testid="walk-item"][data-point-id="fx-cooper"]').click();
    await expect(page.getByTestId('story-card')).toBeVisible();

    await pickEra(page, 'today');
    await expect(page.getByTestId('story-card')).toHaveCount(0);
    await expect(page.locator('[data-testid="walk-line"]')).toHaveCount(0);
    await expect(page.getByTestId('walk-item')).toHaveCount(0);

    // Back to 1877: empty panel, no old walk.
    await pickEra(page, '1877');
    await expect(page.getByTestId('walk-panel')).toBeVisible();
    await expect(page.locator('[data-testid="walk-line"]')).toHaveCount(0);
    await expect(page.getByTestId('walk-item')).toHaveCount(0);
  });

  test('keyboard: Tab goes From, To, Go, Show all, then the list buttons', async ({ page }) => {
    await open1877(page);
    await walk(page, 'fx-hudson', 'fx-knick');
    await page.getByTestId('walk-from').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('walk-to')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('walk-go')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('walk-show-all')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="walk-item"][data-point-id="fx-hudson"]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="walk-item"][data-point-id="fx-lafayette"]')).toBeFocused();
  });

  test('messages: same place twice, and nothing chosen', async ({ page }) => {
    await open1877(page);
    await page.getByTestId('walk-go').click();
    await expect(page.getByTestId('walk-message')).toHaveText('Pick a From and a To place.');

    await walk(page, 'fx-astor', 'fx-astor');
    await expect(page.getByTestId('walk-message')).toHaveText('Pick two different places.');
    await expect(page.locator('[data-testid="walk-line"]')).toHaveCount(0);
    await expect(page.getByTestId('walk-item')).toHaveCount(0);
    await expect(page.getByTestId('walk-message')).toHaveAttribute('aria-live', 'polite');
  });

  test('missing walk file shows its own message; 1877 pins still open cards', async ({ page }) => {
    await open1877(page, 404);
    await expect(page.getByTestId('walk-message')).toHaveText('Walks are not available right now.');

    await page.locator('[data-testid="story-pin"][data-point-id="fx-cooper"]').click();
    await expect(page.getByTestId('story-card')).toBeVisible();
    await expect(page.getByTestId('story-card-title')).toHaveText('Cooper Club');
  });

  test('Go closes a card opened from the list, so focus is never lost', async ({ page }) => {
    await open1877(page);
    await walk(page, 'fx-astor', 'fx-bowery');
    await page.locator('[data-testid="walk-item"][data-point-id="fx-cooper"]').click();
    await expect(page.getByTestId('story-card')).toBeVisible();
    await page.getByTestId('walk-go').click();
    await expect(page.getByTestId('story-card')).toHaveCount(0);
    await expect(page.getByTestId('walk-go')).toBeFocused();
    await expect(page.getByTestId('walk-item')).toHaveCount(6);
  });

  test('Go pressed while the walk file is still loading waits for it (one line, full list)', async ({ page }) => {
    await page.route('**/content/stories.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: STORIES }),
    );
    await page.route('**/content/walk-graph.v1.json', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({ status: 200, contentType: 'application/json', body: GRAPH });
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');
    await page.getByTestId('walk-from').locator('option[value="fx-astor"]').waitFor({ state: 'attached' });
    await page.getByTestId('walk-from').selectOption('fx-astor');
    await page.getByTestId('walk-to').selectOption('fx-bowery');
    await page.getByTestId('walk-go').click();
    await page.getByTestId('walk-go').click();
    await expect(page.getByTestId('walk-item')).toHaveCount(6);
    await expect(page.locator('[data-testid="walk-line"]')).toHaveCount(1);
    await expect(page.getByTestId('walk-message')).toHaveText('6 places on this walk');
  });

  test('no street path between the two places shows its message', async ({ page }) => {
    const graph = JSON.parse(GRAPH);
    // A separate street piece far east, with one place on it.
    graph.nodes.push([90000000001, 40.7359, -73.9800], [90000000002, 40.7368, -73.9800]);
    graph.edges.push([90000000001, 90000000002, 100]);
    const stories = JSON.parse(STORIES);
    stories.groups.push({ id: 'fx-lonely', name: 'Lonely Pier', lat: 40.73635, lng: -73.98005, approx: false,
      stories: [{ id: 'fx-lonely-1', hook: 'h', text: 't', source: 's', link: null }] });
    await page.route('**/content/stories.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stories) }),
    );
    await page.route('**/content/walk-graph.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(graph) }),
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');
    await walk(page, 'fx-astor', 'fx-lonely');
    await expect(page.getByTestId('walk-message')).toHaveText('No walk found between these places.');
    await expect(page.locator('[data-testid="walk-line"]')).toHaveCount(0);
    await expect(page.getByTestId('walk-item')).toHaveCount(0);
  });

  test('a failed walk file is tried again the next time 1877 is picked', async ({ page }) => {
    let calls = 0;
    await page.route('**/content/stories.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: STORIES }),
    );
    await page.route('**/content/walk-graph.v1.json', (route) => {
      calls += 1;
      return calls === 1
        ? route.fulfill({ status: 500, body: 'down' })
        : route.fulfill({ status: 200, contentType: 'application/json', body: GRAPH });
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');
    await expect(page.getByTestId('walk-message')).toHaveText('Walks are not available right now.');
    await pickEra(page, 'today');
    await pickEra(page, '1877');
    await walk(page, 'fx-astor', 'fx-bowery');
    await expect(page.getByTestId('walk-item')).toHaveCount(6);
    expect(calls).toBe(2);
  });

  test('switching to Today while Go waits for the walk file draws nothing (diff review)', async ({ page }) => {
    await page.route('**/content/stories.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: STORIES }),
    );
    await page.route('**/content/walk-graph.v1.json', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({ status: 200, contentType: 'application/json', body: GRAPH });
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');
    await page.getByTestId('walk-from').locator('option[value="fx-astor"]').waitFor({ state: 'attached' });
    await page.getByTestId('walk-from').selectOption('fx-astor');
    await page.getByTestId('walk-to').selectOption('fx-bowery');
    await page.getByTestId('walk-go').click();
    await pickEra(page, 'today');
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-testid="walk-line"]')).toHaveCount(0);
    await expect(page.locator('path[stroke="#b5651d"]')).toHaveCount(0);
  });

  test('changing From/To while Go waits for the walk file walks the new pair (diff review)', async ({ page }) => {
    await page.route('**/content/stories.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: STORIES }),
    );
    await page.route('**/content/walk-graph.v1.json', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: GRAPH });
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');
    await page.getByTestId('walk-from').locator('option[value="fx-astor"]').waitFor({ state: 'attached' });
    await page.getByTestId('walk-from').selectOption('fx-astor');
    await page.getByTestId('walk-to').selectOption('fx-bowery');
    await page.getByTestId('walk-go').click();
    await page.getByTestId('walk-from').selectOption('fx-hudson');
    await page.getByTestId('walk-to').selectOption('fx-knick');
    await expect(page.getByTestId('walk-item')).toHaveText([
      'Hudson Hotel, 1 story',
      'Lafayette Hall, 1 story',
      'Knickerbocker, 1 story',
    ]);
  });

  test('a walk file with no streets counts as not available (diff review)', async ({ page }) => {
    await page.route('**/content/stories.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: STORIES }),
    );
    await page.route('**/content/walk-graph.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"version":1,"nodes":[],"edges":[]}' }),
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');
    await expect(page.getByTestId('walk-message')).toHaveText('Walks are not available right now.');
  });

  test('a missing walk file leaves no uncaught error in the page (diff review)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await open1877(page, 404);
    await expect(page.getByTestId('walk-message')).toHaveText('Walks are not available right now.');
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test('walk file is fetched once, however often 1877 is picked', async ({ page }) => {
    let graphFetches = 0;
    page.on('request', (r) => {
      if (r.url().includes('/content/walk-graph.v1.json')) graphFetches += 1;
    });
    await open1877(page);
    await pickEra(page, 'today');
    await pickEra(page, '1877');
    await walk(page, 'fx-astor', 'fx-bowery');
    await expect(page.getByTestId('walk-item')).toHaveCount(6);
    expect(graphFetches).toBe(1);
  });

  test('safety: walk panel uses text only (place names are not read as HTML)', async ({ page }) => {
    const groups = JSON.parse(STORIES);
    groups.groups[0].name = 'Astor <img src=x onerror="window.__walkXss=1">';
    await page.route('**/content/stories.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(groups) }),
    );
    await page.route('**/content/walk-graph.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: GRAPH }),
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');
    await walk(page, 'fx-astor', 'fx-bowery');
    await expect(page.getByTestId('walk-item').first()).toContainText('<img');
    await expect(page.getByTestId('walk-panel').locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __walkXss?: number }).__walkXss)).toBeUndefined();
  });

  // Amendment A4 (Stephen's look, Nov 16): after a walk, only that walk's pins stay on the map.
  const visiblePins = (page: Page) => page.locator('[data-testid="story-pin"]:not([hidden])');
  const icons = (page: Page) => page.locator('.leaflet-marker-icon');

  test('A4: after a walk only its pins show; Show all brings every pin back', async ({ page }) => {
    await open1877(page);
    await expect(page.getByTestId('walk-show-all')).toBeHidden();
    await walk(page, 'fx-hudson', 'fx-knick');
    await expect(visiblePins(page)).toHaveCount(3);
    await expect(icons(page)).toHaveCount(3);
    const ids = await visiblePins(page).evaluateAll((els) => els.map((e) => e.getAttribute('data-point-id')).sort());
    expect(ids).toEqual(['fx-hudson', 'fx-knick', 'fx-lafayette']);
    await expect(page.locator('[data-testid="story-pin"][data-point-id="fx-cooper"]')).toBeHidden();

    const showAll = page.getByTestId('walk-show-all');
    await expect(showAll).toBeVisible();
    await expect(showAll).toHaveText('Show all places');
    await showAll.click();
    await expect(visiblePins(page)).toHaveCount(12);
    await expect(icons(page)).toHaveCount(12);
    await expect(showAll).toBeHidden();
    await expect(page.locator('[data-testid="walk-line"]')).toHaveCount(0);
    await expect(page.getByTestId('walk-item')).toHaveCount(0);
    await expect(page.getByTestId('walk-go')).toBeFocused();
  });

  test('A4: a walk that ends in a message shows every pin', async ({ page }) => {
    await open1877(page);
    await walk(page, 'fx-hudson', 'fx-knick');
    await expect(visiblePins(page)).toHaveCount(3);
    await walk(page, 'fx-astor', 'fx-astor');
    await expect(page.getByTestId('walk-message')).toHaveText('Pick two different places.');
    await expect(visiblePins(page)).toHaveCount(12);
    await expect(icons(page)).toHaveCount(12);
    await expect(page.getByTestId('walk-show-all')).toBeHidden();
  });

  test('A4: Today then 1877 shows every pin; picking 1877 again keeps the walk', async ({ page }) => {
    await open1877(page);
    await walk(page, 'fx-hudson', 'fx-knick');
    await pickEra(page, '1877');
    await expect(visiblePins(page)).toHaveCount(3);
    await expect(icons(page)).toHaveCount(3);
    await expect(page.getByTestId('walk-item')).toHaveCount(3);
    await expect(page.locator('[data-testid="walk-line"]')).toHaveCount(1);

    await pickEra(page, 'today');
    await pickEra(page, '1877');
    await expect(visiblePins(page)).toHaveCount(12);
    await expect(icons(page)).toHaveCount(12);
    await expect(page.getByTestId('walk-show-all')).toBeHidden();
  });

  test('A4: Show all while a list card is open closes the card and focuses Go', async ({ page }) => {
    await open1877(page);
    await walk(page, 'fx-hudson', 'fx-knick');
    await page.locator('[data-testid="walk-item"][data-point-id="fx-lafayette"]').click();
    await expect(page.getByTestId('story-card')).toBeVisible();
    await page.getByTestId('walk-show-all').click();
    await expect(page.getByTestId('story-card')).toHaveCount(0);
    await expect(page.getByTestId('walk-go')).toBeFocused();
    await expect(visiblePins(page)).toHaveCount(12);
  });

  test('A4: a pin card opened while a slow walk file loads is closed when its pin is hidden', async ({ page }) => {
    await page.route('**/content/stories.v1.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: STORIES }),
    );
    await page.route('**/content/walk-graph.v1.json', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: GRAPH });
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pickEra(page, '1877');
    await page.getByTestId('walk-from').locator('option[value="fx-hudson"]').waitFor({ state: 'attached' });
    await page.getByTestId('walk-from').selectOption('fx-hudson');
    await page.getByTestId('walk-to').selectOption('fx-knick');
    await page.getByTestId('walk-go').click();
    await page.locator('[data-testid="story-pin"][data-point-id="fx-cooper"]').click();
    await expect(page.getByTestId('story-card')).toBeVisible();
    await expect(page.getByTestId('walk-item')).toHaveCount(3);
    await expect(page.getByTestId('story-card')).toHaveCount(0);
    await expect(visiblePins(page)).toHaveCount(3);
    await expect(page.getByTestId('walk-go')).toBeFocused();
  });

  test('A4: Tab from Show all never reaches a pin that is not on the walk', async ({ page }) => {
    await open1877(page);
    await walk(page, 'fx-hudson', 'fx-knick');
    await page.getByTestId('walk-show-all').focus();
    const reached: string[] = [];
    for (let i = 0; i < 30; i += 1) {
      await page.keyboard.press('Tab');
      const id = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el && el.getAttribute('data-testid') === 'story-pin' ? el.getAttribute('data-point-id') : null;
      });
      if (id) reached.push(id);
    }
    expect(reached.length).toBeGreaterThan(0);
    for (const id of reached) {
      expect(['fx-hudson', 'fx-lafayette', 'fx-knick']).toContain(id);
    }
  });
});

