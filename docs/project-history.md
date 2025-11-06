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

### [2025-11-07] P62 — CI selector helper strict gate
In order to hard-fail future selector drift, I set `SELECTOR_HELPER_STRICT=1` for the Playwright Meta Gate in CI so the selector helper spec runs in strict mode.
Considerations: Scoped change to the workflow env block only, keeping the meta summary and artifacts intact; no runtime code touched.
Evidence: Workflow-only update (no local tests required).
Files: .github/workflows/ci.yml; docs/code-review.md; docs/project-history.md.

### [2025-11-07] P61 — Selector helper meta promoted
In order to enforce strict selector helper usage, I promoted the meta spec into version control and verified it passes with `SELECTOR_HELPER_STRICT=1` before rerunning the full suite and typecheck.
Considerations: No offenders remain so strict mode passes locally; CI flip will follow separately once this guard is in main.
Evidence: SELECTOR_HELPER_STRICT=1 npx playwright test tests/meta/selector-helper.spec.ts; npx playwright test; npm run typecheck.
Files: tests/meta/selector-helper.spec.ts; docs/code-review.md; docs/project-history.md.

### [2025-11-07] P60 — Selector helper adopt dir-list
In order to finish migrating the turn list specs, I swapped dir-list.spec.ts to use the shared selectors helper for the turn list, turn items, and live region expectations.
Considerations: Preserved the fallback rename for legacy data-testid, deriving the new id from the helper to avoid duplication while keeping the DOM check intact.
Evidence: npx playwright test tests/e2e/dir-list.spec.ts; npx playwright test; npm run typecheck.
Files: tests/e2e/dir-list.spec.ts; docs/code-review.md; docs/project-history.md.

### [2025-11-06] P59 — Selector helper adopt 2
In order to drive the selector helper toward strict enforcement, I replaced the hard-coded turn list selectors in the keyboard and parity specs with the shared helper values.
Considerations: Limited scope to two specs as instructed; reused existing locators so assertions stay identical while keeping helper focus calls readable.
Evidence: npx playwright test tests/e2e/dir-list-keyboard.spec.ts; npx playwright test tests/e2e/dir-list-parity.spec.ts; npx playwright test; npm run typecheck.
Files: tests/e2e/dir-list-keyboard.spec.ts; tests/e2e/dir-list-parity.spec.ts; docs/code-review.md; docs/project-history.md.

### [2025-11-06] P58 — Selector helper meta nudges
In order to keep e2e specs aligned with the shared selectors helper, I added a meta spec that scans for hard-coded turn list selectors and nudges offenders toward the import, failing only when `SELECTOR_HELPER_STRICT=1`.
Considerations: Uses a recursive file walker under tests/e2e and records annotations instead of failing in default mode to surface drift without blocking the suite.
Evidence: npx playwright test tests/meta/selector-helper.spec.ts; npx playwright test; npm run typecheck.
Files: tests/meta/selector-helper.spec.ts; docs/code-review.md; docs/project-history.md.

### [2025-11-06] P57 — Quarantine TTL meta-guard
In order to enforce the 48h quarantine window, I added a meta spec that checks RED CONTRACT skips and flags any whose git timestamp exceeds the TTL.
Considerations: Walks tests directory only; leverages git log for timestamps and ignores files without skips.
Evidence: npx playwright test tests/meta/quarantine-ttl.spec.ts; npx playwright test; npm run typecheck.
Files: tests/meta/quarantine-ttl.spec.ts; docs/code-review.md.

### [2025-11-06] P56 — Selectors helper adoption for rate-limit probe
In order to reduce selector drift in the probe, I swapped its hard-coded list/live-region selectors to reuse the shared helper introduced in P55.
Considerations: Scoped change to the spec only; passed helper selector into page.evaluate to keep cross-context usage safe.
Evidence: npx playwright test tests/e2e/rate-limit-probe.spec.ts; npx playwright test; npm run typecheck.
Files: tests/e2e/rate-limit-probe.spec.ts; docs/code-review.md.

### [2025-11-06] P55 — Selectors helper for route find
In order to keep high-signal specs aligned with selectors.md, I introduced a shared selectors helper and migrated the real route-find contract to use it.
Considerations: Limited scope to tests/helpers + one spec; tightened live region lookup with :scope filter to avoid strict locator collisions.
Evidence: npx playwright test tests/e2e/route-find-real.spec.ts; npx playwright test; npm run typecheck (all green).
Files: tests/helpers/selectors.ts; tests/e2e/route-find-real.spec.ts.

### [2025-11-06] P54 — Decisions template meta-check
In order to keep the decisions log compliant, I added a Playwright meta spec that enforces Outcome/Snapshot lines for each P-entry and backfilled the recent entries accordingly.
Considerations: Restricted changes to tests + docs; spec runs softly per entry to pinpoint missing fields.
Evidence: npx playwright test tests/meta/decisions-template.spec.ts; npx playwright test; npm run typecheck (all green).
Files: tests/meta/decisions-template.spec.ts; docs/code-review.md.

### [2025-11-06] P53 — CI meta summary + artifact
In order to surface meta gate outcomes, I captured the Playwright meta report to meta-gate.txt, appended it to the job summary, and uploaded it as a CI artifact.
Considerations: Left the fast-fail behavior intact; summary/log steps run regardless of pass/fail to aid debugging.
Evidence: npx playwright test tests/meta (GREEN).
Files: .github/workflows/ci.yml.

### [2025-11-06] P52 — CI-META-FASTFAIL
In order to fail fast on governance drift, I added a Playwright Meta Gate before the full suite and refreshed Copilot instructions to point at Sprint-06 and call out the new enforcement.
Considerations: Preserved the existing install/typecheck/E2E order; meta gate reuses CI env without extra setup.
Evidence: npx playwright test tests/meta (GREEN).
Files: .github/workflows/ci.yml; docs/Copilot-Instructions.md.

### [2025-11-06] P49A — CI gate enforcement
In order to align commit-on-green with automation, I updated the existing CI workflow so the Playwright E2E Gate runs `npx playwright install --with-deps && npx playwright test` and the Typecheck Gate runs `npm run typecheck` on every push/PR to main.
Considerations: Preserved Node 18, .NET setup, and trace upload steps while only renaming the gate steps for idempotence.
Evidence: docs-only workflow edit (no local tests required).
Files: .github/workflows/ci.yml.

### [2025-11-06] P50 — Blocker card macro
In order to standardize loop stoppage, I added a Blocker Card macro with context, failing specs, diffs, hypothesis, experiments, and snapshot fields, plus an optional log line so incidents are traceable.
Considerations: Anchored sections in Protocol and Copilot instructions ensure idempotency; no runtime code touched.
Evidence: docs-only update (no tests required).
Files: docs/Protocol.md; docs/Copilot-Instructions.md; docs/code-review.md.

### [2025-11-06] P51 — Log integrity meta-check
In order to keep decisions and history aligned, I added a meta spec that asserts every P## from the decisions log appears in the Sprint-06 project history block.
Considerations: Tests-only addition under 60 LOC; reads docs without mutating them.
Evidence: npx playwright test tests/meta/log-integrity.spec.ts; npx playwright test; npm run typecheck.
Files: tests/meta/log-integrity.spec.ts.

### [2025-11-06] P48 — Quarantine meta-check
In order to enforce the 48h TTL policy, I added a Playwright meta spec that fails when `test.skip` usage exceeds the cap or lacks the RED label, keeping the current single skip in compliance.
Considerations: Tests-only addition under 60 LOC; leans on existing selector contracts but does not touch runtime code.
Evidence: npx playwright test tests/meta/quarantine-check.spec.ts; npx playwright test; npm run typecheck (all green).
Files: tests/meta/quarantine-check.spec.ts.

### [2025-11-06] P47 — Snapshot wiring
In order to enforce repo snapshots, I tied the SNAPSHOT macro into the session ritual and decisions template so responses and logs capture branch, SHA, tests, selectors, and env data consistently.
Considerations: Docs-only change scoped with anchors; no runtime impact.
Evidence: docs-only slice (no tests required).
Files: docs/Copilot-Instructions.md; docs/code-review.md.

### [2025-11-06] P41 — Repo snapshot macro
In order to surface a standard pre-flight snapshot, I added a Copilot instructions section detailing default triggers, output contract, and a reusable macro block.
Considerations: Scoped to docs-only and anchored for idempotent reuse without touching runtime code.
Evidence: docs-only slice (no tests required).
Files: docs/Copilot-Instructions.md.

### [2025-11-06] P46 — Protocol hardening
In order to lock prompt structure and loop safeguards, I updated Protocol.md and Copilot-Instructions.md with schema v2 headers, quarantine TTL, loop stop rules, commit-on-green matrix, repo snapshot guidance, and selector freeze language.
Considerations: Added HTML anchors for idempotent reapplication and kept scope strictly docs-only.
Evidence: docs-only slice (no tests required).
Files: docs/Protocol.md; docs/Copilot-Instructions.md.

### [2025-11-06] P42 — Turn list canonical selectors
In order to align provider UI with the new turn-list/turn-item contract, I renamed the Razor markup, tightened adapter mocks, and refreshed specs to assert the updated live-region copy.
Considerations: Bumped selectors.md to v0.7, normalized provider fixtures to emit sanitized steps, and stabilized back-to-map assertions before the full rerun.
Evidence: npx playwright test (GREEN); dotnet build apps/web-mvc (GREEN).
Files: apps/web-mvc/Program.cs; apps/web-mvc/wwwroot/js/directions.js; tests/e2e/route-adapter-error.spec.ts; docs/selectors.md.

### [2025-11-06] P41 — Rate limit probe selectors
In order to keep the probe aligned with new turn list testids, I updated the spec to rename fallback selectors and cache the provider fixture between retries.
Considerations: Adapter stub prevents extra provider calls while preserving live-region copy.
Evidence: npx playwright test tests/e2e/rate-limit-probe.spec.ts (GREEN).
Files: tests/e2e/rate-limit-probe.spec.ts.

- 2025-11-06 • P37 — 429 retry→mock + cooldown; ENV exposed; probe green.
- 2025-11-06 • Sprint-06 CLOSEOUT — Shipped provider routing + 429 cooldown; tag: sprint-06-closeout-20251106.

### [2025-11-05] TURN-LIST-1c-c — Keyboard a11y spec split
Fixtures: useGeoFixture/useRouteFixture (Union → Bryant).
Evidence: npx playwright test tests/e2e/dir-list-keyboard.spec.ts (GREEN); npm run e2e:auto (RED via TURN-LIST-1d); npm run typecheck (green).
Notes: TURN-LIST-1d parity contract added (RED) pending route-node-active selector.

### [2025-11-05] TURN-LIST-1d-b — Map/List parity wired
Stamped route nodes with data-step-index + toggled `data-testid="route-node-active"` from JS to mirror active step.
Evidence: npx playwright test tests/e2e/dir-list-parity.spec.ts (GREEN); npm run e2e:auto (GREEN); typecheck=green.
Files: apps/web-mvc/Program.cs; apps/web-mvc/wwwroot/js/directions.js.

### [2025-11-05] GEO-ADAPTER-2a — Geocoder provider From contract (RED)
Captured fixture-backed provider spec for the From typeahead ahead of adapter wiring.
Evidence: npx playwright test tests/e2e/geo-provider-from.spec.ts (RED); npm run e2e:auto (RED); typecheck=green.
Files: tests/e2e/geo-provider-from.spec.ts (test-only).

### [2025-11-05] GEO-ADAPTER-2b — Real geocoder wired to fixtures (GREEN)
Implemented RealGeocoder.search fetching `/geocode?q=` with normalization + fallback; geocoder provider spec now green via fixtures.
Evidence: npx playwright test tests/e2e/geo-provider-from.spec.ts; npm run e2e:auto; npm run typecheck.
Files: apps/web-mvc/wwwroot/js/adapters.js; tests/e2e/geo-provider-from.spec.ts.

### [2025-11-05] GEO-ADAPTER-2c-a — Geocoder timeout contract (RED)
Defined fixture-backed timeout behavior for geo-from typeahead (“Unable to search locations (timeout)”).
Evidence: npx playwright test tests/e2e/geo-provider-from-timeout.spec.ts (RED); npm run e2e:auto (RED); typecheck=green.
Files: tests/e2e/geo-provider-from-timeout.spec.ts.

### [2025-11-05] GEO-ADAPTER-2c-b — Geocoder timeout handling (GREEN)
Introduced fetchJsonWithTimeout + provider-first wiring; UI announces timeout and hides lists.
Evidence: npx playwright test tests/e2e/geo-provider-from-timeout.spec.ts; npm run e2e:auto; npm run typecheck.
Files: apps/web-mvc/wwwroot/js/adapters.js; apps/web-mvc/Program.cs.

### [2025-11-05] ENV-GEO-TIMEOUT-1 — Added GEO_TIMEOUT_MS knob
Documented geocoder timeout env flag and UX copy; docs-only, suites unchanged.

### [2025-11-05] TURN-LIST-1a — Directions list contract (RED)
Defined provider-backed directions e2e expecting dir-status + dir-step indexing.
Evidence: npx playwright test tests/e2e/dir-list.spec.ts (RED); npm run e2e:auto (RED); typecheck=green.

### [2025-11-05] TURN-LIST-UNBLOCK-TOGGLE — Provider toggle (GREEN)
Forced provider mode via __nycMock so geo/route fixtures feed dir list.
Evidence: npx playwright test tests/e2e/dir-list.spec.ts; npm run e2e:auto; npm run typecheck. Fixtures: useGeoFixture/useRouteFixture (Union→Bryant).
Files: tests/e2e/dir-list.spec.ts.

### [2025-11-05] TURN-LIST-VERIFY-1b — Provider directions list (GREEN)
Fixtures: useGeoFixture/useRouteFixture (Union → Bryant).
Evidence: npx playwright test tests/e2e/dir-list.spec.ts; npm run e2e:auto; npm run typecheck.
Files: tests/e2e/dir-list.spec.ts.

### [2025-11-05] DOC-SEL-DIR-1a — Predeclared directions selectors (dir-list/dir-step/dir-status) and a11y notes.
In order to lock upcoming provider turn list UX, I documented the dir selectors and keyboard/live-region rules.
Evidence: docs-only; suites unchanged.

### [2025-11-04] ROUTE-FIND-WIRE-1a — Provider Find contract (RED)
Goal: captured fixture-backed Find flow expectations ahead of real provider wiring.
Evidence: npx playwright test tests/e2e/route-find-provider.spec.ts (RED); npm run e2e:auto (RED); typecheck=green.
Files: tests/e2e/route-find-provider.spec.ts.

### [2025-11-04] ROUTE-ADAPTER-REAL-1a — Normalize provider payload (RED)
Defined normalizeRoutePayload contract for real adapters (path + steps with plain text).
Evidence: npx playwright test tests/unit/route-adapter-real.spec.ts (RED); npm run e2e:auto (RED); typecheck=green.
Files: tests/unit/route-adapter-real.spec.ts.

### [2025-11-04] ROUTE-ADAPTER-REAL-1b — Implement normalizeRoutePayload
Added adapters.js normalizer returning {path,steps} with numeric coords + plain text instructions.
Evidence: npx playwright test tests/unit/route-adapter-real.spec.ts (1/1 green); npm run e2e:auto (RED via ROUTE-FIND-WIRE-1a); typecheck=green. Touches: apps/web-mvc/wwwroot/js/adapters.js.

### [2025-11-04] FIXTURE-HELPER-1 — Provider fixtures
Added geo/route Playwright helper interceptors with once support for deterministic provider tests.
Evidence: npx playwright test tests/unit/provider-fixtures.spec.ts; npm run e2e:auto; typecheck=green.
Files: tests/helpers/provider-fixtures.ts; tests/unit/provider-fixtures.spec.ts.

### [2025-11-04] EXTRACT-ADAPTERS-1 — Provider config serialized
Moved ProviderConfig JSON emission into Program.cs and adapters.js to own modules while keeping Program.cs lean.
Evidence: dotnet build apps/web-mvc; #tests=70, green=true; typecheck=green.
Files: apps/web-mvc/Program.cs; apps/web-mvc/Adapters/ProviderConfig.cs; apps/web-mvc/wwwroot/js/adapters.js.

### [2025-11-04] ENV-RECOVER-DTB-1 — Environment recovered
Restored TypeScript tooling, reran dev:probe hot reload, and reverified smoke suite.
Evidence: dev:probe=hot reload succeeded; #tests=70, green=true; typecheck=green.

### [2025-11-04] EXTRACT-ADAPTERS-1 — Adapters extracted
Centralized provider config + default adapters into dedicated files; Program.cs now only boots config and scripts.
Evidence: dotnet build apps/web-mvc; #tests=70, green=true; typecheck=green. Touches: SMELL-HTML-EXTRACT.
Files: apps/web-mvc/Program.cs; apps/web-mvc/Adapters/ProviderConfig.cs; apps/web-mvc/wwwroot/js/adapters.js.

### [2025-11-03] DOC-COPILOT-SUMMARY-1 — Standardized summaries
Evidence: #tests=70, green=true; typecheck=green.
Notes: Responses now start with “Completed Prompt: <TITLE>” and commits prefix `[user] <TITLE>`.

### [2025-11-03] DOC-GATE-S6-REV — Sprint 06 readiness gate
Evidence: #tests=70, green=true; typecheck=green.
Notes: codified ask≥3% rule, provider fallback docs, fixture helper slated for PROV-FIXTURES-1a.

### [2025-11-03] DOC-SEL-GOV-1b — selectors governance finalized
Evidence: #tests=70, green=true; typecheck=green.
Notes: closed open editor/state; safe process cleanup (no pwsh kill).

### [2025-11-03] DOC-SEL-SOP — Selector governance
Why: Prevent selector drift by requiring predeclare/version/log.
Evidence: docs-only; selectors.md v0.5; protocol gate added.

### [2025-11-03] QA-VERIFY-TIMEOUT — Flake check
Why: Confirmed no recurrence of prior timeout under full suite.
Evidence: #tests=70, green=true; typecheck=green.

### [2025-11-03] DOC-WORKFLOW-S6 — Sprint 6 workflow tweaks
Documented Sprint 6 workflow upgrades and linked DoD/stop hooks in Protocol.
Evidence: #tests=70, green=true; typecheck=green.
Files: docs/Workflow-Tweaks-S6.md, docs/Protocol.md, docs/code-review.md, docs/project-history.md.

### [2025-11-04] PATH-HELPER-1 — Centralized POI detail path
Purpose: single source of truth for POI detail JSON path via ContentPathHelper.
Evidence: #tests=70, green=true; typecheck=green.
Touches: SMELL-PATH-HELPER.

### [2025-11-04] CONST-LOCAL-1d — Path constants + overlay z-index
Hoisted route overlay stroke width, node radius, and z-index into CFG_PATH with no visual changes.
Evidence: #tests=68, green=true; typecheck=green.
Files: apps/web-mvc/Program.cs, docs/code-review.md, docs/CODE-SMELL-ANALYSIS.md.

### [2025-11-03] CONST-LOCAL-1b — Route block cap constant
Codified the ≤3-per-block guard in buildRoute via CFG_ROUTE.BLOCK_CAP without changing behavior.
Evidence: #tests=68, green=true; typecheck=green.
Files: apps/web-mvc/wwwroot/js/home.js, docs/code-review.md, docs/CODE-SMELL-ANALYSIS.md.

### [2025-11-04] CONST-LOCAL-1c — Typeahead debounce constant
Centralized the 250ms geo typeahead debounce into CFG_UI.DEBOUNCE_MS with zero behavioral drift.
Evidence: #tests=68, green=true; typecheck=green.
Files: apps/web-mvc/Program.cs, docs/code-review.md, docs/CODE-SMELL-ANALYSIS.md.

### [2025-11-03] REL-PUSH-1a — Release push logging + contracts
Re-pushed logging + failure guards to main and re-verified full suite.
Evidence: #tests=68, green=true; typecheck=green.
Files: docs/code-review.md, docs/project-history.md.

### [2025-11-03] ERR-LOG-POI-1c — PoiController logging + 500 UX
Added structured logging around POI JSON loading and captured forced-500 UX via Playwright.
Evidence: #tests=full, green=true; typecheck=green. Touches: SMELL-ERROR-HANDLING.

### [2025-11-03] FETCH-GUARD-2b — POI fetch timeout UX
Handled stalled POI loads with AbortController and live-region copy (“Unable to load POIs (timeout)”).
Evidence: #tests=full, green=true; typecheck=green. Touches: SMELL-ERROR-HANDLING.

### [2025-11-03] FETCH-GUARD-1b — POI load error UX
Guarded fetch with live error message and route clear; verified via poi-load-error.spec.
Evidence: #tests=full, green=true; typecheck=green. Touches: SMELL-ERROR-HANDLING

### [2025-11-03] DRY-PATH-1 — Route path helper
In order to remove duplicated SVG path drawing, I factored a `renderRoutePath` helper reused by POI segments and adapter overlays.
Considerations: Preserved selectors, aria, and map redraw timing; share state + clear routines untouched.
Evidence: #tests=64, green=true (typecheck=green); dotnet build apps/web-mvc.
Files: apps/web-mvc/Program.cs.

### [2025-11-03] RETRO-05 — Sprint 5 postmortem
Captured Sprint 05 retro covering geocoder/typeahead wins, share UX, and Sprint 06 risks.
Considerations: Highlighted Program.cs LOC pressure, Playwright hangs, and prompting guardrails.
Evidence: #tests=64, green=true (typecheck=green).

### [2025-11-03] DOC-REL-1 — deep-link/share documentation
Captured README onboarding for mock providers, env defaults, and clipboard share UX so fresh clones can exercise POI + adapter routes.
Considerations: Clarified selector contracts (share-link, ta-option) and mapped adapter deep-link params without touching runtime code.
Evidence: docs-only; e2e:auto + typecheck rerun for traceability.

### [2025-11-03] ROUTE-SHARE-UI-1b — share link control
In order to let researchers share active routes, I added a [data-testid="share-link"] button that copies window.location.href.
Considerations: Announces "Link copied." or "Unable to copy link.", keeps adapter and POI parity, and defaults disabled until a route exists.
Evidence: #tests=64, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~55 LOC).

### [2025-11-03] ROUTE-ADAPTER-ERR-UX-1b — adapter error UX polish
In order to make adapter failures accessible, I set the live region to "Unable to build route.", cleared overlays on error, and reused the adapter path on recovery.
Considerations: Keeps POI mismatch copy intact and reuses overlay mode when segment steps lack coords.
Evidence: #tests=61, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs.

### [2025-11-03] ROUTE-ADAPTER-1b — MockRouteEngine gated
In order to satisfy the L-path contract, I gated a MockRouteEngine behind __nycMock.route so tests get deterministic paths and segments.
Considerations: Keeps default route adapters for UI flows, builds [from, corner, to] once, and avoids fetch while returning [] on bad payloads.
Evidence: #tests=58, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~30 LOC), tests/unit/mock-route-engine.spec.ts (~5 LOC).

### [2025-11-03] GEO-ADAPTER-1b-b — MockGeocoder wired
In order to satisfy the adapter contract, I injected a normalized in-memory MockGeocoder gated by GEO_PROVIDER while preserving test overrides.
Considerations: Keeps search arity >=1, blocks fetch usage, and leaves the UI combobox code untouched beyond DI.
Evidence: #tests=57, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~45 LOC).

### [2025-11-02] GEO-UI-Perf-2b — To typeahead debounce
In order to mirror the From combobox, I added a 250ms debounce with request versioning so stale geo-to responses drop while status copy stays shared.
Considerations: Leaves geo-from code untouched and keeps ta-list ownership swapping clean between inputs.
Evidence: #tests=targeted+full, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~50 LOC).

### [2025-11-02] GEO-UI-Perf-1b — From typeahead debounce
In order to keep geo-from suggestions fresh, I debounced queries, ignored stale responses, and surfaced Searching/“N results” status per the contract.
Considerations: Scope stayed on geo-from so To combobox wiring and route flows remain untouched while default adapters now report “No results.”
Evidence: #tests=targeted+full, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~40 LOC), tests/e2e/geo-typeahead-debounce.spec.ts, tests/e2e/geo-typeahead-adapter.spec.ts.

### [2025-11-02] GEO-ADAPTER-1b-fix — adapter arities aligned
In order to lock our DI contract to the docs, I added default geo/route adapter stubs with explicit parameters and wrappers so length checks stay ≥1 without altering behavior.
Considerations: Geo current stubs are flagged as defaults so the UI still short-circuits unavailable providers; segment/path fall back to local logic when adapters decline.
Evidence: #tests=targeted+full, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~18 LOC), tests/unit/adapters-contract.spec.ts (new), docs/code-review.md, docs/project-history.md.

### [2025-11-02] ROUTE-SHARE-POI-verify — POI deep-link sanity
In order to confirm adapter changes left legacy routes untouched, I reran the POI deep-link spec plus the full suite and typecheck with no app edits.
Considerations: Legacy from/to pushState and back/forward behavior remain unchanged, so no code follow-up required.
Evidence: #tests=targeted+full, green=true (typecheck=green).
Files: docs/code-review.md, docs/project-history.md.

### [2025-11-02] DEV-ENV-1b — mock env quickstart
In order to make setup reproducible, I documented APP_PORT/GEO_PROVIDER/ROUTE_PROVIDER in .env.example and added a README mocks quickstart.
Considerations: Real provider slots stay blank; Adapters.md now maps env flags to window.App.adapters without changing app code.
Evidence: #tests=0, green=NA (typecheck=NA).
Files: .env.example (~10 LOC), README.md (~20 LOC), docs/Adapters.md (~10 LOC).

### [2025-11-02] GEO-UI-5c-b — To current location control
In order to mirror the From combobox, I wired geo.current to populate the To input, persist coords, and announce success while closing the dropdown.
Considerations: Button disables during lookup, reuses live status copy, and leaves existing flows untouched on adapter errors.
Evidence: #tests=51, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~35 LOC).

### [2025-11-02] GEO-UI-5b — current location control
In order to autopopulate From, I wired geo.current to fill the combobox, store coords, and hide suggestions with a success status.
Considerations: Button disables while pending, keeps combobox aria state, and leaves input untouched on adapter errors.
Evidence: #tests=49, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~45 LOC).

### [2025-11-02] ROUTE-ADAPTER-PATH-1b — adapter path overlay
In order to surface geocoder-only routes, I call RouteAdapter.path when POI segments fail and reuse the SVG overlay for the polyline and nodes.
Considerations: Clears markers/overlay on mismatches and leaves pushState scoped to POI routes.
Evidence: #tests=47, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~28 LOC).

### [2025-11-02] GEO-UI-4b — GeoAdapter-powered To typeahead
In order to keep both comboboxes consistent, I route To searches through App.adapters.geo.search with live Searching/No results/Error status and persist selected lat/lng/label.
Considerations: Mirrors From wiring without touching RouteAdapter flows; clears status when selection completes.
Evidence: #tests=46, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~28 LOC).

### [2025-11-02] GEO-UI-3c — GeoAdapter-powered From typeahead
In order to surface live geocoder suggestions, I call App.adapters.geo.search, announce Searching/No matches status, and persist lat/lng/label on From selections.
Considerations: Gracefully fall back to suggest stubs when search is absent and hide the list on adapter errors.
Evidence: #tests=45, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~30 LOC).

### [2025-11-02] GEO-UI-3b — Persist geocode coords
In order to pass adapter coords from typeaheads, I store lat/lng on selections, sync route inputs, and forward typed coords within RouteAdapter calls.
Considerations: Route fallback now tolerates non-POI geocodes while preserving pushState for POI-backed routes only.
Evidence: #tests=44, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~55 LOC).

### [2025-11-02] ROUTE-ADAPTER-1c-b — RouteAdapter preferred
In order to consume adapter segments, I routed Find through window.App.adapters.route.segment with a fallback to the local segmenter.
Considerations: Skip marker/polyline overlays when adapter steps lack coords while keeping history/live copy intact.
Evidence: #tests=43, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~40 LOC).

### [2025-11-02] DOC-QGATE-Thresholds — Clarify-then-execute gate
In order to reduce clarifying-question churn, I codified 10%/5%/15% lift thresholds and ≤2min/≤3 question caps.
Considerations: Docs-only update across Protocol and Copilot instructions to keep guidance concise.
Evidence: #tests=0, green=NA (typecheck=NA).

### Sprint 03

### [2025-11-02] GEO-UI-2c — To typeahead keyboard/a11y
In order to match the From combobox, I layered To with combobox roles, aria-activedescendant updates, and arrow/Esc/Enter handling plus live status copy.
Considerations: Shared status messaging now reports Option N of total; From/To lists keep exclusive ta-list ownership.
Evidence: #tests=41, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~58 LOC).

### [2025-11-02] GEO-UI-2b — To typeahead mouse selection
In order to mirror the From combobox for destinations, I wired a To input that fetches suggestions and applies click-to-select results.
Considerations: Shared suggest/search helper keeps From behavior intact; keyboard + live region remain deferred.
Evidence: #tests=41, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~54 LOC).

### [2025-11-02] GEO-UI-1c-b — Typeahead keyboard polish
In order to deliver keyboard/a11y parity for the From typeahead, I applied combobox roles, aria-activedescendant wiring, and live status copy.
Considerations: List clamps at ends, mouse flow untouched, live region clears on ESC.
Evidence: #tests=40, green=true (typecheck=green).
Files: apps/web-mvc/Program.cs (~55 LOC).

### [2025-11-02] FORM-A11Y-1b — Docs verification
In order to confirm bound labels on Search/From/To, I reran the full suite with doc-only edits.
Considerations: Accessibility parity maintained; no UI behavior changes.
Evidence: e2e=39/40 (GEO-UI-1c-a RED expected); typecheck=green.
Files: docs/code-review.md, docs/project-history.md.

### [2025-11-02] FORM-A11Y-1b — Bound visible labels
In order to finish the form accessibility slice, I added block-level labels wired to Search/From/To without altering layout.
Considerations: Raw string indentation is brittle; full suite still includes expected GEO-UI-1c-a RED.
Evidence: #tests=40, green=false (typecheck=green).
Files: apps/web-mvc/Program.cs (net +0 LOC).

### [2025-11-01] GEO-UI-1b — From typeahead dropdown
In order to satisfy the new typeahead contract, I rendered the geo-from input, mock-aware dropdown, and click-to-select handler.
Considerations: Mouse-only slice; keyboard/a11y polish deferred to GEO-UI-1c.
Evidence: geo-typeahead-basic=green; e2e=39/39; typecheck=green; files: apps/web-mvc/Program.cs.

### [2025-11-01] GEO-ADAPTER-0 — Adapters documented
In order to keep Sprint 5 slices provider-agnostic, I defined Geo/Route adapters, mock fixtures, and the DI handoff.
Considerations: Docs-only guidance including .env toggles; production keys deferred.
Evidence: #tests=0, green=NA; files: docs/Adapters.md, docs/Protocol.md, docs/Copilot-Instructions.md, .env.example.

### [2025-11-01] DOC-S5-PLAN — Sprint 5 plan published
In order to align Sprint 5 before coding, I captured goals, split backlog slices, and reinforced selector/a11y contracts.
Considerations: Docs-only slice keeping ≤60 LOC/file guidance explicit.
Evidence: #tests=0, green=NA; files: docs/Sprint-05-Plan.md, docs/code-review.md.

### [2025-11-01] DOC-SEL-GEO — Geocoder selectors documented
In order to unblock GEO-UI slices, I defined geocoder/typeahead selectors and refreshed the required read order.
Considerations: Docs-only contract for accessibility attributes and adapter names.
Evidence: #tests=0, green=NA; files: docs/selectors.md, docs/Protocol.md.

### [2025-11-01] DOC-SEL-GEO — Sprint 5 selector hooks
In order to unblock GEO-UI and ROUTE-FIND slices, I documented typeahead, current location, and focus selectors in v0.4.
Considerations: Docs-only contract; enforces data-testid + aria attributes before code lands.
Evidence: #tests=0, green=NA; files: docs/selectors.md, docs/Protocol.md.

### [2025-11-01] SPRINT-04-CLOSEOUT — Release candidate published
In order to freeze Sprint 4, I captured the changelog and release notes, re-ran full suites, and tagged v0.4.0-rc.
Considerations: Docs-only slice; runtime code untouched.
Evidence: e2e=38/38; typecheck=green.

### [2025-11-01] FORM-A11Y-1b — Labeled route inputs
In order to keep the form accessible, I added visible labels wired to Search/From/To and sanitized marker aria-labels so tests stay unique.
Considerations: Inline label/script tweaks only; routing, filtering, and overlays behave the same.
Evidence: e2e=38/38; typecheck=green; files: apps/web-mvc/Program.cs.

### [2025-11-01] ENC-PLACEHOLDER-1a — UTF-8 placeholder contract
In order to lock placeholder encoding, I added a Playwright RED spec covering search/from/to inputs.
Considerations: Currently fails because Search placeholder renders mojibake (`Search POIsâ€¦`).
Evidence: #tests=1, green=false; typecheck=not-run.

### [2025-11-01] ENC-PLACEHOLDER-1b — UTF-8 meta+header
In order to serve real ellipses, I added a UTF-8 meta tag plus charset header and reran the suite.
Evidence: placeholder-encoding=green; e2e=37/37; typecheck=green.

### [2025-11-01] TOOL-ARTIFACTS-1a — Ignore VIS artifacts
In order to keep commits clean, I ignored docs/artifacts/* with a .gitkeep to preserve the folder. Full suite + typecheck remain green.
Evidence: e2e=all green; typecheck=0 errors.

### [2025-11-01] TOOL-DEV-LOOP-2c — Restore Razor baseline
In order to keep the hot-reload probe reliable, I restored Detail.cshtml to HEAD and reran the full verification loop.
Considerations: Avoid manual tweaks to Razor views while probes execute to prevent false failures.
Evidence: dev:probe=0; typecheck=0; e2e=36/36 green.

### [2025-11-01] ROUTE-FIND-3b — URL history wired
In order to sync the UI with the address bar, I pushState on Find and reuse popstate to restore/reset steps, highlights, and the live message.
Considerations: Single-file change under 60 LOC; reuse existing helpers; suppress pushState while handling popstate/deep links to dodge loops.
Evidence: #tests=36, green=true; typecheck=green; files: apps/web-mvc/Program.cs.

### [2025-11-01] ROUTE-FIND-3a — URL history contract
In order to support sharable state and proper nav, I added an e2e spec asserting pushState on Find plus Back/Forward UI sync.
Considerations: Deterministic copy and existing selectors keep the checks stable; implementation deferred to next slice.
Evidence: #tests=1, green=false; typecheck=not-run; files: tests/e2e/route-history.spec.ts.

### [2025-11-01] ROUTE-ANNOUNCE-1b — Live route messaging
In order to improve a11y, I wired the route live region to announce success, reset, and mismatch states.
Considerations: Deterministic copy runs through shared Find/deep-link paths so every trigger updates consistently.
Evidence: #tests=35, green=true; typecheck=green; files: apps/web-mvc/Program.cs; tests/e2e/route-announce.spec.ts; tests/e2e/route-reset.spec.ts; tests/e2e/route-share.spec.ts.

### [2025-11-01] ROUTE-PATH-1b — Route path overlay
In order to visualize active segments, I draw an SVG polyline with step nodes atop the marker overlay when a route matches.
Considerations: Map move/zoom events trigger a redraw so markers stay aligned while pointer-events remain disabled for the path.
Evidence: #tests=34, green=true; typecheck=green; files: apps/web-mvc/Program.cs.

### [2025-11-01] ROUTE-SHARE-1b — Deep link From/To
In order to share specific segments, I reused the Find handler on load when ?from&to exist so steps and markers hydrate instantly.
Considerations: Fallback handles missing/invalid params by clearing highlights and showing the existing route message.
Evidence: #tests=32, green=true; files: apps/web-mvc/Program.cs.

### [2025-11-01] ROUTE-FIND-2b — Active marker highlight
In order to verify route order on the map, I toggled overlay markers with `data-step-index` and `aria-current="step"` per segment.
Considerations: Clear markers on each run so stale highlights drop when spans change.
Evidence: #tests=29, green=true; files: apps/web-mvc/Program.cs, apps/web-mvc/wwwroot/js/home.js.

### [2025-11-01] ROUTE-FIND-1d — Route segment type guard
In order to keep tests lightweight, I relaxed `routeSegment` to accept a minimal POI shape without touching runtime logic.
Considerations: Sorting fallback still favors names when orders are missing.
Evidence: #tests=28, green=true; files: apps/web-mvc/route.ts.

### [2025-11-01] ROUTE-FIND-1b — Deterministic From/To segment helper
In order to return precise route slices, I implemented `routeSegment()` with route safeguards and inclusive slicing.
Considerations: Coordinates remain required; UI wiring waits for ROUTE-FIND-1c.
Evidence: #tests=4, green=true; files: apps/web-mvc/route.ts.

### [2025-11-01] ROUTE-FIND-1a — Contract tests for From/To
In order to define routing behavior, I added unit+e2e tests for From/To segmenting and mismatch UX.
Considerations: routeSegment export missing and UI handler absent, so tests remain RED by design.
Evidence: #tests=2, green=false.

### [2025-11-01] DOC-DEV-LOOP-SNIPPET — Dev loop commands clarified
Documented the `npm run e2e:ui` and `npm run dev:api` aliases under Playwright Usage so the loop mirrors our tooling.
Evidence: #tests=0, green=NA; files: docs/Protocol.md.

### [2025-11-01] DOC-PLAYBOOK-4 — Decisions rule links format
Updated Playbook Rule #4 with a link to the Decisions guide plus an inline example entry so new contributors see the format instantly.
Evidence: #tests=0, green=NA; files: docs/Playbook.md.

### [2025-11-01] DOC-SEL-S4 — Active route selectors captured
Documented the Sprint 04 selectors (`poi-marker-active`, `route-msg`, `data-step-index`, `aria-current="step"`) under a dedicated Active Routes section.
Evidence: #tests=0, green=NA; files: docs/selectors.md.

### [2025-11-01] DOC-READ-ORDER — Copilot read order synced
Inserted the canonical “Read Order (always)” list so prompts reference the same sequence as Protocol.
Evidence: #tests=0, green=NA; files: docs/Copilot-Instructions.md.

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
