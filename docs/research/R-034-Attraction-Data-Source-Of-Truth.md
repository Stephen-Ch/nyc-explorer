# R-034 — Attraction Data: Source-of-Truth Location and Rules

**R-ID:** R-034  
**Date:** 2026-03-04  
**Type:** Provenance / Research Doc  
**Status:** Open  
**Prompt:** NYCX-R-ATTRACTION-DATA-SOURCE-OF-TRUTH-RESEARCH-001

---

## Question

Where is the authoritative source of attraction (POI) data in this repo? What fields exist, which files are active vs. idle, and what gaps block Eric MVP features (time-span filter, multi-select interest taxonomy)?

---

## Answer Summary

There are two layers: a thin **runtime source** wired into the app today, and a rich **historical ready-asset** that is fully built but not yet wired in.

---

## 1. Runtime Source-of-Truth

**File:** `content/poi.v1.json`  
**Last commit:** `292b99d` 2025-10-31 — `DATA-10b — add 5 POIs to reach ≥10`  
**How loaded:**

- `apps/web-mvc/ContentPathHelper.cs` line 16: resolves the absolute path via `env.ContentRootPath`
- `apps/web-mvc/Program.cs` line 48: serves it at `GET /content/poi.v1.json`
- Tests: all e2e specs hit `/content/poi.v1.json` via `request.get()`

**Schema fields (all present in every entry):**

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (slug) | e.g. `"union-square-park"` |
| `name` | string | Display name |
| `summary` | string | One-sentence description |
| `description` | string | Full prose |
| `coords` | `{lat, lng}` | Decimal degrees |
| `neighborhood` | string | |
| `tags` | string[] | e.g. `["architecture","politics"]` |
| `year` | number | Single integer (era anchor) |
| `sources` | object[] | `{title, publisher, url}` — placeholder in v0.1 |
| `images` | object[] | `{url, credit, license}` — placeholder in v0.1 |
| `borough` | string | |
| `area` | string | Cross-street block description |
| `block` | string | |
| `route_id` | string | Groups POIs by named walk route |
| `order` | number | Position within route |

**Current content:** 10+ POIs — Union Square and Flatiron district only. Sources and images are placeholder stubs.

---

## 2. Historical Ready-Asset (Idle — Not Wired In)

### Primary aggregate file

**File:** `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv`  
**Last commit:** `a8c2bcb` 2026-02-07 — `data: relocate historical-data to data/historical`  
**Eras covered:** 1852, 1877, 1902, 1927, 1952, 1977, 2002 (7 eras, ~N POIs each)

**Schema fields (superset of poi.v1.json):**

| Field | Present in poi.v1.json? | Notes |
|-------|------------------------|-------|
| `id` | ✅ | Same slug format |
| `name` | ✅ | |
| `summary` | ✅ | |
| `description` | ✅ | |
| `lat` / `lng` | ✅ (as `coords.lat/lng`) | Flat columns in CSV |
| `borough` | ✅ | |
| `neighborhood` | ✅ | |
| `area` | ✅ | |
| `block` | ✅ | |
| `route_id` | ✅ | |
| `order` | ✅ | |
| `tags` | ✅ | JSON arrays in CSV: `["architecture","politics"]` |
| `year` | ✅ | Single integer |
| `sources` | ✅ | Full URLs (not placeholder) |
| `images` | ✅ | Full Wikimedia URLs (not placeholder) |
| `address_hint` | ❌ | Free-text street hint |
| `bbl` | ❌ | Borough Block Lot identifier (LPC standard) |
| `year_file` | ❌ | Source era filename reference |
| `tile_id` | ❌ | Vector tile grid cell (e.g. `USQ-1852`) |

**Tags observed in historical data:** `architecture`, `politics`, `public-art`, `infrastructure`, `engineering`, `residential`, `education`, `public-space`, `transportation`, `hospitality`, `commerce`

### Per-era files

Location: `data/historical/attractions/{year}/` — one folder per era.

| File pattern | Contents |
|---|---|
| `NYC-Explorer_POIs_UnionSquare-Flatiron_{year}.csv` | POI rows for that era (same schema as era-slice rows in AllYears CSV) |
| `NYC-Explorer_ImageManifest_{year}.json` | Object keyed by POI id → `[{url, credit, license}]` |
| `NYC-Explorer_Provenance_{year}.md` | Provenance notes for that era |

### Supporting files

| File | Purpose |
|------|---------|
| `data/historical/PROVENANCE.csv` | Item-level source notes (`item, notes` columns) |
| `data/historical/README.md` | Import instructions + BBL/events context |
| `data/historical/BBL_Seed_Landmarks.csv` | 15 LPC-confirmed landmarks with block/lot + BBL10 |
| `data/historical/BBL_Seed_Landmarks_Manhattan.csv` | Expanded BBL seed for Manhattan |
| `data/historical/BBL_Seed_Landmarks_Extended.csv` | Further extended BBL set |
| `data/historical/Events_Seed.csv` | 20 verified events (true-crime, performance, LGBTQ, protest, labor) |
| `data/historical/Events_Seed_Deep.csv` | Extended events seed |
| `data/historical/nycx_events_seed.csv` | Events tranche 1 |
| `data/historical/nycx_events_tranche2.csv` | Events tranche 2 |

### BBL format

BBL10 is computed as: `borough(1) + block(5) + lot(4)` — sourced from NYC LPC designation reports.

---

## 3. Runtime Loading — Trace

```
content/poi.v1.json
  └─ ContentPathHelper.cs  resolves absolute path
  └─ Program.cs (line 48)  serves at GET /content/poi.v1.json
  └─ 10+ e2e spec files    all read via request.get('/content/poi.v1.json')
```

No controller, no database — the JSON file is served directly. Any schema extension requires updating `poi.v1.json` and any TypeScript types that consume its shape.

---

## 4. Gaps Blocking Eric MVP Features

| Feature | Required field | Present in poi.v1.json? | Present in historical CSV? |
|---------|---------------|------------------------|---------------------------|
| Time-span filter (e.g. 1850–1900) | `year_start` / `year_end` or `year_range` | ❌ — only single `year` | ❌ — only single `year` |
| Multi-select interest taxonomy | `interests[]` (cultural, ethnic, topical) | ❌ | ❌ — tags are category-based only |
| Era-aware routing | `tile_id`, `route_id` per era | `route_id` ✅ | `route_id` + `tile_id` ✅ |
| BBL lookup | `bbl` | ❌ | ✅ |
| Full provenance sources | `sources[].url` | placeholder | ✅ real URLs |
| Full images | `images[].url` | placeholder | ✅ real Wikimedia URLs |

**Interest taxonomy gap detail:** Current tags (`architecture`, `politics`, etc.) are category-based. No ethnic, cultural, or topical interest taxonomy (e.g. African American history, immigration, labor) exists in any file. This would be a **net-new field** requiring schema extension + data authoring.

---

## 5. Decisions / Recommendations

1. **Use `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv` as the seed** for any runtime expansion — it has real sources, images, and BBL; it is the most complete single-file asset.
2. **Schema extension needed** before wiring historical data into runtime: add `address_hint`, `bbl`, `year_file`, `tile_id` to the JSON schema.
3. **Time-span filter** requires adding `year_start`/`year_end` fields — these do not exist anywhere yet and must be authored alongside the next data tranche.
4. **Interest taxonomy** is a net-new authoring task — no existing field to promote.
5. `poi.v1.json` is the single file to edit for runtime changes today; per-era CSVs are staging assets.

---

## Evidence Artifacts

| Path | Role |
|------|------|
| `content/poi.v1.json` | Runtime source |
| `apps/web-mvc/ContentPathHelper.cs` | Path resolution |
| `apps/web-mvc/Program.cs` | Endpoint registration |
| `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv` | Primary idle ready-asset |
| `data/historical/attractions/1852/NYC-Explorer_POIs_UnionSquare-Flatiron_1852.csv` | Sample era CSV |
| `data/historical/attractions/1852/NYC-Explorer_ImageManifest_1852.json` | Sample image manifest |
| `data/historical/PROVENANCE.csv` | Item-level source notes |
| `data/historical/README.md` | Import instructions |
