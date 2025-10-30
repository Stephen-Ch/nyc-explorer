# Code Review Decisions Log — NYC Explorer

**Purpose**  
Track all development decisions in chronological order using the standardized format from Code-Review-Guide_10-24-25.md.

**Format**  
```
[YYYY-MM-DD HH:MM] <REPO>/<BRANCH> <STORY-ID> — <~12 words on what changed> (#tests=<N>, green=<true|false>)
```

**Guidelines**
- Append exactly one line per completed story/PR
- Include test count and green status for traceability
- Keep description to ~12 words focusing on what changed
- Use issue tracker suffix when applicable: `; issue=GH-123` or `; issue=NA`

---

## Decisions History

[2025-10-30 12:00] nyc-explorer/main SETUP-1 — initialize repository with comprehensive documentation (#tests=0, green=NA)
[2025-10-30 15:30] nyc-explorer/main SETUP-2 — add playwright harness with intentional red smoke test (#tests=1, green=false)
[2025-10-30 16:15] nyc-explorer/main SETUP-2b — add minimal API serving home page, probe test green (#tests=1, green=true)
[2025-10-30 16:45] nyc-explorer/main SCHEMA-5a — add POI schema validation test, red on missing file (#tests=1, green=false)
[2025-10-30 17:00] nyc-explorer/main DATA-4 — create poi.v1.json with 3 Manhattan POIs, schema test green (#tests=1, green=true)
[2025-10-30 17:15] nyc-explorer/main SETUP-3a — add API test for /content/poi.v1.json endpoint, red 404 (#tests=1, green=false)
[2025-10-30 17:30] nyc-explorer/main SETUP-3b — implement /content/poi.v1.json endpoint, API test green (#tests=1, green=true)
[2025-10-30 18:00] nyc-explorer/main MAP-1a — add map + POI list test, red on missing #map (#tests=1, green=false)
[2025-10-30 18:30] nyc-explorer/main MAP-1b — add #map container + POI list rendering, map test green (#tests=4, green=true)
[2025-10-30 19:00] nyc-explorer/main MAP-1c — add Leaflet markers test, red on Leaflet not loaded (#tests=1, green=false)
[2025-10-30 19:30] nyc-explorer/main MAP-1d — add Leaflet library + marker rendering, all tests green (#tests=5, green=true)
[2025-10-30 20:00] nyc-explorer/main TOOL-1a — add e2e:auto script, red on server not reachable (#tests=5, green=false)
[2025-10-30 20:15] nyc-explorer/main TOOL-1b — add Playwright webServer config, auto-start working all green (#tests=5, green=true)
[2025-10-30 20:30] nyc-explorer/main TOOL-2a — add TypeScript + typecheck script, red 109 errors (#tests=0, green=false)
[2025-10-30 20:45] nyc-explorer/main DOC-1 — add project-history micro-log + Copilot binding (#tests=0, green=NA)
[2025-10-30 21:00] nyc-explorer/main DOC-1b — update project-history template and Sprint 02 section (#tests=0, green=NA)
[2025-10-30 21:15] nyc-explorer/main TOOL-2b — add @types/node + skipLibCheck, typecheck green 0 errors (#tests=5, green=true)
[2025-10-30 21:30] nyc-explorer/main DOC-2 — add Sprint-02-Plan.md and wire into Copilot read order (#tests=0, green=NA)
[2025-10-30 21:45] nyc-explorer/main REFAC-TS-1 — legitimize strict catch typing in probe.spec.ts (no code; process correction) (#tests=5, green=true)
[2025-10-30 22:00] nyc-explorer/main SCHEMA-TYPES-a — add POI type import, red on missing schema module (#tests=0, green=false)
[2025-10-30 22:15] nyc-explorer/main SCHEMA-TYPES-b — add shared Zod schema + TS type, typecheck green (#tests=5, green=true)
[2025-10-30 22:30] nyc-explorer/main ROUTE-1a — add detail route test, red on missing #poi-title (#tests=2, green=false)
[2025-10-30 22:45] nyc-explorer/main ROUTE-1b — implement /poi/{id} route with title and back link (#tests=7, green=true)
[2025-10-30 23:00] nyc-explorer/main DETAIL-1a — add summary and sources test, red on missing selectors (#tests=1, green=false)
[2025-10-30 23:15] nyc-explorer/main DETAIL-1b — render POI summary and sources list on detail page (#tests=8, green=true)
[2025-10-30 23:30] nyc-explorer/main ROUTE-2a — add back-to-map navigation test, green immediately (#tests=9, green=true)
[2025-10-30 23:45] nyc-explorer/main VIS-1a — capture map screenshot artifact for visual smoke (#tests=10, green=true)
[2025-10-31 00:00] nyc-explorer/main SEARCH-1a — add client-side filter test, red on missing search-input (#tests=1, green=false)
[2025-10-31 00:15] nyc-explorer/main SEARCH-1b — implement client-side name filter with live update (#tests=11, green=true)
[2025-10-31 00:30] nyc-explorer/main DATA-5a — add POI count test, red on 3 POIs expecting 5+ (#tests=1, green=false)
[2025-10-31 00:45] nyc-explorer/main DATA-5b — add 2 Union Square/Flatiron POIs, now 5 total (#tests=12, green=true)
[2025-10-30 01:00] nyc-explorer/main DOC-3a — add Response Schema + logging policy to Copilot-Instructions (#tests=12, green=true)
[2025-10-30 01:15] nyc-explorer/main DOC-3b — add 6-step execution loop + LOC overflow rule to Protocol (#tests=12, green=true)
[2025-10-30 01:30] nyc-explorer/main DOC-3c — create Sprint-03-Plan.md with backlog and working agreements (#tests=12, green=true)
[2025-10-30 01:45] nyc-explorer/main DOC-3d — predeclare selectors for list links, images, tags, results (#tests=12, green=true)
[2025-10-30 02:00] nyc-explorer/main DOC-3e — add Quickstart simplified commands and Scope to README (#tests=12, green=true)
[2025-10-30 02:15] nyc-explorer/main DOC-3f — create CONTRIBUTING.md with commit message format and workflow (#tests=12, green=true)
[2025-10-30 02:30] nyc-explorer/main DOC-3g — add CI-1 note to Sprint-03-Plan about GitHub Actions (#tests=12, green=true)
[2025-10-30 02:45] nyc-explorer/main LIST-1a — add list-to-detail link test, red on missing poi-link (#tests=1, green=false)
[2025-10-30 03:00] nyc-explorer/main LIST-1b — add poi-link to list items, navigates to detail (#tests=13, green=true)

---

**Parked Items**
- (None currently)