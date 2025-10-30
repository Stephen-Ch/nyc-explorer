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
_No entries yet._

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
