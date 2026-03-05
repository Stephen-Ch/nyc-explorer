# R-038 — Data Promotion v0: AllYears CSV → Runtime poi.v1.json (+ Interests / Time)

**R-ID:** R-038  
**Date:** 2026-03-05  
**Type:** Data Engineering Plan / Research Doc  
**Status:** Open  
**Prompt:** NYCX-R-ERIC-MVP-CONTRACT-TAXONOMY-DATAPROMO-RESEARCH-003  
**Depends on:** R-034, R-035, R-036, R-037

---

## 1. Source-of-Truth Proposal

### Current state (v0.1)

```
content/poi.v1.json          ← RUNTIME: 10 POIs, placeholder images/sources
data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv  ← IDLE READY-ASSET: 42 POIs × 7 eras, real images/sources
```

**Problem:** The runtime JSON is a hand-authored thin slice. The historical CSV is far richer but not wired in. Any multi-era or interest-filtered feature requires the historical data.

### Proposed canonical model

```
data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv   ← CANONICAL source-of-truth (edit here)
    ↓  promotion script (future: scripts/promote-pois.ts)
content/poi.v1.json                                       ← GENERATED runtime artifact (do not hand-edit)
```

**Rules:**
- All POI authoring happens in the CSV (or per-era CSVs in `data/historical/attractions/{year}/`)
- The runtime JSON is generated — treated as a build artifact
- Schema tests (`tests/schema/poi.spec.ts`, `tests/schema/poi-count-10.spec.ts`) validate the generated JSON
- The CSV remains the single place to add, remove, or update attractions

---

## 2. Field Mapping Table: AllYears CSV → poi.v1.json

| CSV column | poi.v1.json field | Notes / transformation |
|-----------|------------------|----------------------|
| `id` | `id` | Direct — already slug format (e.g. `union-square-park-1852`) |
| `name` | `name` | Direct |
| `summary` | `summary` | Direct |
| `description` | `description` | Direct |
| `lat` | `coords.lat` | Wrap in `{ lat, lng }` object |
| `lng` | `coords.lng` | Wrap in `{ lat, lng }` object |
| `borough` | `borough` | Direct |
| `neighborhood` | `neighborhood` | Direct |
| `area` | `area` | Direct |
| `block` | `block` | Direct |
| `year` | `year` | Direct (integer) |
| `route_id` | `route_id` | Direct |
| `order` | `order` | Direct (integer) |
| `tags` | `tags` | Parse JSON array string → string[] |
| `sources` | `sources` | Parse JSON array string → `{title, publisher, url}[]` — **real URLs present** |
| `images` | `images` | Parse JSON array string → **note: CSV has `{url, credit, license}`; runtime expects `{src, credit, license}`** — rename `url → src` on promotion |
| `address_hint` | — | **No matching field in poi.v1.json** — add `address_hint` to runtime schema OR drop |
| `bbl` | — | **No matching field in poi.v1.json** — add `bbl` OR keep CSV-only |
| `year_file` | — | CSV provenance field only — do NOT promote to runtime |
| `tile_id` | `tile_id` | **Not in current runtime schema** — add if route-corridor filtering uses it |
| — | `interests[]` | **New field** — must be authored in CSV first; no current column (R-037) |
| — | `year_start` / `year_end` | **New fields** — must be authored in CSV first; no current column (R-036 DEC-1) |

### Image field rename required
CSV `images` column format: `[{"url": "...", "credit": "...", "license": "..."}]`  
Runtime `poi.v1.json` `images` format (current): `[{"src": "...", "credit": "...", "license": "..."}]`  
→ **Promote script must rename `url → src`** on every image object.

---

## 3. Interest Integration Plan

### Join key analysis

| Potential join key | In POI AllYears CSV? | In Events CSVs? | Usable? |
|-------------------|---------------------|----------------|---------|
| `id` (POI slug) | ✅ `id` column | ❌ Event IDs are event slugs (e.g. `usq-great-union-meeting-1861-04-20`) | **GAP: no join key** |
| `bbl` / `bbl10` | ✅ `bbl` column (present but many empty) | ✅ `bbl10` in Events_Seed.csv + nycx_events_backlog_seed.csv | **PARTIAL** — BBL coverage is incomplete in both files |
| `tile_id` | ✅ `tile_id` column (7 unique values: `LM-R01C01` to `LM-R04C04`) | ✅ `tile_id` in Events_withBBL_andTiles.csv (6 matching values) | **Coarse join only** — each tile contains multiple POIs AND multiple events; cannot infer interest from event → POI this way |
| `lat` / `lng` | ✅ both | ✅ both | **Proximity match only** — not a clean join without a distance threshold decision |

**GAP: No clean join key between Events and POIs.**  
Events `interest_tags` cannot be automatically mapped to POIs. Strategies:

| Strategy | Notes |
|----------|-------|
| **A) Manual mapping table** (recommended for v0) | Author a `data/historical/poi-interest-tags.csv` with columns `poi_id, interest_slugs` — maintained by hand, used by promote script |
| B) BBL-based join | Only viable where BBL is populated in both; needs BBL coverage pass on AllYears CSV first |
| C) Proximity join (coords) | Fragile; events and POIs at same address would join, but distant events would not — requires distance threshold (undecided, R-036 DEC-3) |
| D) Tile-grid join | Too coarse — assigns all interests in a tile cell to all POIs in that cell, leading to incorrect tagging |

**Recommendation:** Strategy A — author a separate `poi-interest-tags.csv` mapping file as part of the interests authoring sprint. This is explicit, auditable, and does not require resolving the geocoder or BBL gaps first.

---

## 4. Time Model Plan

### Current state
Both AllYears CSV and poi.v1.json use a single `year` integer (e.g. `1852`). No `year_start`/`year_end` columns exist anywhere.

### Filtering with current data (Option A — tolerance)
Filter `year` field: `poi.year >= spanStart AND poi.year <= spanEnd`  
Example: date span 1800–1900 → returns POIs with `year` in {1852, 1877}  
- No CSV changes required
- Loses nuance for POIs that spanned multiple eras (e.g. a building present from 1877 to 1952)

### Filtering with extended data (Option B — explicit span)
Add `year_start` and `year_end` columns to AllYears CSV + runtime JSON schema  
Filter: `poi.year_start <= spanEnd AND poi.year_end >= spanStart` (standard overlap)  
- Requires authoring 42 POI entries with start/end years
- More accurate: a building standing 1877–1952 appears in all spans that overlap that range
- Schema extension: add `year_start?: number`, `year_end?: number` as optional fields

### Recommendation
Implement Option A first (no schema change). Plan Option B as a follow-up authoring task once the interest filter is working. Flag POIs that span multiple eras (can be identified from AllYears CSV by checking if same POI name appears across multiple era rows).

---

## 5. Promotion Script Outline (proposal — no implementation yet)

```typescript
// scripts/promote-pois.ts (proposed)
// Input:  data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv
// Input:  data/historical/poi-interest-tags.csv (to be authored)
// Output: content/poi.v1.json (overwrite)

// Steps:
// 1. Parse AllYears CSV with papaparse or csv-parse
// 2. For each row:
//    a. Parse tags JSON array
//    b. Parse sources JSON array
//    c. Parse images JSON array; rename url → src
//    d. Build coords {lat, lng} object
//    e. Lookup interests[] from poi-interest-tags.csv by poi id (optional; default [])
// 3. Validate against JSON schema (reuse existing schema test logic)
// 4. Write content/poi.v1.json
// 5. Exit non-zero on validation failure
```

---

## 6. Validation / Gates

### Existing gates (already passing)
| Gate | Command | What it validates |
|------|---------|------------------|
| Schema test | `npm run e2e:auto` → `tests/schema/poi.spec.ts` | `content/poi.v1.json` matches schema |
| Count test | `npm run e2e:auto` → `tests/schema/poi-count-10.spec.ts` | ≥ 10 POIs present |

### Recommended new gates (proposal — not yet implemented)
| Gate | Purpose |
|------|---------|
| Negative: no `example.org` sources | Ensure placeholder URLs have been replaced on promotion |
| Negative: no empty `images[]` arrays | Every promoted POI should have ≥ 1 real image |
| Positive: all `interests[]` values in taxonomy | Validate no unknown interest slugs (against R-037 allowed list) |
| Positive: `year` present on all POIs | Guard against broken rows in CSV |
| Schema: `coords.lat` and `coords.lng` are numbers | Guard against string-typed coordinates |

---

## 7. Files Affected by Promotion

| File | Change type | Notes |
|------|------------|-------|
| `content/poi.v1.json` | Overwritten by promote script | Will change from 10 POIs to 42+ POIs |
| `tests/schema/poi.spec.ts` | Possible extension | Add `interests[]`, `year_start/end` to schema contract if DEC-1/DEC-2 resolved |
| `tests/schema/poi-count-10.spec.ts` | Possible extension | Update count threshold to match promoted data |
| TypeScript types in `apps/web-mvc/` | Extension | Add `interests?: string[]`, `tile_id?: string` to POI type |
| `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv` | New columns authored | `interests`, `year_start`, `year_end` (pending decisions DEC-1, DEC-2 from R-036) |

---

## 8. Summary Gap Table

| Gap | Blocker for? | Resolution |
|-----|-------------|-----------|
| `url → src` rename in images | Promotion | Rename in promote script |
| No `interests` column in AllYears CSV | Interest filter | Author `poi-interest-tags.csv` + promote script reads it |
| No `year_start`/`year_end` in AllYears CSV | Date-span filter (Option B) | Author or use Option A tolerance |
| No Events → POI join key | Auto-assigning interest_tags to POIs | Manual mapping table (Strategy A) |
| No promotion script | Any promotion | Author `scripts/promote-pois.ts` |
| `bbl` not in runtime schema | BBL-based lookups | Add to schema if needed; hold for now |
| Placeholder sources in runtime JSON | Detail page "More info" | Auto-resolved by promotion (CSV has real URLs) |
