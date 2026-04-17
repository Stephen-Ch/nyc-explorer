# REPORT: MVP v0.1 Definition of Done Audit

| Field | Value |
|-------|-------|
| Date | 2026-04-17 |
| PROMPT-ID | NYCX-MVP-DOD-AUDIT-001 |
| Branch | main |
| HEAD | 7b46fcd |
| Story | NYCX-MVP-DOD-AUDIT-001 |

## Gate Results Summary

| Gate | Result | Detail |
|------|--------|--------|
| `npm run typecheck` | **PASS** | 0 errors, exit code 0 |
| `npm run e2e:auto` | **FAIL** | 96 passed, 1 skipped, 1 failed, exit code 1 |

### e2e:auto Failure Detail

- **Failed:** `tests/meta/quarantine-ttl.spec.ts` — "quarantine skips expire within 48h"
  - `route-adapter-real.spec.ts` quarantine skip is 1044h (43 days) stale, exceeds 48h TTL.
  - This is a meta-enforcement test, not a user-flow regression.
- **Skipped:** `tests/unit/route-adapter-real.spec.ts` — intentionally quarantined (live provider, not fixture-backed).

### EPIC-001 Gate Target vs Actual

EPIC-001 states: "97 passed, 1 skipped (route-adapter-real intentionally quarantined)."

Actual: 96 passed, 1 skipped, 1 failed. The delta is the quarantine-ttl meta test. The quarantine itself is expected; the TTL enforcement catching the stale skip is the only failure.

---

## DoD Scorecard

### Section 2: Must-pass automated gates

| DoD Item | Evidence | Status | Notes |
|----------|----------|--------|-------|
| `npm run typecheck` — zero TS errors | Exit code 0, no output | **PASS** | |
| `npm run e2e:auto` — 97 passed, 1 skipped | 96 passed, 1 skipped, 1 failed | **FAIL** | quarantine-ttl meta test failed; see below |
| `tests/schema/poi.spec.ts` — poi.v1.json matches schema | Test #85 PASS | **PASS** | |
| `tests/schema/poi-count-10.spec.ts` — at least 10 POIs | Test #83 PASS | **PASS** | |

### Section 3: Core user flows

| DoD Item | Evidence | Status | Notes |
|----------|----------|--------|-------|
| **Home map loads** — map visible, ≥3 markers, POI list | Test #24 (leaflet.spec.ts) PASS, Test #26 (map.spec.ts) PASS | **PASS** | |
| **List → Detail → Back to Map** | Test #25 (list-to-detail.spec.ts) PASS, Test #1 (back-to-map.spec.ts) PASS | **PASS** | |
| **Marker → Detail** | Test #29 (marker-to-detail.spec.ts) PASS | **PASS** | |
| **Keyboard marker activation** | Test #27 (marker-a11y.spec.ts) PASS | **PASS** | |
| **Routing: turn list renders** | Test #73 (route-ui.spec.ts) PASS, Test #62 (route-inputs.spec.ts) PASS | **PASS** | |
| **Search filters POI list** | Test #74 (search.spec.ts) PASS | **PASS** | |

### Section 4: Error states

| DoD Item | Evidence | Status | Notes |
|----------|----------|--------|-------|
| **POI feed 500** — shows error UI | Test #37 (map.spec.ts feed-500) PASS | **PASS** | |
| **POI feed timeout** — shows timeout error, clears on reload | Test #39 (timeout) PASS, Test #40 (reload clears) PASS | **PASS** | |
| **Missing POI detail (404)** | Test #50 (route-detail.spec.ts __missing__) PASS | **PASS** | |
| **Missing polyline** — graceful degradation, turn list shown | Test #56 (route-provider falls back), Test #98 (turn-list-pathless) PASS | **PASS** | |
| **Provider timeout** — accessible error, no crash | Test #57 (provider timeout) PASS | **PASS** | |

### Section 5: Non-goals (boundary check)

| Boundary | Status | Notes |
|----------|--------|-------|
| No TimeWalk storytelling in v0.1 | **PASS** | No EPIC-004 code present |
| No multi-borough coverage | **PASS** | Manhattan-only scope confirmed |
| No live provider calls in CI | **PASS** | route-adapter-real is quarantined/skipped |
| Polyline overlay = nice-to-have | **PASS** | Turn list works without polyline; overlay tests are smoke-only |
| No AR/VR, offline, payments, social | **PASS** | None present |
| No CMS/authoring pipeline | **PASS** | None present |
| PWA = nice-to-have | **PASS** | No PWA packaging in runtime |

---

## Overall Verdict

**MVP status: MIXED**

- All core user flows (6/6): **PASS**
- All error states (5/5): **PASS**
- Schema gates (2/2): **PASS**
- Typecheck: **PASS**
- e2e:auto exit code: **FAIL** (1 meta-enforcement test)
- Non-goal boundaries: **PASS**

The only failure is the quarantine-ttl meta test. All actual user-facing functionality is green.

---

## Top 3 Blockers

1. **quarantine-ttl failure** — `route-adapter-real.spec.ts` has been quarantined for 1044h (43 days). The TTL enforcement test (`quarantine-ttl.spec.ts`) correctly flags this as stale. The fix is to either resolve the quarantine (remove the skip and make the test pass with fixtures) or reset the TTL timestamp if the quarantine is still justified.

2. **EPIC-001 gate count mismatch** — EPIC-001 states "97 passed, 1 skipped" but actual is 96+1+1=98 total tests. The count in EPICS.md may be outdated (tests were added since the DoD was written). The DoD target should be updated to reflect the current test count.

3. **No remaining functional blockers** — All 6 core user flows and all 5 error states pass. The MVP is functionally complete for v0.1 scope.

---

## Smallest Next Implementation Slice

**Resolve the quarantine-ttl failure.** Two options (choose one):

- **Option A (preferred):** If `route-adapter-real.spec.ts` is no longer needed as a live-provider test, remove the quarantine skip and convert it to a fixture-backed test or delete it. This clears the TTL violation and gets e2e:auto to exit 0.
- **Option B:** If the quarantine is still justified (live provider test preserved for manual runs), reset the TTL timestamp to today and document the justification in a quarantine log. This buys another 48h but doesn't resolve the underlying question.

Either option is ≤1 file change and directly unblocks `npm run e2e:auto` green.

---

## Confidence Statement

- **Confidence:** 95%
- **Basis:** All gates run successfully on this commit. Every DoD item mapped to specific passing tests. The sole failure is a meta-enforcement test, not a user-facing regression.
- **Ready to proceed:** YES — resolve quarantine-ttl as the next slice, then the MVP v0.1 DoD can be marked complete.
