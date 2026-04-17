# R-049 — Historical Data Inventory for POI Promotion

| Field | Value |
|-------|-------|
| Date | 2026-04-17 |
| PROMPT-ID | NYCX-HISTORICAL-DATA-INVENTORY-001 |
| Area | Data / POI pipeline |
| Status | Complete |
| Confidence | 90% |
| Evidence Links | `data/historical/`, `content/poi.v1.json`, ResearchIndex R-009–R-023, R-034, R-038 |

## Prior Research Lookup

Searched ResearchIndex.md for historical data entries. Found extensive prior indexing:
- R-009/R-010: PROVENANCE.md/csv (master provenance notes)
- R-011–R-017: Per-era provenance docs (1852–2002, attractions/)
- R-018/R-019: Manhattan and Lower Manhattan scope plans
- R-020: Union Square-Flatiron Research Drop README
- R-021: BBL Lookup Playbook
- R-022/R-023: Historical data README and Copilot guide
- R-034: Attraction data source-of-truth (open)
- R-038: Data promotion v0 — CSV → poi.v1.json (open)

No prior full filesystem inventory exists. R-038 describes the promotion pipeline but does not inventory the raw data.

## Question

What source material exists in `data/historical/` that could generate new POIs beyond the current 10 runtime POIs (Union Square 4 + Flatiron 6)?

## Existing Repo Guidance Summary

### Purpose (from README.md, README_for_Copilot.md)
`data/historical/` is the seed-data directory for NYC Explorer. It holds research drops, BBL-verified landmarks, events, SQL migrations, and provenance records. The data answers two questions: "What was here?" (attractions/landmarks) and "What happened here?" (events with dates/people).

### Quality rules (from README_for_Copilot.md)
- Primary sources > secondary; no invented BBLs
- ≤ 3 attractions per block per era (density cap)
- Provenance required: `source_primary` for critical facts
- Seven snapshot years: 1852, 1877, 1902, 1927, 1952, 1977, 2002
- Interest tags: music, cinema, lgbtq, politics, crime, art, architecture, transport, labor, disaster, sports, literature, media

### Scope (from Manhattan_ScopePlan.md, LowerManhattan_ScopePlan.md)
- Manhattan-wide MN01–MN12 is the long-term vision
- Lower Manhattan MN01–MN03 was the first extension target (FiDi, Tribeca, Greenwich Village, SoHo, East Village, LES, Chinatown, etc.)
- Union Square + Flatiron was the launch focus (MVP v0.1)

### Cautions (from README_for_Copilot.md)
- Never fill BBLs without a cited primary source
- Never infer precise coordinates from vague addresses
- `_legacy/` contains duplicates relocated from root (do not use directly)
- SQL files target a canonical schema that does not match the current runtime `poi.v1.json` format

## Current `data/historical` Structure Summary

**Total files:** 74 (across root, `attractions/`, `_legacy/`)

### Top-level (33 files)
| Category | Files | Description |
|----------|-------|-------------|
| Scope plans | `Manhattan_ScopePlan.md`, `LowerManhattan_ScopePlan_20251031-141045.md` | Planning docs for Manhattan-wide and Lower Manhattan coverage |
| READMEs | `README.md`, `README_for_Copilot.md`, `UnionSquare-Flatiron_ResearchDrop_README.md` | Orientation and data-rules documentation |
| Provenance | `PROVENANCE.md`, `PROVENANCE.csv` | Master source citations for landmarks and events |
| Aggregated POI CSVs | `NYC-Explorer_POIs_AllYears_withBBL.csv` (42 rows), `POIs_AllYears_withBBL_andTiles.csv` (42 rows) | All 7 eras of Union Square + Flatiron POIs combined, with BBL and tile_id |
| Events CSVs | `Events_Seed.csv` (20), `Events_Seed_Deep.csv` (16), `Events_withBBL_andTiles.csv` (14), `NYC-Explorer_Events_withBBL.csv` (14), `nycx_events_seed.csv` (88), `nycx_events_tranche2.csv` (38), `nycx_events_backlog_seed.csv` (13) | Multiple event collections with varying coverage and verification status |
| BBL landmark seeds | `BBL_Seed_Landmarks.csv` (64 rows), `BBL_Seed_Landmarks_Extended.csv` (32), `BBL_Seed_Landmarks_Manhattan.csv` (32) | Landmark records with BBL verification status |
| Backlog | `nycx_landmarks_backlog.csv` (20 rows) | Landmarks needing verification |
| SQL files | `nycx_schema.sql`, `nycx_seed.sql`, `nycx_seed_landmarks_bbl.sql`, `nycx_events_seed.sql`, `nycx_manhattan_seed.sql`, `nycx_migrations.sql`, `nycx_update_tiles.sql` | Database schema and seed scripts (not runtime-relevant for current JSON-based app) |
| Excel workbooks | `Manhattan_Templates.xlsx`, `LowerManhattan_Templates_20251031-141045.xlsx`, `NYCX_DB_Checklist.xlsx` | Research tracking spreadsheets |
| Manifest | `MANIFEST_nycx_tranche2.txt` | Tranche 2 bundle contents |
| Playbook | `BBL_Lookup_Playbook.md` | BBL verification workflow |

### attractions/ (21 files, 7 subdirectories)
One subdirectory per era (1852, 1877, 1902, 1927, 1952, 1977, 2002). Each contains:
- `NYC-Explorer_POIs_UnionSquare-Flatiron_<YEAR>.csv` — 6 POIs per era (Union Square + Flatiron only)
- `NYC-Explorer_ImageManifest_<YEAR>.json` — image links for those POIs
- `NYC-Explorer_Provenance_<YEAR>.md` — per-era source citations

Total: 42 POIs across 7 eras, all within Union Square + Flatiron.

### _legacy/ (21 files)
`root-duplicates-2026-02-07/` — exact copies of the per-era files that were relocated from the repo root into `attractions/`. Contains 7 POI CSVs, 7 image manifests, 7 provenance docs. **Do not use** — these are the originals before the reorganization.

## Promising POI-Source Candidates

### Tier 1 — Highest potential (structured, Manhattan-wide, closest to POI-ready)

1. **`BBL_Seed_Landmarks.csv`** (64 rows, 31 neighborhoods)
   - 16 verified, 48 needs_verification
   - Covers: Financial District, Greenwich Village, East Village, Chelsea, Harlem, Upper East/West Side, Midtown, Inwood, Washington Heights, Murray Hill, and more
   - Fields: name, address, cd_id, neighborhood, block, lot, bbl10, lat, lng, status, sources
   - **Gap:** No `year`, `summary`, `description`, `tags`, `route_id` — would need enrichment before promotion to poi.v1.json format

2. **`BBL_Seed_Landmarks_Extended.csv`** (32 rows, Lower Manhattan neighborhoods)
   - All `needs_verification` status
   - Covers: Stonewall Inn, Federal Hall, Trinity Church, NYSE, Woolworth Building, Cooper Union, Tenement Museum, etc.
   - These are high-profile landmarks with strong provenance potential
   - **Gap:** Same as above — needs enrichment

3. **`nycx_events_seed.csv`** (88 rows, broadest event collection)
   - Covers events across Manhattan with dates, people, blurbs, source citations
   - Categories: lgbtq, protest, music, crime, labor, art, performance
   - **Gap:** Events are not currently modeled in poi.v1.json; would need schema decision

### Tier 2 — Good potential (partially structured, needs work)

4. **`Events_Seed_Deep.csv`** (16 rows)
   - Deeper event entries with interest_tags, blurbs, source notes
   - Locations: Cafe Society, Club 57, Paradise Garage, SoHo lofts, Washington Square Park
   - **Gap:** Sparse provenance ("Primary sources to be cited")

5. **`nycx_events_tranche2.csv`** (38 rows, MN01–MN12)
   - Tranche 2 events with primary + secondary source columns
   - **Gap:** Many `needs_verification`

6. **`BBL_Seed_Landmarks_Manhattan.csv`** (32 rows)
   - Manhattan-wide landmark candidates (Chelsea, Hudson Yards, etc.)
   - All `needs_verification`
   - Includes: Hotel Chelsea, The High Line, The Shed, The Vessel

### Tier 3 — Reference/infrastructure (not directly promotable)

7. **`nycx_events_backlog_seed.csv`** (13 rows) — backlog with minimal fields
8. **SQL files** — target a different schema than current runtime
9. **Excel workbooks** — tracking/planning, not data
10. **Aggregated AllYears CSVs** — Union Square + Flatiron only (already represented in runtime)

## Areas Represented Beyond Launch Focus

The current launch focus is **Union Square + Flatiron** (10 runtime POIs).

From `BBL_Seed_Landmarks.csv` (64 rows across 31 neighborhoods):
- **Lower Manhattan (MN01–MN03):** Financial District, Greenwich Village, East Village, SoHo, NoHo, LES, Chinatown, Bowery, Nolita, Little Italy, Civic Center
- **Midtown (MN04–MN06):** Chelsea, Hudson Yards, Midtown, Murray Hill, Turtle Bay, Gramercy, Bryant Park, Rockefeller Center
- **Upper Manhattan (MN07–MN12):** Upper East Side, Upper West Side, Lincoln Square, Yorkville, Central Harlem, East Harlem, Morningside Heights, Washington Heights, Inwood

This is effectively all of Manhattan (MN01–MN12) with at least some landmark representation.

## Risks / Gaps / Unknowns

### Verification gaps
- 48 of 64 landmarks in `BBL_Seed_Landmarks.csv` are `needs_verification`
- All 32 rows in `BBL_Seed_Landmarks_Extended.csv` and `BBL_Seed_Landmarks_Manhattan.csv` are `needs_verification`
- Many event rows have `needs_verification = 1` and sparse source citations

### Schema gap
- Historical data uses a SQL Server schema (landmarks + events tables with BBL, block, lot, cd_id, tile_id)
- Runtime uses `poi.v1.json` with a flat JSON array (id, name, summary, description, lat, lng, neighborhood, tags, year, etc.)
- No automated promotion pipeline exists; R-038 describes the concept but is still Open
- Events have no runtime representation at all

### Duplicate/legacy materials
- `_legacy/root-duplicates-2026-02-07/` (21 files) — confirmed duplicates, safe to ignore
- Multiple overlapping event CSVs (Events_Seed.csv, Events_Seed_Deep.csv, nycx_events_seed.csv, nycx_events_backlog_seed.csv) — unclear which is the latest/most complete
- `NYC-Explorer_POIs_AllYears_withBBL.csv` and `POIs_AllYears_withBBL_andTiles.csv` appear to be identical copies with tile_id added to the second

### Enrichment gap
- Landmark seeds have location data but lack `summary`, `description`, `tags`, `year`, `route_id`, `sources` (full JSON), `images` — all required by poi.v1.json
- Converting a BBL seed landmark to a runtime POI requires significant per-item research and writing

### Provenance standards
- Some event records cite "Wikipedia" or "press" as sources without specific URLs
- The quality bar (README_for_Copilot.md) requires `source_primary` for critical facts
- Older seed files may not meet the current provenance standard

## Suggested Next Actions

1. **Decide on neighborhood expansion order.** The BBL_Seed_Landmarks.csv covers all of Manhattan. A natural next expansion could be Lower Manhattan (MN01–MN03) where the Extended landmarks file and scope plan already exist.

2. **Resolve the event data model question.** Events (88+ rows in nycx_events_seed.csv) are a large untapped dataset but have no runtime schema in poi.v1.json. Decide whether to model events as a new type or fold them into the POI schema.

3. **Prioritize the BBL_Seed_Landmarks_Extended.csv (32 Lower Manhattan landmarks).** These are high-profile (Stonewall, Federal Hall, Trinity Church, NYSE) with strong provenance potential. Enriching even 5–10 of these into poi.v1.json format would significantly expand coverage.

4. **Consolidate event CSVs.** There are at least 5 overlapping event files. A merge/dedup would clarify the actual event inventory.

5. **Build or specify the promotion pipeline.** R-038 (Data promotion v0) is Open. Completing it would formalize how BBL seed rows become runtime POIs.

## Recommended First Candidate for Future Reconnaissance

**Lower Manhattan landmark enrichment** — specifically the `BBL_Seed_Landmarks_Extended.csv` (32 rows, verified + needs_verification mix). The Lower Manhattan scope plan (R-019) already exists, the landmarks are high-profile and well-documented, and the neighborhood set (FiDi, Greenwich Village, East Village, SoHo, LES) is the natural next ring out from Union Square + Flatiron.

A focused spike or story could take the top 5–10 verified landmarks, enrich them with summary/description/tags/sources/images, and produce a batch of poi.v1.json-compatible entries ready for promotion.

## Confidence Statement

- **Confidence:** 90%
- **Basis:** Full filesystem inventory completed, all key docs read, row counts verified, neighborhoods enumerated. Enrichment effort estimates are approximate — actual work depends on per-item research depth.
- **Ready to proceed:** YES — sufficient for story planning and prioritization.
