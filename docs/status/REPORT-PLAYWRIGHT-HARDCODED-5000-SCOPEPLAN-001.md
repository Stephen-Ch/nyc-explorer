# Playwright Hardcoded :5000 — Scope Plan

**Report ID:** REPORT-PLAYWRIGHT-HARDCODED-5000-SCOPEPLAN-001
**Prompt ID:** NYCX-PLAYWRIGHT-HARDCODED-5000-SCOPE-RESEARCH-001
**Date:** 2026-03-04
**Status:** Research complete — ready for implementation prompt
**Scope:** tests/e2e/ only (no runtime/app changes)

---

## Background

During a Playwright e2e run (`npm run e2e:auto`), browser windows opened blank and tests failed
with `connect ECONNREFUSED ::1:5000`. Initial diagnosis was a port contention problem (R-029).
A port-shift attempt (`:5000` → `:5001` in `playwright.config.ts`) failed because 20 e2e
spec files define their own `const BASE_URL = process.env.BASE_URL || 'http://localhost:5000'`
and use it to construct absolute URLs, bypassing Playwright's configured `baseURL` entirely.

---

## Root Cause

All 20 affected spec files share this pattern (line 3 or 4):

```ts
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
```

They then pass absolute URLs to `request.get()` and `page.goto()`:

```ts
await request.get(`${BASE_URL}/content/poi.v1.json`);  // absolute → ignores baseURL
await page.goto(`${BASE_URL}/poi/${id}`);              // absolute → ignores baseURL
```

Playwright's `baseURL` (in `playwright.config.ts`) is only honoured when a **relative** path is
passed. Because the specs build their own absolute URL, no port or host change in the config
has any effect on these tests.

The 37 other e2e specs (e.g., `overlay.smoke.spec.ts`, `route-find.spec.ts`) correctly use
relative paths (`page.goto('/')`) and are unaffected.

---

## Hardcoded :5000 Occurrences

### Category 1 — Bypass baseURL (must fix)

| File | Lines affected | Call types |
|------|---------------|------------|
| tests/e2e/back-to-map.spec.ts | 3, 7, 18, 27 | request.get, page.goto, toHaveURL |
| tests/e2e/detail-images.spec.ts | 3, 6, 15 | request.get, page.goto |
| tests/e2e/detail-page.spec.ts | 3, 7, 18 | request.get, page.goto |
| tests/e2e/form-a11y.spec.ts | 3, 6 | page.goto |
| tests/e2e/leaflet.spec.ts | 3, 7 | page.goto |
| tests/e2e/list-to-detail.spec.ts | 3, 7, 17, 29 | request.get, page.goto, waitForURL |
| tests/e2e/map.spec.ts | 3, 7, 20 | request.get, page.goto |
| tests/e2e/marker-a11y.spec.ts | 3, 6, 15, 23 | request.get, page.goto, waitForURL |
| tests/e2e/marker-focus.spec.ts | 3, 6, 13 | request.get, page.goto |
| tests/e2e/marker-to-detail.spec.ts | 3, 7, 17, 25 | request.get, page.goto, waitForURL |
| tests/e2e/path-helper.spec.ts | 3, 7, 12 | request.get ×2 |
| tests/e2e/placeholder-encoding.spec.ts | 4, 7 | page.goto |
| tests/e2e/poi-endpoint.spec.ts | 3, 9 | request.get |
| tests/e2e/probe.spec.ts | 3, 7 | page.goto |
| tests/e2e/route-detail.spec.ts | 3, 7, 18, 28 | request.get ×2, page.goto |
| tests/e2e/route-filter.spec.ts | 3, 6, 13 | request.get, page.goto |
| tests/e2e/route-inputs.spec.ts | 3, 6 | page.goto |
| tests/e2e/route-ui.spec.ts | 4, 7, 13 | request.get, page.goto |
| tests/e2e/search.spec.ts | 3, 7, 18 | request.get, page.goto |
| tests/e2e/vis-map.spec.ts | 4, 12 | page.goto |

**Total: 20 files, all Category 1**

### Category 2 — Config (intentional, not a bug)

| File | Lines | Note |
|------|-------|------|
| playwright.config.ts | 16 | `baseURL: process.env.BASE_URL \|\| 'http://localhost:5000'` |
| playwright.config.ts | 29–30 | `webServer.command` + `webServer.url` |

### Not affected

- tests/helpers/, tests/fixtures/ — zero matches
- tests/meta/, tests/schema/, tests/unit/, tests/types/ — zero matches
- 37 e2e specs not listed above — use relative paths correctly

---

## Fix Plan

### Preferred: Option 1 — Replace absolute URLs with relative paths in all 20 files

No shared helper needed. No config changes. This matches the pattern already used by 37 correct specs.

**Mechanical change per file (3 parts):**

1. **Delete** the `const BASE_URL = …` line (line 3 or 4 of each file)
2. **Replace** template literals: `` `${BASE_URL}/path` `` → `'/path'`
3. **Replace** bare references:
   - `page.goto(BASE_URL)` → `page.goto('/')`
   - `page.goto(BASE_URL + '/')` → `page.goto('/')`
   - `` page.waitForURL(`${BASE_URL}/poi/${id}`) `` → `` page.waitForURL(`/poi/${id}`) ``
   - `expect(page).toHaveURL(BASE_URL + '/')` → `expect(page).toHaveURL('/')`

**Before → After examples:**

```ts
// BEFORE (back-to-map.spec.ts)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const poiResponse = await request.get(`${BASE_URL}/content/poi.v1.json`);
await page.goto(`${BASE_URL}/poi/${id}`);
await expect(page).toHaveURL(BASE_URL + '/');

// AFTER
const poiResponse = await request.get('/content/poi.v1.json');
await page.goto(`/poi/${id}`);
await expect(page).toHaveURL('/');
```

```ts
// BEFORE (leaflet.spec.ts)
const response = await page.goto(BASE_URL);

// AFTER
const response = await page.goto('/');
```

```ts
// BEFORE (list-to-detail.spec.ts)
page.waitForURL(`${BASE_URL}/poi/${id}`)

// AFTER
page.waitForURL(`/poi/${id}`)
```

---

## Verification (after fix)

```powershell
# 1. Typecheck
npm run typecheck

# 2. Minimal run — confirm back-to-map (the previously failing anchor test)
npx playwright test --project=chromium --workers=1 --reporter=line tests/e2e/back-to-map.spec.ts

# 3. Full suite
npm run e2e:auto
```

**Success criteria:**
- `npm run typecheck` → zero errors
- back-to-map test → PASS (not ECONNREFUSED)
- `npm run e2e:auto` → summary shows X passed (same or better than last known 97/98)

---

## Files NOT to change

- `playwright.config.ts` — `baseURL` and `webServer` stay on `:5000`; they are correct
- Any file in `tests/meta/`, `tests/schema/`, `tests/unit/`, `tests/types/`, `tests/helpers/`, `tests/fixtures/`
- Any runtime/app file under `apps/`

---

## Next Step

Ready for implementation prompt targeting the 20 files listed above.
