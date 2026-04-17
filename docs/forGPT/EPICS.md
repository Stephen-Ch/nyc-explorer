# NYC Explorer — Epics

## EPIC-001 — Manhattan Explorer MVP
**Status:** COMPLETE (declared 2026-04-17; green baseline at `e582dfa`)

**Description:** Ship a reliable Manhattan-only map + list + POI detail experience focused on Union Square + Flatiron, backed by a stable JSON schema and deterministic Playwright coverage. Success means core navigation, data loading, and error states are consistently green in CI.

## MVP v0.1 Definition of Done

### 1. Scope
- Manhattan only; areas: Union Square + Flatiron
- Map-first experience: map and POI list render on home page load
- Data source: `content/poi.v1.json` validated by schema tests

### 2. Must-pass automated gates
- [x] `npm run typecheck` — zero TypeScript errors
- [x] `npm run e2e:auto` — all tests pass (exit code 0); one intentionally deferred test (`route-adapter-real` Test 2) is skipped and does not count as a failure. CI is fixture-backed only; live provider calls are manual/post-MVP.
- [x] `tests/schema/poi.spec.ts` — `content/poi.v1.json` matches schema (covered by e2e:auto)
- [x] `tests/schema/poi-count-10.spec.ts` — at least 10 POIs present (covered by e2e:auto)

### 3. Core user flows
- [x] **Home map loads** — map container `#map` visible, Leaflet markers ≥ 3 render, POI list items visible → `tests/e2e/map.spec.ts`, `tests/e2e/leaflet.spec.ts`
- [x] **List → Detail → Back to Map** — clicking a POI list item navigates to `/poi/{id}`, detail page shows title and back-to-map link, clicking back returns to home with map → `tests/e2e/list-to-detail.spec.ts`, `tests/e2e/back-to-map.spec.ts`
- [x] **Marker → Detail** — clicking a map marker navigates to detail page showing POI title → `tests/e2e/marker-to-detail.spec.ts`
- [x] **Keyboard marker activation** — pressing Enter on a focused marker navigates to detail page → `tests/e2e/marker-a11y.spec.ts`
- [x] **Routing: turn list renders** — entering From + To inputs and clicking Find Route shows route step list → `tests/e2e/route-ui.spec.ts`, `tests/e2e/route-inputs.spec.ts`
  - Note: polyline overlay is not required for MVP v0.1; turn list only is sufficient.
- [x] **Search filters POI list** — typing in search input filters visible POI items by name (case-insensitive) → `tests/e2e/search.spec.ts`

### 4. Error states
- [x] **POI feed 500** — when `/content/poi.v1.json` returns 500, page shows generic error UI → `tests/e2e/map.spec.ts` (feed-500 contract test)
- [x] **POI feed timeout** — when feed stalls, timeout error message appears and clears on reload → `tests/e2e/map.spec.ts` (timeout + reload contract tests)
- [x] **Missing POI detail (404)** — `/poi/__missing__` returns 404 → `tests/e2e/route-detail.spec.ts`
- [x] **Missing polyline** — routing response without polyline degrades gracefully, turn list still shown → `tests/e2e/route-detail.spec.ts`, `tests/unit/turn-list-pathless.spec.ts`
- [x] **Provider timeout** — geocoder/route provider timeout shows accessible error message without crash → `tests/e2e/route-detail.spec.ts` (timeout contract)

### 5. Non-goals (v0.1)
- TimeWalk historical storytelling (EPIC-004) — not in scope
- Multi-borough coverage (Brooklyn, Queens, Bronx, Staten Island)
- Live provider API calls in CI (fixture-backed only; live calls are manual/post-MVP)
- Polyline overlay rendering (nice-to-have; turn list is sufficient for MVP)
- AR/VR, offline packs, payments, social features
- CMS or authoring pipeline
- Mobile-specific layouts or PWA packaging
- Installable PWA is NICE-TO-HAVE in v0.1 (not required for DoD).

### 6. Eric-story MVP — Decisions (D1–D3)
- D1 (Geocoding provider): YES — Google-first, behind server-side proxy; swap-later acceptable.
- D2 (PWA installability): NICE-TO-HAVE for v0.1 (not required for DoD).
- D3 (Along-route corridor math): YES — Turf.js acceptable for v0.1 corridor filtering/scoring; replaceable later.

---

## EPIC-002 — Provider-ready Routing + Directions (Fixture-backed)
**Status:** IN PROGRESS

**Description:** Make geocoding and routing provider-ready without live network calls in CI by using fixtures and interception, and render a basic accessible turn list. Success means provider wiring can be exercised in tests, rate-limit behaviors are governed, and route UX stays predictable.

## EPIC-003 — Content Contract + Validation
**Status:** IN PROGRESS

**Description:** Lock the content contract (schema v1) with validation tests and clear upgrade rules so UI and data can evolve without silent breakage. Success means schema changes are deliberate, additive when possible, and verified through tests and documentation.

## EPIC-004 — Historical TimeWalk Expansion (Future)
**Status:** PLANNED

**Description:** Extend the product into year-specific, source-backed storytelling and routing aligned with TimeWalk research materials. Success means the project can add historically grounded context while maintaining rights clarity, attribution, and measurable coverage.

## EPIC-005 — Workflow, Quality Gates, and Documentation
**Status:** IN PROGRESS

**Description:** Keep development safe and repeatable via the vibe-coding kit, clear Control Deck docs (VISION/EPICS/NEXT), and a small set of enforceable gates. Success means contributors can start a session, run the Doc Audit, and follow a consistent prompt-only loop without drift.

Last updated: 2026-04-17
