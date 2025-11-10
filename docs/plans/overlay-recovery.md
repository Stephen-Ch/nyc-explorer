# Overlay Recovery Plan (v1) — ✅ COMPLETE
**Status:** COMPLETE (2025-11-10)
**Baseline:** sprint-06-closeout-20251106@dfbf54a; worktree baseline/sprint06-verify
**Freeze:** LIFTED (partial lift RFC approved; default-on overlay core)
**Selectors:** v0.7 (locked throughout recovery)
**Quarantine:** route-adapter-real.spec.ts — ROUTE-ADAPTER-2a (TTL refreshed 2025-11-09, unchanged)
**Test Status:** 97/98 passing (3/3 overlay smokes GREEN)
**Branch:** overlay-drift-20251108-155953 @ commit 3cc1bd5
**Commits:** 18 total (16 slices: OR-00 through OR-08B)

## Completed Slices
- ✅ OR-00 — docs infrastructure (INDEX.md, RFC, CI-Policy)
- ✅ OR-01 — fixtures (happy / missing polyline / timeout)
- ✅ OR-02 — e2e smoke stubs (3 tests, all skipped initially)
- ✅ OR-03 — overlay module stubs (overlay-core.js, overlay-announce.js)
- ✅ OR-04 — recovery plan scaffold
- ✅ OR-05 — flag wire-up (Program.cs startup-baked, default OFF)
- ✅ OR-06A — core helpers (buildPolyline, normalizeStep, toPointsFromPolyline, buildSvgPath)
- ✅ OR-06B — happy path smoke unskipped → GREEN
- ✅ OR-06C — decodePolyline stub + routing
- ✅ OR-06D — renderSvgPolyline helper
- ✅ OR-06E — happy smoke enhanced with SVG assertion
- ✅ OR-07A — renderPolylineOrError (missing polyline handler)
- ✅ OR-07B — missing-polyline smoke unskipped → GREEN
- ✅ OR-07C — renderTimeoutBanner (timeout handler)
- ✅ OR-07D — timeout smoke unskipped → GREEN
- ✅ OR-08A — freeze-lift RFC + approval checklist + CI-Policy update
- ✅ OR-08B — default-on inert overlay core load (OVERLAY_RECOVERY=0 to disable)

## Delivered Assets
**Code:**
- `wwwroot/js/_overlay/overlay-core.js` — 8 helper functions (pure, inert)
- `wwwroot/js/_overlay/overlay-announce.js` — 1 stub function (ariaAnnounce)
- `tests/fixtures/overlay/` — 3 JSON fixtures (route-happy, route-missing-polyline, route-timeout)
- `tests/e2e/overlay.smoke.spec.ts` — 3 passing smoke tests

**Documentation:**
- `docs/rfc/2025-11-10-overlay-recovery-rfc.md` — Original freeze exception
- `docs/rfc/2025-11-10-freeze-lift-proposal.md` — Partial lift proposal
- `docs/approvals/OR-08A-approval.md` — Approval checklist (satisfied by product owner)
- `docs/CI-Policy.md` — Updated with freeze exception + partial lift notes
- `README.md` — Documented OVERLAY_RECOVERY flag (default ON, opt-out with =0)

**Audit Trail:**
- 18 commits with 1:1 runtime-to-log mapping
- All entries in `docs/code-review.md` and `docs/project-history.md`

## Outcome
**Risk:** LOW — All helpers inert (no automatic UI wiring); 97/98 tests GREEN; flag-gated escape hatch available.
**Rollback:** Set `OVERLAY_RECOVERY=0` to disable; revert slices if needed (clear git history).
**Next Steps:** Overlay freeze lifted; safe to proceed with Program.cs refactoring per CODE-SMELL-ANALYSIS.md.

**Flags/Env:** `OVERLAY_RECOVERY=0` disables overlay scripts (default ON)
**Links:** selectors.md v0.7; CI-Policy.md; CODE-SMELL-ANALYSIS.md
