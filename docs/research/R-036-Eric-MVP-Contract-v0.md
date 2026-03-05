# R-036 — Eric MVP Contract v0

**R-ID:** R-036  
**Date:** 2026-03-05  
**Type:** Product Contract / Research Doc  
**Status:** Open  
**Prompt:** NYCX-R-ERIC-MVP-CONTRACT-TAXONOMY-DATAPROMO-RESEARCH-003

---

## 1. Eric Story

**User persona:** Eric — a historically-curious walker planning a themed walk through NYC's past.

### Happy path (full)

1. Eric opens the app on his phone
2. Types a start address: **"14th & 3rd"** into the From input
3. Types a destination: **"23rd & 6th"** into the To input
4. Selects a **date span**: e.g. 19th century (1800–1900) using a range control
5. Multi-selects **interests**: e.g. African American history + Irish history
6. Taps **Find Route**
7. App renders:
   - A **walking route polyline** on the map from start to destination
   - **Attractions along the route** — POI markers filtered to those within the route corridor AND matching the selected era + interests
8. Taps an attraction marker → sees a **brief description card** (name, summary, 1 image)
9. Taps **"More info"** → navigates to the detail page / source citation
10. Can return to the map and try a different date span or interest selection without losing the route

---

## 2. Must-Have MVP Capabilities (Eric feature set)

| # | Capability | Category |
|---|-----------|---------|
| 1 | Free-text address geocoding for From/To (cross-streets, partial addresses) | Input |
| 2 | Date span filter — range with at minimum century-level resolution (1800–1900, 1900–2000, etc.) | Filter |
| 3 | Multi-select interest filter (at minimum: African American history, Irish history + 4–6 others) | Filter |
| 4 | Walking route polyline overlay on the map | Route |
| 5 | Attractions filtered to those geometrically near the route AND matching active era + interest filters | Route |
| 6 | Attraction brief card: name, summary, 1 image, 1-tap detail nav | Detail |
| 7 | Detail page: full description + source citations (real URLs, not placeholders) | Detail |
| 8 | Multi-era attraction data covering ≥ 7 eras | Data |
| 9 | Interest taxonomy with ≥ 8 meaningful values including AA + Irish | Data |

---

## 3. Current Foundation (what already exists)

### Input / Route (partial)
- **Route From/To inputs exist** — `tests/e2e/route-inputs.spec.ts` asserts `[data-testid="route-from"]`, `[data-testid="route-to"]`, `[data-testid="route-find"]` visible and fillable
- **Route turn list renders** — `tests/e2e/route-ui.spec.ts` asserts `#route-steps` visible + `[data-testid="route-step"]` items present
- **Current inputs accept POI names** (`"Flatiron Building"`, `"Union Square Park"`) — NOT free-text street-address geocoding

### POI Detail cards (partial)
- **Detail page**: `tests/e2e/detail-page.spec.ts` asserts `#poi-title`, `#poi-summary`, `[data-testid="poi-source"]` count > 0
- **Detail images**: `tests/e2e/detail-images.spec.ts` asserts `img[data-testid="poi-image"]` + `[data-testid="img-credit"]`
- **Gap**: `content/poi.v1.json` uses **placeholder images** (`/images/flatiron.jpg`) and **placeholder sources** (`https://example.org/…`)

### Data (thin runtime layer only)
- Runtime: `content/poi.v1.json` — 10 POIs, Union Square + Flatiron, single `year` integer, `tags` category labels, placeholder sources/images
- Historical idle asset: `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv` — 42 POIs × 7 eras, real Wikimedia images, real provenance URLs (R-034)
- **Not yet wired**: historical asset is a file on disk; no runtime endpoint serves it

### What is explicitly NOT present
| Capability | Status |
|-----------|--------|
| Geocoder / free-text address resolution | ❌ Absent |
| Date span UI control | ❌ Absent |
| Interest filter UI | ❌ Absent |
| Polyline overlay on map | ❌ Explicitly non-goal in MVP v0.1 DoD §5 |
| Route-corridor geometry filtering | ❌ Absent |
| Non-placeholder images and sources | ❌ Runtime has placeholders; historical has real data (not wired) |
| African American / Irish history tags or POIs | ❌ No data exists anywhere (R-035: zero signals) |

---

## 4. DECISION NEEDED

### DEC-1: Time model
**Options:**
- A) Keep `year` (single integer, current) — filter `year BETWEEN start AND end`; simple but loses date-range POIs spanning multiple eras
- B) Add `year_start` + `year_end` to POI schema — enables "this building stood from 1855 to 1902"; costs authoring effort for all 42 historical POIs

**Recommendation:** Option B for historical data, Option A as fallback for POIs without a span. Need decision before data promotion.

### DEC-2: Interest model
**Options:**
- A) Add `interests[]` field to POI schema (parallel to `tags`) — keeps category `tags` intact; `interests` = user-facing taxonomy values
- B) Repurpose `tags` as `interests` — one field; requires re-authoring all tag values
- C) Add `interests[]` to POIs AND keep `interest_tags` on Events — two parallel fields; queried separately

**Recommendation:** Option A — add `interests[]` to POI schema. Leave `tags` as internal category labels. Align with Events `interest_tags` naming pattern. Need decision before schema extension.

### DEC-3: Along-route attraction selection rule
**Options:**
- A) Euclidean distance ≤ N meters from any polyline segment point
- B) Snap to nearest route segment, include if snap distance ≤ threshold
- C) Tile-grid filter: include any POI whose `tile_id` overlaps with route tile cells

**No proven geometry system exists.** `tile_id` exists in both AllYears CSV and Events_withBBL_andTiles CSV (both use `LM-RxxCxx` grid format) — this is a coarse grid cell join only (multiple POIs per cell). Need decision + cap (e.g., max 10 attractions per route). No tie-break rule established.

### DEC-4: "More info" UX
**Options:**
- A) Navigate to existing `/poi/{id}` detail page (already implemented)
- B) Inline expandable card (no navigation)
- C) Open primary `sources[0].url` directly in new tab

**Current implementation:** `/poi/{id}` detail page exists. `[data-testid="poi-source"]` renders but links to `example.org` placeholders in runtime JSON. Need decision whether "more info" = same detail page or separate source link.

---

## 5. Proposed "Eric Happy Path" e2e Spec Outline

> **Status: Proposal only — no implementation. Not a real spec file.**

```
test('Eric MVP happy path — date span + interests → route + filtered attractions')

1. GET /content/poi.v1.json → assert ≥ 1 POI with interests includes 'african-american-history'
2. page.goto('/')
3. fill [data-testid="route-from"] with "14th St & 3rd Ave"
4. fill [data-testid="route-to"] with "23rd St & 6th Ave"
5. Set date span: yearStart=1800, yearEnd=1900
   → locator('[data-testid="date-span-start"]').fill('1800')
   → locator('[data-testid="date-span-end"]').fill('1900')
6. Select interest: click '[data-testid="interest-african-american-history"]'
7. click '[data-testid="route-find"]'
8. expect('#map canvas polyline, .leaflet-overlay-pane path').toBeVisible()  ← polyline
9. expect('[data-testid="attraction-marker"]').toHaveCount(greaterThan(0))
10. click('[data-testid="attraction-marker"]').first()
11. expect('[data-testid="poi-card-name"]').toBeVisible()
12. expect('[data-testid="poi-card-summary"]').toBeVisible()
13. expect('[data-testid="poi-card-image"]').toBeVisible()
14. click('[data-testid="poi-card-more-info"]')
15. expect('#poi-title').toBeVisible()
16. expect('[data-testid="poi-source"]').toHaveAttribute('href', notContaining('example.org'))
```

**New test IDs required (not yet in any spec):**  
`date-span-start`, `date-span-end`, `interest-{slug}`, `attraction-marker`, `poi-card-name`, `poi-card-summary`, `poi-card-image`, `poi-card-more-info`

---

## 6. Risks / Gaps

| Risk | Severity | Detail |
|------|----------|--------|
| **No AA / Irish seed data** | HIGH | Zero existing POIs or tags for African American history or Irish history anywhere in repo (R-035). Both require net-new authoring before any interest filter can work. |
| **Geocoder not wired** | HIGH | Route inputs accept text but use `buildRoute(pois, {})` — not a geocoder. Street-address resolution requires a provider (e.g., Nominatim, Google) or local fixture. |
| **Polyline is a non-goal in current MVP DoD** | MEDIUM | `docs/project/EPICS.md §5`: "Polyline overlay rendering — nice-to-have; turn list is sufficient for MVP". Eric's happy path requires a polyline. Eric feature = post-v0.1. |
| **No events → POI join key** | MEDIUM | Events CSVs + POI AllYears share `tile_id` grid cells — but each cell covers multiple POIs and events. No 1:1 join. Interest tags from events cannot be auto-mapped to POIs without manual authoring. |
| **Historical data not wired** | MEDIUM | `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv` has the rich multi-era data but zero runtime endpoint serves it. Promotion to JSON is a separate work item. |
| **Schema extension needed** | MEDIUM | Adding `interests[]`, `year_start`, `year_end` to POI JSON schema will touch `content/poi.v1.json`, schema tests, and TypeScript types. |
| **Single `year` integer in all existing data** | LOW | Neither runtime JSON nor historical CSV has `year_start`/`year_end`. Date-span filtering requires either tolerance (treat `year` as mid-point) or explicit authoring. |
