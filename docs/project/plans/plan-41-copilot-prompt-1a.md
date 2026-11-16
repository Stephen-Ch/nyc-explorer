# Copilot prompt 1a: show 1877 stories (plan 41, steps 4-5)

Amendment A2 (Stephen, Nov 16 2026): CI blocks any edit to apps/web-mvc/Program.cs (overlay freeze guard), so this work does NOT touch Program.cs. The stories file is served by a new controller, and home.js builds the era picker and card itself.

## Paste block for Copilot

Repo: nyc-explorer, branch `feat/stories-1877-41` (already checked out and up to date with origin). Confirm with `git branch --show-current` before starting.

Goal: a walker picks era 1877 and sees the 1877 stories on the map. Red tests already exist and must turn green:
- `tests/e2e/stories-1877.spec.ts`
- `tests/e2e/stories-endpoint.spec.ts`
Fixture: `tests/fixtures/stories/stories-1877.fixture.json`. Real data: `content/stories.v1.json` (do not edit either).

Read the two spec files first. They define every `data-testid`, text and behaviour. Do not edit any test file.

Files you may change or create (no others):
1. `apps/web-mvc/Controllers/StoriesController.cs` (new)
2. `apps/web-mvc/ContentPathHelper.cs`
3. `apps/web-mvc/wwwroot/js/home.js`
4. `apps/web-mvc/wwwroot/js/stories.js` (new)

Do NOT edit `apps/web-mvc/Program.cs` (CI fails the PR if you do) or any file under `tests/`.

### 1. Server
- `ContentPathHelper.GetStoriesFilePath(IWebHostEnvironment env)`: same folder as the POI file, file name `stories.v1.json`.
- `StoriesController` with `[HttpGet("/content/stories.v1.json")]`: if the file is missing return 404 with JSON `{ "error": "content/stories.v1.json not found" }`; otherwise return the file text with content type `application/json`. Read the file on each request, no caching. Follow the style of `PoiController.cs`.

### 2. home.js
- Keep every existing behaviour and `data-testid`. Do not wrap home.js in a function or module: `map`, `pois`, `render` and `placeButtons` must stay top-level names (nav-bootstrap.js and marker-sanitizer.js use them).
- Keep a reference to each POI Leaflet marker so they can be removed from and re-added to the map.
- Add `let currentEra = 'today'`. While the era is `1877`: `placeButtons()` renders no POI buttons, and POI Leaflet markers are removed from the map. Back to `today` restores both. The POI list and route steps do not change with the era.
- Replace the `.catch` that does `document.body.textContent = 'Failed to load POIs'` with: log the error, then set the text of `[data-testid="poi-error"]` to `Unable to load POIs.` and remove any inline `display:none` from it so it is visible. The page must not be replaced.
- Build the era picker in JS, inserted right after the `<h1>`: a `div` with `data-testid="era-picker"`, `role="group"`, `aria-label="Era"`, holding two `button type="button"` elements with `data-testid="era-option"`, `data-era="today"` (visible text `Today`) and `data-era="1877"` (visible text `1877`). No `aria-label` on these buttons (another test looks up labels containing "To"). Set `aria-pressed` set to match the current era. Default era is Today.
- Expose exactly these globals: `window.__nycMap = map`; `window.__nycSetEra(era)` changes the era (the picker buttons call it); `window.__nycOnEra(fn)` registers a listener that is called with the new era after every change. Load `/js/stories.js` by creating a `<script>` element from home.js (Program.cs cannot add the tag).
- The stories fetch must NOT be chained to the POI fetch. A POI failure must not stop stories, and a stories failure must not touch POIs.

### 3. stories.js
- Fetch `/content/stories.v1.json` once, the first time 1877 is picked (cache the result). On failure (non-2xx, network, bad JSON) set `[data-testid="stories-error"]` (create it, `aria-live="polite"`) to `Unable to load 1877 stories.` and show no pins.
- One Leaflet marker per group (`L.marker([lat, lng], { keyboard: false, interactive: false })`, so the overlay button is the only tab stop) with NO `bindPopup` and NO `bindTooltip`. Plus one accessible overlay button per group in its own overlay layer `#story-overlay` (create it inside `#map-wrap`, same CSS as `#poi-overlay`; do NOT use `#poi-overlay`, existing scripts clear it). Each button: `data-testid="story-pin"`, `data-point-id=<group.id>`, `aria-label` = `<name>, <n> stories` (`1 story` when n is 1), `tabindex=0`, positioned with `map.latLngToContainerPoint` like the POI buttons, repositioned on map `move`, `zoom`, `resize`. Click or Enter opens the card.
- Leaving 1877 removes the story markers and buttons and closes the card.
- Story card: one element, `data-testid="story-card"`, `role="dialog"`, `aria-labelledby` pointing at the title. Contents:
  - title `data-testid="story-card-title"` = group name
  - if `approx` is true: `data-testid="story-approx"` with text `approx.`; nothing when false
  - close button `data-testid="story-card-close"`, label `Close`
  - one `data-testid="story-item"` per story with `story-hook`, `story-text` (the text, or `Full story coming.` when text is null or empty), `story-source`, and `story-link` only when the link starts with `https://` (text `Read the page`, `target="_blank"`, `rel="noopener noreferrer"`)
  - `data-testid="story-attribution"` with the file's `attribution` text
- SAFETY: build every node with `document.createElement` and set story values with `textContent` only. Never use `innerHTML`, `insertAdjacentHTML`, `outerHTML` or Leaflet popups/tooltips for story content.
- Opening the card moves focus to the close button. While the card is open, Tab and Shift+Tab stay inside it (wrap from the last focusable element to the first and back). Esc or the close button closes it and returns focus to the pin that opened it.
- A live region `data-testid="story-status"`, `aria-live="polite"`: on open set its text to `Showing <n> stories at <name>` (`1 story` when n is 1).
- Layout (inject one `<style>` element from stories.js): screen 600px wide or less, card fixed to the bottom, full width, max height 60vh, scrolls; wider, card fixed to the right, 360px wide, full height, scrolls. White background, 1rem padding, visible focus outline on pins and buttons.

### 4. Check before you stop
Run `npm run typecheck`, then `npx playwright test`. All tests must pass (76 existing + 11 new). Show me the result and the diff. Do not commit; I will review first.

## Notes for Stephen (not for Copilot)
- Before pasting: on the PC, the repo is still on `chore/import-try-config`. Copilot needs `feat/stories-1877-41` checked out. Git on the PC needs delete permission (lock files), so the checkout may need you to run it in PowerShell: `git fetch origin; git checkout feat/stories-1877-41`.
- The server 404 test is a hand check in step 6: rename the file, open /content/stories.v1.json, expect 404.
- Known follow-up (not for Copilot): with real data, 4 of 34 story pins partly overlap a neighbour, so a tap can open the wrong card. Check in step 6; fix later if it bothers you.
- Hostile review (fresh reviewer, Nov 16): APPROVE WITH CHANGES, 9 findings (1 blocker: card focus trap), all folded into this prompt and the tests.
- After Copilot finishes, paste its output back here; Claude reviews the diff, then commits and pushes.
