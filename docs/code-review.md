# Code Review Decisions Log — NYC Explorer

**Purpose**  
Track all development decisions in chronological order using the standardized format from Code-Review-Guide_10-24-25.md.

**Format**  
```
[YYYY-MM-DD HH:MM] <REPO>/<BRANCH> <STORY-ID> — <~12 words on what changed> (#tests=<N>, green=<true|false>)
<!-- DECISIONS_TEMPLATE_SNAPSHOT -->
Snapshot: <branch>@<sha> dirty=<n> tests=<pass>/<skip> selectors=vX.Y env=[...]
Blocker: <link or inline card>
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
[2025-10-30 03:15] nyc-explorer/main MAP-2a — add marker-to-detail test, red on no navigation (#tests=1, green=false)
[2025-10-31 12:30] nyc-explorer/main DOC-SEL-marker — add [data-testid="poi-marker"] to selectors.md (docs-only, #tests=NA, green=NA)
[2025-10-31 12:45] nyc-explorer/main MAP-2a’ — revise marker test to use [data-testid="poi-marker"], red as expected (#tests=1, green=false)
[2025-10-31 13:30] nyc-explorer/main MAP-2e — overlay above panes + containerPoint; marker nav green (#tests=all, green=true)
[2025-10-31 13:45] nyc-explorer/main A11Y-1a — add keyboard activation test for [data-testid="poi-marker"], unexpectedly green (#tests=1, green=true)
[2025-10-31 13:55] nyc-explorer/main A11Y-1b — add focus outline test for [data-testid="poi-marker"], unexpectedly green (#tests=1, green=true)
[2025-10-31 14:05] nyc-explorer/main A11Y-1c — explicit :focus-visible ring for [data-testid="poi-marker"], green→green (#tests=all, green=true)
[2025-10-31 14:15] nyc-explorer/main DATA-10a — add test requiring ≥10 POIs in poi.v1.json, red as expected (#tests=1, green=false)
[2025-10-31 14:25] nyc-explorer/main DATA-10b — add 5 Union Square/Flatiron POIs (minified), count≥10 + schema green (#tests=all, green=true)
[2025-10-31 14:35] nyc-explorer/main ROUTE-CAP-a — add unit test for buildRoute per-block ≤3 (import fails RED) (#tests=1, green=false)
[2025-10-31 14:45] nyc-explorer/main ROUTE-CAP-b — add buildRoute enforcing ≤3 per block; route-build.spec green (#tests=all, green=true)
[2025-10-31 14:50] nyc-explorer/main DOC-LOG — add project-history entry for ROUTE-CAP-b (docs-only, #tests=0, green=NA)
[2025-10-31 15:00] nyc-explorer/main ROUTE-CORE-UI-a — add e2e for route steps from buildRoute, RED missing #route-steps (#tests=1, green=false)
[2025-10-31 15:15] nyc-explorer/main ROUTE-CORE-UI-b — render #route-steps from inline buildRoute; route-ui.spec green (#tests=all, green=true)
[2025-10-31 15:25] nyc-explorer/main DOC-SEL — add route selectors (#route-steps, route-step), docs-only (#tests=0, green=NA)
[2025-10-31 15:35] nyc-explorer/main ROUTE-FILTER-a — add e2e for route recompute on search, RED (route not updating) (#tests=1, green=false)
[2025-10-31 15:50] nyc-explorer/main ROUTE-FILTER-b — recompute #route-steps after search filter (#tests=20, green=true)
[2025-10-31 16:10] nyc-explorer/main DATA-10b — add 5 POIs to reach ≥10, tests green (#tests=20, green=true)
[2025-10-31 16:30] nyc-explorer/main ROUTE-FILTER-b-verify — no changes; route steps already recompute on search (#tests=20, green=true)
[2025-10-31 16:45] nyc-explorer/main DETAIL-IMG-a — add detail image/credit test, red as expected (#tests=1, green=false)
[2025-10-31 22:06] nyc-explorer/main DETAIL-IMG-b — render poi images+credits on detail page (#tests=21, green=true)
[2025-10-31 22:11] nyc-explorer/main DOC-MVP — add MVP run/test checklist to README (#tests=0, green=NA)
[2025-10-31 22:32] nyc-explorer/main REFAC-HTML-1a — move poi detail to Razor view (#tests=21, green=true)
[2025-10-31 22:39] nyc-explorer/main ROUTE-INPUTS-a — add route controls contract test, red as expected (#tests=1, green=false)
[2025-10-31 22:44] nyc-explorer/main DOC-PROT-Leaflet-Pattern — add canonical overlay marker pattern (docs-only) (#tests=0, green=NA)
[2025-10-31 22:50] nyc-explorer/main CI-SMOKE-1a — add GitHub Actions CI workflow (#tests=0, green=NA)
[2025-10-31 22:51] nyc-explorer/main DOC-ARTIFACTS-1a — document visual artifact rules (#tests=0, green=NA)
[2025-10-31 22:52] nyc-explorer/main DOC-HISTORY-TEMPLATE-1a — add micro-entry snippet (#tests=0, green=NA)
[2025-10-31 22:54] nyc-explorer/main REFAC-JS-SPLIT-1a — extract home script to wwwroot (#tests=1, green=true)
[2025-10-31 22:56] nyc-explorer/main DOC-TEST-TIMEOUTS-1a — document Playwright timeout guidance (#tests=0, green=NA)
[2025-10-31 22:58] nyc-explorer/main ROUTE-INPUTS-b — add From/To controls on home; route-inputs GREEN (#tests=22, green=true)
[2025-10-31 23:16] nyc-explorer/main DOC-S4-Fixes-1 — fold Sprint 4 review clarifications into docs (#tests=0, green=NA)
[2025-10-31 23:45] nyc-explorer/main TOOL-DEV-LOOP-1a — dev loop scripts missing (RED by design) (#tests=0, green=false)
[2025-10-31 23:58] nyc-explorer/main TOOL-DEV-LOOP-1b — add dev loop scripts (e2e:ui, dev:api, dev), suites green (#tests=22, green=true)
[2025-11-01 00:20] nyc-explorer/main TOOL-DEV-LOOP-1c — verify dotnet watch hot-reload, no-op change reverted (#tests=0, green=NA)
[2025-11-01 00:45] nyc-explorer/main DOC-PROT-CanonRevert — remove invalid canonical banner (#tests=0, green=NA)
[2025-11-01 01:05] nyc-explorer/main DOC-READ-ORDER — add canonical read order list (#tests=0, green=NA)
[2025-11-01 01:15] nyc-explorer/main DOC-SEL-S4 — document active route selectors (#tests=0, green=NA)
[2025-11-01 01:25] nyc-explorer/main DOC-PLAYBOOK-4 — add decisions format link and example (#tests=0, green=NA)
[2025-11-01 01:35] nyc-explorer/main DOC-DEV-LOOP-SNIPPET — document dev loop command aliases (#tests=0, green=NA)
[2025-11-01 01:45] nyc-explorer/main ROUTE-FIND-1a — add unit+e2e contracts for From/To segmenting, RED as expected (#tests=2, green=false)
[2025-11-01 02:05] nyc-explorer/main ROUTE-FIND-1b — implement deterministic routeSegment helper (#tests=4, green=true)
[2025-11-01 02:40] nyc-explorer/main ROUTE-FIND-1d — relax routeSegment type to minimal shape; unit+e2e+typecheck green (#tests=28, green=true)
[2025-11-01 03:05] nyc-explorer/main ROUTE-FIND-2a — add e2e for active marker highlight & step indices, RED as expected (#tests=1, green=false)
[2025-11-01 03:35] nyc-explorer/main ROUTE-FIND-2b — highlight active markers w/ indices & a11y; tests green (#tests=29, green=true)
[2025-11-01 04:10] nyc-explorer/main ROUTE-SHARE-1a — add deep-link route tests, red as expected (#tests=3, green=false)
[schur 2025-11-01 04:35] nyc-explorer/main ROUTE-SHARE-1b — implement deep-link from/to; tests green (#tests=32, green=true)
[2025-11-01 05:05] nyc-explorer/main ROUTE-FIND-RESET-a — add reset contract test, red as expected (#tests=1, green=false)
[2025-11-01 06:20] nyc-explorer/main ROUTE-PATH-1a — add route path visual contract, RED (#tests=1, green=false)
[2025-11-01 06:55] nyc-explorer/main ROUTE-PATH-1b — render route polyline+nodes; tests green (#tests=34, green=true)
[2025-11-01 07:10] nyc-explorer/main ROUTE-ANNOUNCE-1a — add aria-live route-msg contract, RED as expected (#tests=1, green=false)
[2025-11-01 07:45] nyc-explorer/main ROUTE-ANNOUNCE-1b — add aria-live route messaging; #tests=35, green=true
[2025-11-01 08:10] nyc-explorer/main ROUTE-FIND-3a — add URL history contract (pushState + back/forward), red as expected (#tests=1, green=false)
[2025-11-01 08:45] nyc-explorer/main ROUTE-FIND-3b — wire pushState+popstate; history/back-forward synced (#tests=36, green=true)
[2025-11-01 13:29] nyc-explorer/main TOOL-DEV-LOOP-2b — dev:probe triggers & detects hot reload; green (#tests=full, green=true)
[2025-11-01 15:21] nyc-explorer/main TOOL-DEV-LOOP-2c — restore Razor baseline; dev:probe/typecheck/e2e green (#tests=full, green=true)
[2025-11-01 15:31] nyc-explorer/main TOOL-ARTIFACTS-1a — ignore docs/artifacts; stop VIS churn (#tests=full, green=true)
[2025-11-01 15:41] nyc-explorer/main ENC-PLACEHOLDER-1a — add UTF-8 placeholder contract, RED as expected (#tests=1, green=false)
[2025-11-01 16:19] nyc-explorer/main ENC-PLACEHOLDER-1b — add UTF-8 meta+header; placeholders render correctly (#tests=37, green=true)
[2025-11-01 16:34] nyc-explorer/main FORM-A11Y-1a — add a11y label contract for Search/From/To, RED as expected (#tests=1, green=false)
[2025-11-01 18:37] nyc-explorer/main FORM-A11Y-1b — add bound labels for Search/From/To; e2e+typecheck green (#tests=38, green=true)
[2025-11-01 18:44] nyc-explorer/main SPRINT-04-CLOSEOUT — changelog+release notes; tag v0.4.0-rc (#tests=38, green=true)
[2025-11-01 19:10] nyc-explorer/main DOC-SEL-GEO — predeclare typeahead/current-location selectors (#tests=0, green=NA)
[2025-11-01 19:35] nyc-explorer/main DOC-SEL-GEO — add geocoder selectors + read order (#tests=0, green=NA)
[2025-11-01 19:55] nyc-explorer/main DOC-S5-PLAN — publish Sprint 5 plan (docs-only) (#tests=0, green=NA)
[2025-11-01 20:20] nyc-explorer/main GEO-ADAPTER-0 — document adapters + DI scaffold (#tests=0, green=NA)
[2025-11-01 20:40] nyc-explorer/main GEO-UI-1a — typeahead dropdown contract RED (#tests=1, green=false)
[2025-11-01 21:05] nyc-explorer/main GEO-UI-1b — From typeahead dropdown (mouse select); geo-typeahead-basic GREEN (#tests=39, green=true)
[2025-11-01 21:20] nyc-explorer/main GEO-UI-1c-a — add From typeahead keyboard/a11y contract, RED as expected (#tests=1, green=false)
[2025-11-02 00:10] nyc-explorer/main FORM-A11Y-1b — bind labels; targeted+full e2e + typecheck (#tests=40, green=false; GEO-UI-1c-a RED expected)
[2025-11-02 00:35] nyc-explorer/main FORM-A11Y-1b — docs verification (no code changes) (#tests=39/40, green=false)
[2025-11-02 01:10] nyc-explorer/main GEO-UI-1c-b — typeahead keyboard+a11y polish; suites+typecheck green (#tests=40, green=true; typecheck=green)
[2025-11-02 01:27] nyc-explorer/main GEO-UI-2a — add To typeahead mouse-only contract, RED as expected (#tests=1, green=false)
[2025-11-02 01:54] nyc-explorer/main GEO-UI-2b — To typeahead mouse selection; suites+typecheck green (#tests=41, green=true; typecheck=green)
[2025-11-02 02:18] nyc-explorer/main GEO-UI-2c — To typeahead keyboard+a11y; suites+typecheck green (#tests=41, green=true; typecheck=green)
[2025-11-02 02:35] nyc-explorer/main ROUTE-ADAPTER-1a — add RouteAdapter contract test, RED as expected (#tests=1, green=false)
[2025-11-02 04:45] nyc-explorer/main DOC-QGATE-Thresholds — tighten clarifying-question gate (docs-only, green=NA)
[2025-11-02 05:10] nyc-explorer/main ROUTE-ADAPTER-1c-a — e2e expects RouteAdapter segment, RED (#tests=1, green=false)
[2025-11-02 05:40] nyc-explorer/main ROUTE-ADAPTER-1c-b — prefer RouteAdapter in Find flow (#tests=43, green=true)
[2025-11-02 06:20] nyc-explorer/main GEO-UI-3a — persist+pass geocode coords (RED contract) (#tests=1, green=false)
[2025-11-02 07:30] nyc-explorer/main GEO-UI-3b — persist geocode coords & route args (#tests=44, green=true; typecheck=green)
[2025-11-02 07:45] nyc-explorer/main GEO-ADAPTER-1a — add adapter-fed typeahead contract (RED) (#tests=1, green=false)
[2025-11-02 07:58] nyc-explorer/main GEO-UI-3c — From typeahead via GeoAdapter + live status (#tests=45, green=true; typecheck=green)
[2025-11-02 08:05] nyc-explorer/main GEO-UI-4a — add To typeahead adapter contract, RED as expected (#tests=1, green=false)
[2025-11-02 08:20] nyc-explorer/main GEO-UI-4b — To typeahead via GeoAdapter; status+dataset wired (#tests=46, green=true; typecheck=green)
[2025-11-02 08:28] nyc-explorer/main ROUTE-ADAPTER-PATH-1a — add adapter path e2e, RED as expected (#tests=1, green=false)
[schur] ROUTE-ADAPTER-PATH-1b — wire adapter path render; tests green (#tests=47, green=true; typecheck=green)
[schur] GEO-UI-5a — add current-location e2e contract, RED as expected (#tests=1, green=false)
[schur] GEO-UI-5b — implement current-location for From; tests green (#tests=targeted+full, green=true; typecheck=green)
[schur] GEO-UI-5c-a — add To current-location e2e contract (RED as expected) (#tests=2, green=false)
[schur] GEO-UI-5c-b — wire To current-location; tests green (#tests=51, typecheck=green)
[2025-11-02 10:45] nyc-explorer/main DEV-ENV-1b — finalize .env.example + README Quickstart (docs-only, green)
[2025-11-02 11:05] nyc-explorer/main ROUTE-SHARE-GEO-1a — add deep-link contract for adapter routes (tests=2, green=false)
[2025-11-02 14:30] nyc-explorer/main ROUTE-SHARE-POI-verify — POI deep-link unchanged; tests green (#tests=targeted+full, green=true; typecheck=green)
[2025-11-02 15:10] nyc-explorer/main GEO-ADAPTER-1b-fix — adapter arities aligned with docs; probe+suite green (#tests=targeted+full, green=true; typecheck=green)
[2025-11-02 15:20] nyc-explorer/main GEO-UI-Perf-1a — add From typeahead debounce/stale-result contract, RED as expected (#tests=1, green=false)
[2025-11-02 15:55] nyc-explorer/main GEO-UI-Perf-1b — From typeahead debounce+stale-result; tests green (#tests=targeted+full, green=true; typecheck=green)
[2025-11-02 16:45] nyc-explorer/main GEO-UI-Perf-2b — To typeahead debounce+stale guard; tests green (#tests=56, green=true)
[2025-11-02 17:10] nyc-explorer/main GEO-ADAPTER-1b-a — add MockGeocoder contract, RED as expected (#tests=1, green=false)
[2025-11-03 09:20] nyc-explorer/main GEO-ADAPTER-1b-b — implement MockGeocoder; unit+e2e+typecheck green (#tests=57, green=true)
[2025-11-03 10:05] nyc-explorer/main ROUTE-ADAPTER-1b — implement MockRouteEngine; unit+e2e+typecheck green (#tests=58, green=true)
[2025-11-03 09:45] nyc-explorer/main ROUTE-ADAPTER-1a — add MockRouteEngine unit contract, RED as expected (#tests=1, green=false)
[2025-11-03 08:00] nyc-explorer/main ROUTE-ADAPTER-ERR-UX-1a — add adapter failure UX contract, RED as expected (#tests=3, green=false)
[2025-11-03 11:45] nyc-explorer/main ROUTE-ADAPTER-ERR-UX-1b — adapter error copy+recovery green (#tests=61, green=true; typecheck=green)
[2025-11-03 12:15] nyc-explorer/main ROUTE-SHARE-UI-1a — copy-link e2e contract RED (#tests=3, green=false)
[2025-11-03 13:30] nyc-explorer/main ROUTE-SHARE-UI-1b — copy-link control wired; suites green (#tests=64, green=true; typecheck=green)
[2025-11-03 14:45] nyc-explorer/main DOC-REL-1 — deep-links+share docs; suites n/a (#tests=0, green=NA)
[2025-11-03 18:20] nyc-explorer/main RETRO-05 — sprint 5 postmortem + prompting template (#tests=64, green=true; typecheck=green)
[2025-11-03 18:55] nyc-explorer/main DRY-PATH-1 — factor route path helper; tests green (#tests=64, green=true; typecheck=green); touches: SMELL-POI-PATH-DRY
[2025-11-03 19:10] nyc-explorer/main FETCH-GUARD-1a — add POI load error contract (RED); selectors gated (poi-error, poi-list); touches: SMELL-ERROR-HANDLING (#tests=1, green=false)
[2025-11-03 21:55] nyc-explorer/main FETCH-GUARD-1b — POI load error handled (aria-live), route cleared; suites green; touches: SMELL-ERROR-HANDLING
[2025-11-03 22:15] nyc-explorer/main FETCH-GUARD-2a — add POI timeout contract (RED); touches: SMELL-ERROR-HANDLING (#tests=1, green=false)
[2025-11-03 22:45] nyc-explorer/main FETCH-GUARD-2b — POI fetch timeout handled; suites green (#tests=67, green=true); touches: SMELL-ERROR-HANDLING
[2025-11-03 23:10] nyc-explorer/main ERR-LOG-POI-1c — PoiController logging + forced-500 UX; suites green (#tests=68, green=true); touches: SMELL-ERROR-HANDLING
[2025-11-03 23:55] nyc-explorer/main REL-PUSH-1a — push logging + failure contracts; suites green (#tests=68, green=true; typecheck=green); touches: SMELL-ERROR-HANDLING
[2025-11-03 23:59] nyc-explorer/main CONST-LOCAL-1b — hoist CFG_ROUTE.BLOCK_CAP; suites green (#tests=68, green=true; typecheck=green); touches: SMELL-MAGIC-NUMS
[2025-11-04 00:35] nyc-explorer/main CONST-LOCAL-1c — hoist CFG_UI.DEBOUNCE_MS; suites green (#tests=68, green=true; typecheck=green); touches: SMELL-MAGIC-NUMS
[2025-11-04 01:10] nyc-explorer/main CONST-LOCAL-1d — hoist path constants + overlay z-index; suites green (#tests=68, green=true; typecheck=green); touches: SMELL-MAGIC-NUMS
[2025-11-04 01:45] nyc-explorer/main PATH-HELPER-1 — extract ContentPathHelper.GetPoiFilePath; no behavior change; suites green; touches: SMELL-PATH-HELPER
[2025-11-03 15:40] nyc-explorer/main DOC-WORKFLOW-S6 — add Workflow-Tweaks-S6 + DoD gates; suites green (#tests=70, green=true; typecheck=green)
[2025-11-03 16:11] nyc-explorer/main QA-VERIFY-TIMEOUT — full suite re-run after ask-before-act update; suites green (#tests=70, green=true)
[2025-11-03 16:20] nyc-explorer/main DOC-SEL-SOP — add selector governance + template; docs-only (#tests=0, green=NA)
[2025-11-03 19:56] nyc-explorer/main DOC-GATE-S6-REV — Sprint 06 docs/fixtures/governance verified; #tests=70, green=true; typecheck=green
[2025-11-03 20:05] nyc-explorer/main DOC-COPILOT-SUMMARY-1 — require completed prompt title in summaries (#tests=0, green=NA)
[2025-11-03 17:51] nyc-explorer/main DOC-SEL-GOV-1b — finalize selectors governance; suites green (#tests=70, green=true); touches: SOP-docs
[2025-11-04 09:15] nyc-explorer/main EXTRACT-ADAPTERS-1 — move adapters + provider config (no behavior change) (#tests=70, green=true; typecheck=green; touches: SMELL-HTML-EXTRACT)
[2025-11-04 11:45] nyc-explorer/main ENV-RECOVER-DTB-1 — dev:probe OK; e2e/typecheck green (#tests=70, green=true)
[2025-11-04 13:20] nyc-explorer/main EXTRACT-ADAPTERS-1 — finalize extraction; Program.cs delta ≤60 (#tests=70, green=true; typecheck=green; touches: SMELL-HTML-EXTRACT)
[2025-11-04 14:10] nyc-explorer/main EXTRACT-ADAPTERS-1 — finalize ProviderConfig→__APP_CONFIG__ + adapters.js DI; Program.cs delta ≤60; suites green (#tests=70, green=true; typecheck=green; touches: SMELL-HTML-EXTRACT)
[2025-11-04 14:45] nyc-explorer/main FIXTURE-HELPER-1 — Playwright provider interception helper (RED→GREEN); suites green (#tests=71, green=true; typecheck=green)
[2025-11-04 15:05] nyc-explorer/main ROUTE-FIND-WIRE-1a — provider Find contract (fixture-backed, RED); suites red (#tests=72, green=false; typecheck=green)
[2025-11-04 15:25] nyc-explorer/main ROUTE-ADAPTER-REAL-1a — normalizeRoutePayload contract (RED); suites red (#tests=73, green=false; typecheck=green)
[2025-11-04 15:45] nyc-explorer/main ROUTE-ADAPTER-REAL-1b — implement normalizeRoutePayload (unit green; suite pending ROUTE-FIND-WIRE-1a); typecheck=green
[2025-11-05 10:15] nyc-explorer/main DOC-SEL-DIR-1a — predeclare directions selectors; docs-only (#tests=0, green=NA)
[2025-11-05 10:45] nyc-explorer/main GEO-ADAPTER-2a — geocoder fixture + From contract, RED as expected (#tests=1, green=false)
[2025-11-05 11:35] nyc-explorer/main GEO-ADAPTER-2b — wire RealGeocoder.search to /geocode fixture; geo-from list shows; GREEN (#tests=74, green=true)
[2025-11-05 11:55] nyc-explorer/main GEO-ADAPTER-2c-a — geocoder timeout contract (From), RED as expected (#tests=1, green=false)
[2025-11-05 12:45] nyc-explorer/main GEO-ADAPTER-2c-b — geocoder timeout handling; GREEN (#tests=75, green=true; typecheck=green)
[2025-11-05 13:15] nyc-explorer/main ENV-GEO-TIMEOUT-1 — docs-only knob for GEO_TIMEOUT_MS (#tests=0, green=NA)
[2025-11-05 13:55] nyc-explorer/main TURN-LIST-1a — directions list e2e contract (RED) (#tests=1, green=false)
[2025-11-05 15:25] nyc-explorer/main TURN-LIST-UNBLOCK-TOGGLE — force provider toggle in dir spec (#tests=76, green=true; typecheck=green)
[2025-11-05 15:58] nyc-explorer/main TURN-LIST-VERIFY-1b — directions status+list render & reset; GREEN (#tests=1, green=true)
[2025-11-05 16:30] nyc-explorer/main TURN-LIST-1c-c — keyboard a11y spec only; GREEN (#tests=1, green=true; typecheck=green)
[2025-11-05 16:30] nyc-explorer/main TURN-LIST-1d — map parity contract (RED) (#tests=1, green=false)
[2025-11-05 17:10] nyc-explorer/main TURN-LIST-1d-b — map/list active-step parity; suites green (#tests=78, green=true; typecheck=green)
[2025-11-06 11:20] nyc-explorer/main P41 — align rate-limit probe with turn selectors (#tests=1, green=true)
Outcome: GREEN
Snapshot: main@8b3b0c5 dirty=0 tests=1/0 selectors=v0.7 env=[]

[2025-11-06 14:55] nyc-explorer/main P37 — RATE-LIMIT-OPS-1c — 429 retry→mock + cooldown; ENV knob exposed; probe green (#tests=1, green=true)
Outcome: GREEN
Snapshot: main@8b3b0c5 dirty=0 tests=1/0 selectors=v0.7 env=[]

[2025-11-06 15:40] nyc-explorer/main P42 — promote canonical turn-list selectors + full suite (#tests=86, green=true)
Outcome: GREEN
Snapshot: main@8b3b0c5 dirty=0 tests=86/0 selectors=v0.7 env=[]

SPRINT-06 — CLOSEOUT: suite green; tagged sprint-06-closeout-20251106.
[2025-11-06 18:30] nyc-explorer/main P46 — protocol hardening (prompt schema v2 + loop rules) (#tests=0, green=NA)
Outcome: DOCS
Snapshot: main@8b3b0c5 dirty=0 tests=0/0 selectors=v0.7 env=[]

[2025-11-06 19:05] nyc-explorer/main P41 — Copilot instructions repo snapshot macro (#tests=0, green=NA)
Outcome: DOCS
Snapshot: main@8b3b0c5 dirty=0 tests=0/0 selectors=v0.7 env=[]

[2025-11-06 19:25] nyc-explorer/main P47 — snapshot wiring (session ritual + decisions template) (#tests=0, green=NA)
Outcome: DOCS
Snapshot: main@8b3b0c5 dirty=0 tests=0/0 selectors=v0.7 env=[]

[2025-11-06 19:50] nyc-explorer/main P48 — quarantine meta-check enforces skip cap + label (#tests=87, green=true)
Outcome: GREEN
Snapshot: main@8b3b0c5 dirty=0 tests=87/1 selectors=v0.7 env=[]

[2025-11-06 20:05] nyc-explorer/main P49A — CI workflow enforces Playwright + typecheck gates (#tests=0, green=NA)
Outcome: DOCS
Snapshot: main@8b3b0c5 dirty=0 tests=0/0 selectors=v0.7 env=[]

[2025-11-06 20:20] nyc-explorer/main P50 — blocker card macro + decisions hook (#tests=0, green=NA)
Outcome: DOCS
Snapshot: main@8b3b0c5 dirty=0 tests=0/0 selectors=v0.7 env=[]

[2025-11-06 20:40] nyc-explorer/main P51 — log integrity meta-check (#tests=88, green=true)
Outcome: GREEN
Snapshot: main@8b3b0c5 dirty=0 tests=88/1 selectors=v0.7 env=[]

[2025-11-06 21:05] nyc-explorer/main P52 — CI-META-FASTFAIL adds meta gate before suite (#tests=2, green=true)
Outcome: GREEN
Snapshot: main@8b3b0c5 dirty=0 tests=2/0 selectors=v0.7 env=[]

[2025-11-06 21:30] nyc-explorer/main P53 — CI meta summary + artifact upload (#tests=2, green=true)
Outcome: GREEN
Snapshot: main@8b3b0c5 dirty=0 tests=2/0 selectors=v0.7 env=[]

[2025-11-06 22:00] nyc-explorer/main P54 — decisions template meta-check (#tests=89, green=true)
Outcome: GREEN
Snapshot: main@8b3b0c5 dirty=0 tests=89/1 selectors=v0.7 env=[]

[2025-11-06 22:30] nyc-explorer/main P55 — selectors helper for provider route spec (#tests=89, green=true)
Outcome: GREEN
Snapshot: main@33e3855 dirty=0 tests=89/1 selectors=v0.7 env=[]

[2025-11-06 22:45] nyc-explorer/main P56 — adopt selector helper in rate-limit probe (#tests=89, green=true)
Outcome: GREEN
Snapshot: main@6dd156c dirty=0 tests=89/1 selectors=v0.7 env=[]

[2025-11-06 23:05] nyc-explorer/main P57 — quarantine TTL meta-guard (48h) (#tests=90, green=true)
Outcome: GREEN
Snapshot: main@6a88eba dirty=0 tests=90/1 selectors=v0.7 env=[]

[2025-11-06 23:35] nyc-explorer/main P58 — selector helper meta nudges (#tests=91, green=true)
Outcome: GREEN
Snapshot: main@4efa858 dirty=1 tests=90/1 selectors=v0.7 env=[]

[2025-11-06 23:55] nyc-explorer/main P59 — selector helper adopt 2 (#tests=91, green=true)
Outcome: GREEN
Snapshot: main@4efa858 dirty=1 tests=90/1 selectors=v0.7 env=[]

[2025-11-07 00:15] nyc-explorer/main P60 — selector helper adopt dir-list (#tests=91, green=true)
Outcome: GREEN
Snapshot: main@dddcdd9 dirty=1 tests=90/1 selectors=v0.7 env=[]

[2025-11-07 00:35] nyc-explorer/main P61 — selector helper meta promoted (#tests=91, green=true)
Outcome: GREEN
Snapshot: main@0c5be70 dirty=1 tests=90/1 selectors=v0.7 env=[]

[2025-11-07 00:55] nyc-explorer/main P62 — CI selector helper strict gate (#tests=0, green=NA)
Outcome: CI
Snapshot: main@c782e8e dirty=1 tests=0/0 selectors=v0.7 env=[]

**Parked Items**
- (None currently)