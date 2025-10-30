# Project History — Micro Log (v0.1)

**Purpose:** Human-readable per-story context. Append after GREEN.

**Rules:**
- New entries: **newest on top**
- Keep ≤4 lines per entry
- Format: see template below

---

## Template
```
### [YYYY-MM-DD] STORY-ID — Short title
In order to <goal>, I <change>.
Considerations: <tech-debt/risks/gotchas>.
Evidence: #tests=<N>, green=<true|false>
Files: main files touched (e.g., Program.cs, leaflet.spec.ts)
Next: <next step>
```

---

## History (newest first)

### Sprint 02

### [2025-10-31] SEARCH-1 — Client-side POI filter
In order to find POIs quickly, I added search input that filters POI list by name (case-insensitive); uses render() function to update list dynamically.
Considerations: Map markers unchanged (all remain visible); filter only affects list; uses includes() for substring match; 300ms timeout in test for DOM update.
Evidence: #tests=11, green=true; typecheck=0 errors
Files: apps/web-mvc/Program.cs (+13 LOC to home page), tests/e2e/search.spec.ts (new, 48 LOC), docs/selectors.md (+1 LOC)
Next: DATA-5 (expand to 10 POIs)

### [2025-10-30] VIS-1 — Map screenshot visual smoke
In order to have visual regression baseline, I added test that captures #map screenshot to docs/artifacts/VIS-1/P14-map.png (533KB).
Considerations: Uses 1s timeout for Leaflet tile loading; screenshot stored in git; can be used for manual visual checks.
Evidence: #tests=10, green=true; artifact exists
Files: tests/e2e/vis-map.spec.ts (new, 24 LOC), docs/artifacts/VIS-1/P14-map.png (new)
Next: SEARCH-1 (client-side filter) or DATA-5 (expand POI content)

### [2025-10-30] DETAIL-1 — Render POI summary and sources
In order to show richer POI content, I extended /poi/{id} to parse and render summary (#poi-summary) and sources list (≥1 [data-testid="poi-source"]).
Considerations: Inline HTML generation with string concatenation; all source properties (title, url, publisher) rendered in list items.
Evidence: #tests=8, green=true; typecheck=0 errors
Files: apps/web-mvc/Program.cs (+14 LOC to /poi/{id} handler), tests/e2e/detail-page.spec.ts (new, 29 LOC)
Next: ROUTE-2 (handle 404 edge cases) or SEARCH-1 (client-side filter)

### [2025-10-30] ROUTE-1 — POI detail page routing
In order to view full POI details, I added /poi/{id} route that reads JSON, finds POI by id, returns HTML with #poi-title and back-to-map link; 404 for missing IDs.
Considerations: Using System.Text.Json for minimal parsing; inline HTML (no Razor yet); same JSON path pattern as API endpoint.
Evidence: #tests=7, green=true; typecheck=0 errors
Files: apps/web-mvc/Program.cs (+30 LOC), tests/e2e/route-detail.spec.ts (new, 30 LOC)
Next: DETAIL-1 (render full POI content on detail page)

### [2025-10-30] SCHEMA-TYPES — Shared Zod schema + TypeScript type
In order to prevent property name drift (like coords/coordinates), I created poi.schema.ts exporting zPOI and POI type, matching existing schema exactly.
Considerations: Single source of truth; all code should import POI type from this module; matched existing schema including block field and z.enum for area.
Evidence: #tests=5, green=true; typecheck=0 errors
Files: tests/schema/poi.schema.ts (new, 32 LOC), tests/types/poi-type.spec.ts (imports it)
Next: Begin feature work—ROUTE-1 (POI detail page routing)

### [2025-10-30] REFAC-TS-1 — Legitimize strict catch typing
In order to keep strict TypeScript, I accepted the `error as Error` assertion in probe.spec.ts as a standalone refactor.
Considerations: Maintain strict mode; no tsconfig loosening; future tests should type catch vars explicitly.
Evidence: #tests=5, green=true; typecheck=0 errors
Files: tests/e2e/probe.spec.ts (1 line added in TOOL-2b, now documented)
Next: SCHEMA-TYPES

### [2025-10-30] DOC-2 — Sprint 02 Plan document
In order to provide single-page sprint context and enforce read order, I created Sprint-02-Plan.md (backlog, DoD, constraints, risks) and updated Copilot-Instructions to read it after Project.md.
Considerations: Plan includes preflight stories (TOOL-1/2 ✅, SCHEMA-TYPES) before feature work; dependency graph in Precedence section.
Evidence: #tests=0, green=NA
Files: docs/Sprint-02-Plan.md (new, 80 LOC), docs/Copilot-Instructions.md
Next: Generate TS types from Zod schema (SCHEMA-TYPES)

### [2025-10-30] TOOL-2b — Fix TypeScript type errors
In order to achieve zero typecheck errors, I installed @types/node, added skipLibCheck to tsconfig, and fixed error typing in probe.spec.ts.
Considerations: skipLibCheck reduces compile time but may hide library issues; type assertion pattern established.
Evidence: #tests=5, green=true
Files: package.json, tsconfig.json, tests/e2e/probe.spec.ts
Next: Generate TS types from Zod schema (SCHEMA-TYPES)

_No earlier Sprint 02 entries yet._

### Sprint 01

### [2025-10-30] DOC-1 — Project history micro-log
In order to provide human-readable context for each story, I created project-history.md with ≤5-line template and updated Copilot-Instructions to require micro-entry after GREEN.
Considerations: Template format may evolve; complements machine-readable code-review.md.
Evidence: #tests=0, green=NA
Files: docs/project-history.md (new), docs/Copilot-Instructions.md
Next: Continue with TOOL-2b (@types/node installation)

### [2025-10-30] TOOL-2a — TypeScript typecheck infrastructure
In order to catch type errors early and eliminate ambient type warnings, I added TypeScript compiler and npm run typecheck script.
Considerations: Currently RED with 109 errors due to missing @types/node; will fix in TOOL-2b.
Evidence: #tests=0, green=false
Files: package.json, tsconfig.json (new)
Next: Install @types/node to turn typecheck GREEN

### [2025-10-30] TOOL-1b — Playwright auto-start server
In order to remove Sprint 01's #1 friction point (manual server lifecycle), I configured Playwright webServer to auto-start/stop ASP.NET server.
Considerations: 120s timeout may need tuning; reuseExistingServer=true allows dev workflow.
Evidence: #tests=5, green=true
Files: playwright.config.ts (new)
Next: Add TypeScript infrastructure (TOOL-2)

### [2025-10-30] TOOL-1a — Auto-run test script
**What:** Added `npm run e2e:auto` script (initially RED, server not auto-starting)
**Why:** Prepare foundation for Playwright webServer config
**Files:** package.json

### [2025-10-30] MAP-1d — Leaflet map with markers
**What:** Added Leaflet 1.9.4 CDN, initialized map centered on Union Square, rendered 3 POI markers with popups
**Why:** Core MVP feature: interactive map visualization of walking tour POIs
**Files:** Program.cs (inline HTML + script)

### [2025-10-30] MAP-1c — Leaflet markers test (RED)
**What:** Created test expecting Leaflet library loaded and ≥3 marker icons rendered
**Why:** Gate before implementing interactive map with Leaflet
**Files:** tests/e2e/leaflet.spec.ts (new)

### [2025-10-30] MAP-1b — Map container + POI list rendering
**What:** Added #map div and client-side fetch script to render POI list items; turned MAP-1a test GREEN
**Why:** Display POI data on home page before adding interactive map
**Files:** Program.cs (inline HTML)

### [2025-10-30] MAP-1a — Map + POI list test (RED)
**What:** Created test expecting #map container and ≥3 POI items rendered from /content/poi.v1.json
**Why:** Define behavior contract before implementing UI
**Files:** tests/e2e/map.spec.ts (new)

### [2025-10-30] SETUP-3b — POI JSON endpoint
**What:** Implemented GET /content/poi.v1.json endpoint serving poi.v1.json file; turned SETUP-3a test GREEN
**Why:** Enable client-side POI data fetching
**Files:** Program.cs

### [2025-10-30] SETUP-3a — POI endpoint test (RED)
**What:** Created test expecting /content/poi.v1.json to return valid JSON array
**Why:** Gate before implementing JSON API endpoint
**Files:** tests/e2e/poi-endpoint.spec.ts (new)

### [2025-10-30] DATA-4 — Sample POI content
**What:** Created poi.v1.json with 3 Manhattan POIs (Flatiron, Union Square Park, Madison Square Park); turned SCHEMA-5a test GREEN
**Why:** Provide real data for development and testing
**Files:** content/poi.v1.json (new)

### [2025-10-30] SCHEMA-5a — POI schema validation test (RED)
**What:** Created Zod schema validation test for POI structure; failed on missing poi.v1.json file
**Why:** Lock content data contract before creating sample data
**Files:** tests/schema/poi.spec.ts (new)

### [2025-10-30] SETUP-2b — Minimal home page
**What:** Added minimal ASP.NET Core endpoint serving HTML title; turned SETUP-2 test GREEN
**Why:** Establish server foundation for MVP
**Files:** Program.cs

### [2025-10-30] SETUP-2 — Smoke test (RED)
**What:** Created intentional RED smoke test expecting home page title
**Why:** Validate test harness works before building server
**Files:** tests/e2e/probe.spec.ts (new)

### [2025-10-30] SETUP-1 — Repository initialization
**What:** Initialized git repository, added comprehensive Protocol documentation, Playwright + Zod test dependencies
**Why:** Establish test-first workflow foundation and process guardrails
**Files:** package.json, docs/* (Protocol, Code-Review-Guide, etc.)

---

**End.**
