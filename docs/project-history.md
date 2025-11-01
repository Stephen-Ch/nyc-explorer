# Project History — Micro Log (v0.1)

**Purpose:** Human-readable per-story context. Append after GREEN.

**Rules:**
- New entries: **newest on top**
- Keep ≤4 lines per entry
- Format: see template below

```
### [YYYY-MM-DD] STORY-ID — Short title
In order to <goal>, I <change>.
Considerations: <tech-debt/risks/gotchas>.
Evidence: #tests=<N>, green=<true|false> (typecheck=<status>)
Files: <main files touched>
```

---

## History (newest first)

### Sprint 03

### [2025-11-01] DOC-PROT-CanonRevert — Removed dead canonical banner reference.

### [2025-11-01] TOOL-DEV-LOOP-1c — Hot reload verified
In order to confirm dotnet watch reloads cleanly, I toggled whitespace in Detail.cshtml and saw the watcher report "File updated" followed by "Hot reload succeeded".
Evidence: #tests=0, green=NA; typecheck=NA; files: docs/code-review.md, docs/project-history.md.

### [2025-10-31] TOOL-DEV-LOOP-1b — Dev loop scripts
In order to speed the dev loop, I added e2e:ui (Playwright UI), dev:api (dotnet watch), and dev (alias).
Evidence: #tests=22, green=true; typecheck=green; files: package.json.

### [2025-10-31] DOC-S4-Fixes-1 — Sprint 4 docs tightened
In order to bake in review feedback, I updated selectors, Protocol, and the Sprint 04 plan with dev-loop gating, new hooks, and routeSegment edge cases.
Considerations: No code changes yet; selectors now predeclare active marker + route message hooks.
Evidence: #tests=0, green=NA; files: docs/selectors.md, docs/Protocol.md, docs/Sprint-04-Plan.md.

### [2025-10-31] ROUTE-INPUTS-b — Route controls appear
In order to unblock future routing UX, I added placeholder From/To inputs and a Find button on the home page.
Considerations: UI-only slice; Program.cs change under 60 LOC; routing logic remains TODO.
Evidence: #tests=22, green=true; typecheck=green; files: apps/web-mvc/Program.cs.

### [2025-10-31] REFAC-JS-SPLIT-1a — Extract home script
In order to improve maintainability, I moved the home-page logic into `wwwroot/js/home.js` and enabled static file serving while preserving selectors/behavior.
Considerations: Route-inputs spec remains RED by design; other Playwright specs unaffected.
Evidence: #tests=1, green=true; typecheck=green; files: apps/web-mvc/Program.cs, apps/web-mvc/wwwroot/js/home.js.

### [2025-10-31] DOC-TEST-TIMEOUTS-1a — Playwright timeout guidance
In order to keep e2e slices consistent, I added a Protocol appendix covering default Playwright timeouts, retries, and when to adjust them per story.
Considerations: Emphasizes targeted `expect.setTimeout()` over global increases; discourages exceeding 10s without UX buy-in.
Evidence: #tests=0, green=NA; files: docs/Protocol.md (Test Timeouts & Retries appendix).

### [2025-10-31] DOC-PROT-Leaflet-Pattern — Codify overlay approach
In order to reduce debugging loops, I documented the canonical Leaflet overlay button pattern and testing heuristics in Protocol.md.
Considerations: Reinforces focus styling, selector usage, and Razor-first guidance for growing views.
Evidence: #tests=0, green=NA; files: docs/Protocol.md (Leaflet Map Interaction section).

### [2025-10-31] CI-SMOKE-1a — GitHub Actions CI workflow
In order to catch regressions on push/PR, I added a workflow running npm ci, typecheck, and Playwright with trace artifacts on failure.
Considerations: Uses Node 18 + .NET 8; relies on existing Playwright webServer config; artifact retention defaults in Actions.
Evidence: #tests=0, green=NA; files: .github/workflows/ci.yml.

### [2025-10-31] DOC-ARTIFACTS-1a — Visual artifact rules
In order to standardize screenshots, I created Artifacts.md covering naming, storage, size limits, refresh cadence, and PR linking.
Considerations: Focused on PNG ≤500KB in `docs/artifacts/<STORY-ID>/`; encourages reuse when UI unchanged.
Evidence: #tests=0, green=NA; files: docs/Artifacts.md.

### [2025-10-31] REFAC-HTML-1a — Razor detail shell
In order to make /poi/{id} maintainable, I swapped the inline HTML for an MVC controller + Razor view while preserving all selectors.
Considerations: JSON parsing now feeds a view model; controllers registered via AddControllersWithViews; future slices can extract shared helpers.
Evidence: #tests=21, green=true; typecheck=green; files: Program.cs, Controllers/PoiController.cs, Views/Poi/Detail.cshtml.

### [2025-10-31] DOC-MVP — README run/test checklist
In order to keep MVP validation obvious, I added a Run & Test section listing local commands and GREEN criteria.
Considerations: Commands limited to three lines; criteria call out ≥10 POIs, navigation, and image-credit visibility.
Evidence: #tests=0, green=NA; files: docs/README.md (Run & Test block).

### [2025-10-31] DETAIL-IMG-b — Render POI images
In order to surface provenance, I now emit figure/img + credit markup on /poi/{id} whenever images exist.
Considerations: Alt text uses the POI name, multiple images supported, layout styling still pending; touched apps/web-mvc/Program.cs.
Evidence: #tests=21, green=true; typecheck=green; detail-images.spec.ts now passes.

### [2025-10-31] ROUTE-FILTER-b-verify — Route steps already aligned
In order to confirm search updates guidance, I re-ran route filter and full suites with no code changes.
Considerations: Verified empty results clear #route-steps; existing buildRoute/renderRoute wiring intact.
Evidence: #tests=20, green=true; typecheck=green.
Files: none (verification only).

### [2025-10-31] DATA-10b — Reach ten POIs for launch
In order to meet the ≥10 POI requirement, I appended five Union Square/Flatiron entries to `content/poi.v1.json` with sequential `USQ-core-001` routing.
Considerations: kept updates to a single file under 60 LOC; placeholder media links remain until final assets land.
Evidence: #tests=20, green=true; typecheck=green.
Files: content/poi.v1.json (+5 POIs).

### [2025-10-31] ROUTE-FILTER-b — Route steps follow filters
In order to keep route guidance aligned with search results, I reused `buildRoute()` and now call `renderRoute(buildRoute(filtered))` inside the search handler.
Considerations: Overlay marker buttons still update via `placeButtons`; logging for route interactions remains TODO.
Evidence: #tests=20, green=true; typecheck=0 errors.
Files: apps/web-mvc/Program.cs (~80 LOC), tests/e2e/route-filter.spec.ts (touches assertions).

### [2025-10-31] ROUTE-CAP-b — Enforce per-block ≤3 in route builder
In order to honor the routing density cap at runtime (not during data collection), I implemented `buildRoute()` in `apps/web-mvc/route.ts` and sorted results stably before capping.
Considerations: tags are inclusive OR; `era` placeholder (ignored for now); cap enforced per `block` = 3; future: era filter, tie-breakers, pagination.
Evidence: route-build.spec.ts GREEN; full suite 18/18; typecheck 0 errors.
Files: apps/web-mvc/route.ts (~42 LOC).

### [2025-10-31] ROUTE-CORE-UI-b — Steps list from route
In order to expose the computed route, I added #route-steps and render it via an inline buildRoute mirroring the TS logic.
Considerations: cap ≤3 per block; sort by route_id/order/name; era ignored for now; selectors unchanged.
Evidence: route-ui.spec GREEN; full suite GREEN; typecheck 0 errors.
Files: apps/web-mvc/Program.cs (~58 LOC).

### [2025-10-30] LIST-1 — POI list items link to detail pages
In order to navigate from list to detail, I changed render() to create <a data-testid="poi-link" href="/poi/{id}">{name}</a> inside each list item.
Considerations: Search filter still works (calls render with filtered array); links use existing /poi/{id} route.
Evidence: #tests=13, green=true
Files: apps/web-mvc/Program.cs (+4 LOC in render function), tests/e2e/list-to-detail.spec.ts (new)
Next: MAP-2 (marker click navigation)

### Sprint 02

### [2025-10-31] DATA-5 — Expand POI content to 5 locations
In order to meet minimum content threshold, I added 2 POIs (Metronome & Countdown Clock, Appellate Division Courthouse); both pass schema validation.
Considerations: Reached 5 POIs (Sprint goal was 10, but 5 meets minimum); all Union Square + Flatiron area; all markers now visible on map.
Evidence: #tests=12, green=true; typecheck=0 errors; schema test GREEN
Files: content/poi.v1.json (+32 LOC), tests/schema/poi-count.spec.ts (new, 11 LOC)
Next: Sprint 02 complete! Ready for Sprint 03 planning or additional features.

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
