# R-044 — Content Model and Storage Decision Rules

**R-ID:** R-044
**Date:** 2026-03-05
**Type:** Decision Record
**Status:** Open
**Builds on:** R-034, R-036, R-037, R-038, R-040, R-041, R-043
**EPICS reference:** EPIC-001 MVP v0.1 DoD, EPIC-004 Historical TimeWalk

---

## Evidence Basis (commands run)

```powershell
# AllYears CSV: 42 rows × 7 eras (1852–2002); bbl=0/42 empty, lat=42/42, tile_id=42/42
# poi.v1.json: 10 records; fields: id, name, summary, description, coords{lat,lng},
#   neighborhood, tags[], year, sources[], images[], borough, area, block, route_id, order
# Events_Seed.csv: interest_tags comma-delimited; power field 1–3
# Events_withBBL_andTiles.csv: categories[] JSON array; tile_id; start_date + end_date
# Multi-incarnation scan: "Madison Square Park" = 5 eras; "Equestrian Statue of George Washington" = 5 eras
# AllYears tag set: architecture, celebrity, commerce, culture, education, engineering,
#   hospitality, infrastructure, music, politics, public-art, public-space, residential,
#   scandal, theatre, transportation
# Events interest_tags: 55+ distinct values including LGBTQ, labor, protest, jazz, aids, etc.
```

---

## Section 1 — Decision Summary

### What MVP v0.1 needs from the data model

| Need | Justification | Source |
|------|--------------|--------|
| Optional time filter (single `year` tolerance OK for v0.1) | Eric story requires date-span narrowing | R-036, R-041 |
| Optional interests filter (OR, flat 14-value list for v0.1) | Eric story requires multi-topic selection | R-037, R-041 |
| Physical location anchor (lat/lng required; BBL optional for MVP) | Map pins are geographic units | R-041 L1–L4 |
| Stable `id` slug per record | Route stability, deep links | R-038, R-041 |
| `sources[]` with ≥1 real citation URL | Source-quality ranking signal | R-041 R4 |
| Real images (Wikimedia / PD) for promoted POIs | "More info" UX | R-034 |
| `route_id` / `order` (route-ordered list) | Along-route corridor query | R-040 |
| `tags[]` (internal classification, existing) | Schema tests; do not rename | R-034, R-037 |

### What MVP v0.1 explicitly does NOT need yet

| Excluded item | Why | EPICS reference |
|--------------|-----|----------------|
| `year_start` / `year_end` columns | Option A (tolerance on single `year`) is sufficient for v0.1; authoring is required | EPIC-001 §5 Non-goals |
| `interests[]` field in CSV/JSON | Authoring sprint required before field is useful; add field in same sprint | R-037 §4 |
| BBL population | 0/42 rows have BBL today; fill as enrichment pass; not required for POI card display | R-034, R-038 |
| Place/Event join key | No clean join exists yet; manual `poi-interest-tags.csv` is the recommended bridge | R-038 §3 |
| Offline data / service worker caching | EPIC-001 §5 explicitly excludes offline | R-042 |
| CMS or authoring UI | Not in scope until EPIC-004 | EPIC-001 §5 |
| DB (any engine) | File-first is correct now; see §6 for triggers | §6 below |
| Deep hierarchy in UI | DAG is a data-layer concern; UI presents flat 14-value list in v0.1 | R-041 T6 |
| Power/importance field on POIs | Only Events CSV has `power` field; POIs need authoring; not blocking v0.1 filters | R-043 §4.4 |

---

## Section 2 — Content Entity Model

### 2.1 Core concepts

| Concept | Definition | MVP representation |
|---------|-----------|-------------------|
| **POI card** | The thing the user taps on the map. Has a location, name, summary, and optional interest tags. | One row in `poi.v1.json` |
| **Place** | Stable physical site that persists over time (may change name or use). Anchored by lat/lng; BBL when available. | Represented by `{lat,lng}` + `id` slug in current data |
| **Event** | A happening at a Place — with a date, people, and thematic interest. Lives in Events CSVs today. Not yet in `poi.v1.json`. | `Events_Seed.csv` row, separate from POI runtime data |
| **Incarnation** | A Place in a specific era. "Madison Square Park 1852" and "Madison Square Park 1927" are the same Place, different Incarnations. | Represented by `id = name-YYYY` pattern in AllYears CSV (e.g. `union-square-park-1852`) |

### 2.2 Multi-incarnation evidence (repo-grounded)

Top repeated names in `NYC-Explorer_POIs_AllYears_withBBL.csv`:

| Name | Eras present | Pattern |
|------|-------------|---------|
| Equestrian Statue of George Washington | 1877, 1902, 1927, 1952, 1977 | Same object, same coords — pure Incarnation |
| Madison Square Park | 1852, 1902, 1927, 1952, 1977 | Same Place, changes over time |
| General William Jenkins Worth Monument | 1902, 1927, 1952, 1977 | Same object, stable |
| Statue of Marquis de Lafayette | 1877, 1902, 1927, 1952 | Same object |
| Flatiron Building | 1902, 2002 | Same building, two era appearances |

The row IDs encode era: `union-square-park-1852`, `union-square-park-1902` — two different Incarnation IDs for the same Place.

### 2.3 "Same place, different events" vs "Place moved over time"

Two distinct patterns arise in the data:

**Pattern A — Same physical site, different events at different times:**
- Example: Union Square Park hosts Civil War rallies (1861), labor protests (1882), suffrage marches (1915)
- Model: One `place_id` → many `event_id` rows, each with own date + interest_tags
- Current state: Events CSVs have `place_name` + `lat/lng` but no `place_id` foreign key

**Pattern B — Same place slug, different incarnations (multi-era):**
- Example: `union-square-park-1852` vs `union-square-park-1902` — same park, different era narratives
- Current state: Represented as separate rows in AllYears CSV with `year` column
- `lat/lng` coordinates are the same (or near-identical) across incarnations for physical objects

### 2.4 Option A vs Option B: MVP recommendation

**Option A — Flattened POI-only (recommended for MVP v0.1)**

All records (Places, Events, Incarnations) are represented as POI-card JSON objects in `poi.v1.json`. No separate entity tables.

- Pros:
  - Zero schema migration required
  - Existing e2e suite and schema tests remain valid
  - `promote-pois.ts` script reads one CSV → writes one JSON
  - Along-route Turf.js filter (R-043 Option 2) works on POI cards with `coords`
- Cons:
  - Multi-incarnation = multiple JSON objects with near-duplicate data
  - Event dates not separately indexable (use `year` as a point-in-time proxy)
  - Place/Event relationship is implicit (shared `lat/lng` and name substring)
- Evidence: 10/10 current `poi.v1.json` entries are flat. Schema tests expect flat array. Changing to nested entity model now would require substantial test refactoring.

**Option B — Place + Event split (post-MVP)**

Two entity types: `Place` records (physical sites) and `Event` records (happenings linked to a Place via `place_id`). Requires restructuring the runtime JSON and all schema tests.

- Deferred trigger: when Event filter (by date + interest) is the primary UX, and users distinguish "see events at this place" from "see the place itself"
- At that point: Option B becomes the correct model (EPIC-004 territory)

**Decision: Option A for MVP v0.1. Plan Option B migration when EPIC-004 is in scope.**

Justification: The current `poi.v1.json` shape already passes all schema + e2e tests. Option A requires no schema churn. Option B would invalidate 10 e2e specs without delivering user-facing value in v0.1. R-036 §4 "DECISION NEEDED" items confirm the Place/Event split is explicitly deferred.

---

## Section 3 — Time Model (Practical, Incremental)

### 3.1 MVP: filtering with single `year` (Option A — tolerance)

Current state: every record has a single `year` integer (e.g. `1902`). No `year_start` / `year_end` exists anywhere.

Filter rule (no schema change required):
```
show POI if: user_span_start <= poi.year <= user_span_end
```

Example: user selects 1880–1920 → show POIs with `year` in {1902} from AllYears CSV.

Coverage: AllYears CSV has 7 era anchors: 1852, 1877, 1902, 1927, 1952, 1977, 2002. Any date-span that includes at least one era anchor will return results.

Limitation: A building standing 1877–1952 appears in 4 era rows but filtered independently. The user sees multiple cards for the same structure if they select a wide date range. This is acceptable for v0.1; it can be collapsed later (see §3.2).

### 3.2 Next: adding `year_start` / `year_end` (Option B)

Trigger: when users report confusion from duplicate cards, or when a date-slider UX is designed.

Schema change:
```json
{ "year_start": 1877, "year_end": 1952, ... }
```

Filter rule changes to standard interval overlap:
```
show POI if: poi.year_start <= user_span_end AND poi.year_end >= user_span_start
```

Authoring: AllYears CSV multi-incarnation scan (§2.2) already identifies which POIs span multiple eras — that data can seed `year_start`/`year_end` authoring.

### 3.3 Progressively narrower ranges (future)

As content coverage expands beyond 7 era-anchors into contiguous-year coverage,
the time model would support:
- Decade ranges (1890s slider)
- Exact year (full TimeWalk product — EPIC-004)
- `year_start` / `year_end` with fractional certainty (e.g., `year_confidence: 0.8`)

These are additive schema extensions — they do not break existing records with only `year`.

---

## Section 4 — Interest Taxonomy Model

### 4.1 Chosen model: flat slug list with DAG data layer

**For v0.1 UI:** Present the 14 R-037 values as a flat filterable list. No hierarchy shown to user.

**Data layer (for future DAG):** Each slug has a declared `parents[]` list. Parent selection includes all descendant slugs when filtering. The current 14 values are already structured to support this:

```
music-nightlife → [ jazz, rock, folk, nightlife, performance ]   (children)
protest-activism → [ labor-history, politics-civic, free-speech ] (overlaps)
```

This is a documentation constraint only — no code implementation in v0.1.

### 4.2 Slug format rules (binding for all future authoring)

From R-037 §4 (authoritative):

| Rule | Value |
|------|-------|
| Format | Lowercase, hyphen-separated |
| Examples | `lgbtq-history`, `african-american-history`, `music-nightlife` |
| Forbidden | Spaces, underscores, camelCase |
| Max values per POI | 3 (authoring cap; not enforced in schema for MVP) |
| Min values per event | 1 (per R-041 T3: no untagged events in production) |
| Multi-select default | OR (R-041 T2) |

### 4.3 Taxonomy v0 — 14 values (from R-037 §2)

| Slug | Display label | Data coverage | Authoring status |
|------|--------------|--------------|-----------------|
| `lgbtq-history` | LGBTQ History | 10+ events (LGBTQ, pride, aids) | ✅ Events exist; POI tagging needed |
| `labor-history` | Labor & Workers' Rights | Triangle fire, Tompkins riots | ✅ Events exist |
| `politics-civic` | Politics & Civic History | politics (POI + Events) | ✅ Both sources |
| `public-art` | Public Art & Monuments | 24 hits in AllYears | ✅ Existing POI tags |
| `architecture` | Architecture & Landmarks | 18–24 combined | ✅ Existing POI tags |
| `music-nightlife` | Music & Nightlife | jazz, rock, folk (Events) | ✅ Events; POI coverage thin |
| `arts-bohemia` | Arts & Bohemian Culture | bohemia, underground (Events) | ✅ Events |
| `crime-scandal` | Crime & Scandal | scandal, true-crime (both) | ✅ Both sources |
| `commerce-industry` | Commerce & Industry | commerce, infrastructure | ✅ Existing POIs |
| `protest-activism` | Protest & Free Expression | activism, protest (Events) | ✅ Events |
| `african-american-history` | African American History | 2 adjacent events only | ⚠️ Requires net-new authoring |
| `irish-history` | Irish History & Immigration | 0 signals | ❌ Requires net-new authoring |
| `immigration` | Immigration & Ethnic Communities | german-american, latinx (3) | ⚠️ Partial authoring needed |
| `19th-century-history` | 19th Century NYC | 1852–1877 era coverage | ⚠️ No explicit interest tagging yet |

### 4.4 Current coverage gap (binding constraint)

- POIs (`poi.v1.json` and AllYears CSV) have NO `interests[]` field today
- Events CSVs have `interest_tags` / `categories` but are NOT in the runtime JSON
- **Both require authoring before any interest filter is functional**
- The data sets do NOT contain sufficient cultural/topic labels to generate `interests[]` automatically — human authoring is required for every interest-bearing record

### 4.5 Smallest taxonomy artifact to introduce next

**Do not create a new file in this research pass.** The recommended next artifact is:

A `data/historical/poi-interest-tags.csv` mapping file (columns: `poi_id, interest_slugs`) — authored by hand, used by the promotion script. This was recommended in R-038 §3, Strategy A.

This file does not yet exist; creating it is the first authoring sprint task, not a research task.

---

## Section 5 — Ranking / Prioritization Hooks

### 5.1 Agreed ranking drivers (from R-041 R2–R5)

| Driver | Description | Current data support |
|--------|-------------|---------------------|
| **Route proximity** | Along-route perpendicular distance from polyline (Turf.js `nearestPointOnLine`) | `lat/lng` present in all POIs; polyline returned by provider (R-043 §1.2) |
| **Source quality** | ≥1 real citation URL in `sources[]` (binary signal for v0.1) | AllYears CSV has real Wikimedia/Wikipedia URLs; poi.v1.json has placeholder stubs |
| **Topic match** | # of user-selected interest slugs that match the POI's `interests[]` | No `interests[]` field yet; authoring required |

### 5.2 Detour cost units

Per R-036 and R-041, detour cost is expressed in **blocks** for user display and **meters** internally:

| Unit | Value | Use |
|------|-------|-----|
| Internal threshold | 320 m default (conservative: 280 m; liberal: 400 m) | Turf.js filter |
| User display | "~2 blocks" or "~4 min walk" | UI label |
| Rationale | Manhattan block ≈ 80 m N-S / 274 m E-W; 320 m ≈ 1 E-W block + change | R-040 Appendix |

### 5.3 Proposed numeric fields (add later, do not implement in v0.1)

| Field | Type | Range | Purpose |
|-------|------|-------|---------|
| `poi_value` | int | 1–3 | Editorial importance (parallel to Events `power` field; same 3-level scale) |
| `evidence_confidence` | float | 0.0–1.0 | Confidence in factual claims; 1.0 = primary source verified |
| `popularity_stub` | int | 0–N | View count or save count placeholder; starts at 0; enables future ranking |

These fields are purely additive — they can be appended to `poi.v1.json` schema without breaking existing tests (the schema uses `additionalProperties: false` only if explicitly declared; confirmation needed before adding).

---

## Section 6 — "When Do We Move to a DB?" Decision Rules

### 6.1 Current stage: Stage 0 — File-first

**State:** `content/poi.v1.json` (10 POIs) served directly by ASP.NET Core static file handler. No DB, no ORM, no query engine.

**Why file-first is correct right now:**
- 10–50 POIs fit in a single JSON file load (<50 KB)
- Schema tests validate structure deterministically
- Zero infrastructure to provision or maintain
- Any contributor can edit the CSV authoring source and re-run promote script
- Evidence: `Program.cs` line 48 serves the JSON at `GET /content/poi.v1.json` — no controller, no DB query

### 6.2 Staged path

**Stage 0 — File-first (current)**
- Source: AllYears CSV (canonical, author here)
- Generated: `content/poi.v1.json` (promote script output)
- Query: client-side filter in JS (`route-bootstrap.js`, Turf.js)
- Tests: `tests/schema/poi.spec.ts` validates generated JSON
- Gate to Stage 1: see thresholds below

**Stage 1 — File-first + generated query index (still files)**
- Source: AllYears CSV + poi-interest-tags.csv + (future) events-with-place.csv
- Generated: `content/poi.v1.json` (full promoted set); optionally a secondary `content/poi-index.json` (pre-built era/interest buckets for fast client filtering)
- Query: client-side filter reads pre-bucketed index; avoids scanning all POIs
- Tests: schema test covers both generated files
- Gate to Stage 2: see thresholds below

**Stage 2 — DB as source-of-truth**
- DB engine: SQLite for single-server MVP; PostgreSQL + PostGIS for multi-author / geospatial queries
- Source: CSV files become the *import* format; DB becomes the canonical runtime source
- Query: ASP.NET Core controller runs SQL; Turf.js corridor filter moves server-side to PostGIS `ST_DWithin`
- Tests: integration tests against DB; e2e tests still hit HTTP API (unchanged contract)
- Appropriate when: archived Stack ADR recommends PostgreSQL + PostGIS + OSRM/Valhalla (EPIC-004 territory)

### 6.3 DB transition triggers (concrete thresholds)

Move to **Stage 1** when ANY of:

| Trigger | Threshold | Rationale |
|---------|-----------|-----------|
| POI count | > 200 records in `poi.v1.json` | Client-side filter over >200 items becomes noticeable; pre-bucketed index resolves this |
| Era × interest combinations | > 50 distinct filter paths | JS switch-case logic becomes unmaintainable |
| Build friction | Promotion script takes > 5 seconds or requires manual steps | Index generation should be automated; file complexity = signal |
| Multi-author edits | > 1 concurrent author editing CSVs | File conflicts are acceptable for 1 author; not for 2+ |

Move to **Stage 2** when ANY of:

| Trigger | Threshold | Rationale |
|---------|-----------|-----------|
| POI + Event records | > 500 total (POIs + events combined) | Single JSON file approaches 500 KB; HTTP payload becomes noticeable on mobile |
| Query complexity | Time overlap + interest hierarchy + route-corridor simultaneously required | Three-way filter is impractical in client JS; PostGIS handles all three natively |
| Geospatial accuracy required | True street-walk distance (not Turf.js proxy) | Requires OSRM/Valhalla + PostGIS; can't be done in files |
| Multi-author or CMS | Editors need concurrent write access | File-based round-trips become bottleneck |
| CI query time | e2e route integration tests exceed 10 s | DB with indexes is ~100× faster than full-file filter at scale |

### 6.4 "Don't paint into a corner" constraints

These rules must be maintained at every stage to ensure migration is non-destructive:

| Constraint | Rule | Evidence |
|------------|------|---------|
| **Stable IDs** | `id` slugs in `poi.v1.json` must never change once published. Add a redirect map if any ID needs retirement. | Deep links, e2e `data-testid` selectors depend on stable IDs |
| **Deterministic promotion** | The promote script must be idempotent: same CSV input → identical JSON output. No random ordering, no timestamp-dependent fields. | Required for CI reproducibility; `git diff` on generated JSON must be empty when source is unchanged |
| **Validation gates** | Generated `poi.v1.json` must pass schema tests before any commit. Promotion without validation = blocked. | `tests/schema/poi.spec.ts` already enforces this for current JSON |
| **Additive-first schema changes** | New fields must be optional in the schema (nullable / default). Never remove or rename existing fields without a migration + version bump. | Breaking change = broken e2e tests + broken client JS |
| **No ID reuse** | Retired POI IDs must be tombstoned, not recycled. Old IDs return 404 + a link to the replacement. | Prevents stale deep links from routing to wrong content |
| **CSV is not the DB** | Once Stage 2 is reached, the CSV becomes an import format (not the edit surface). Document this transition explicitly to avoid dual-source confusion. | R-038 §1 proposes this model |

---

## Section 7 — Open Questions (ranked by urgency)

| # | Question | Urgency | Blocks |
|---|---------|---------|--------|
| Q1 | When does the `poi-interest-tags.csv` authoring sprint start? (This is the critical path for interest filter.) | HIGH | Interest filter UX; topic-match ranking |
| Q2 | Schema change for `interests[]` field: confirm `additionalProperties` behavior in existing schema test before adding field. | HIGH | Adding field without breaking schema tests |
| Q3 | `power` / `poi_value` field: use same 1–3 scale as Events `power`? Or a different scale? Must be decided before authoring starts. | MEDIUM | Weighted ranking (R-041 R2) |
| Q4 | Event → POI join: authorize Strategy A (`poi-interest-tags.csv` manual map) vs deferring until BBL population pass? | MEDIUM | Decides whether events and POIs can be co-filtered |
| Q5 | `year_start` / `year_end`: can the multi-incarnation deduplication be handled by checking same `lat/lng` within tolerance, or does it require manual authoring per POI? | MEDIUM | Time-filter accuracy; multi-era display |
| Q6 | When do Events CSVs get promoted into the runtime JSON? Do they become POI cards, or a separate `/content/events.v1.json` endpoint? | MEDIUM | Determines whether Event model requires Option B (Place + Event split) |
| Q7 | Is SQLite a viable Stage 2 intermediate (before PostGIS)? Or should Stage 2 go directly to PostgreSQL + PostGIS to avoid a second migration? | LOW | Long-term architecture; not blocking v0.1 |
| Q8 | `tile_id` values (`LM-R01C01` through `LM-R04C04`) exist in AllYears CSV but not in `poi.v1.json`. Should they be promoted? If so, what is the display meaning to the user? | LOW | Block-level density capping (EPIC-004); route corridor (R-043 §5.3) |

---

## WEB-RESEARCH NEEDED

The following items require external lookup before implementation decisions are made. Do not guess.

| Item | Why |
|------|-----|
| SQLite + EF Core spatial extensions: does `Microsoft.EntityFrameworkCore.Sqlite` support geospatial queries comparable to PostGIS `ST_DWithin`? | Determines whether Stage 2 can start with SQLite or must go straight to PostgreSQL + PostGIS |
| JSON Schema `additionalProperties` behavior: does the existing `tests/schema/poi.spec.ts` use `additionalProperties: false`? | Must verify before adding `interests[]` or `poi_value` fields — adding them would break tests if `additionalProperties: false` is set |
| Nominatim / Pelias licensing for geocoding: is there a cost or usage limit for the geocoding provider? | Relevant to G3 decision in R-041 (geocoding provider selection) |
