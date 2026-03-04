# OR-08A — Freeze-Lift Proposal Approval (v1)
Date: 2026-03-04
Approver: Stephen (Product Owner)

Preconditions (all must be true):
- [x] OR-06 (happy) and OR-07 (resilience) overlay smokes are GREEN
      Evidence: tests/e2e/overlay.smoke.spec.ts — 3 tests, 0 skipped (happy/missing-polyline/timeout)
- [x] Selectors locked at v0.7
      Evidence: docs/selectors.md L1 — "v0.7, 2025-11-06"
- [x] Quarantine unchanged (route-adapter real)
      Evidence: docs/plans/overlay-recovery.md — "Quarantine: route-adapter-real.spec.ts unchanged"
- [x] RFC: docs/rfc/2025-11-10-freeze-lift-proposal.md exists
      Evidence: file confirmed present in repo (git ls-files)
- [x] CI-Policy updated with partial lift note
      Evidence: docs/CI-Policy.md — "Overlay Freeze — Partial Lift" section present

Approval (check ONE):
- [x] APPROVED — proceed to OR-08B (default load of overlay core; inert; no UI wiring)
- [ ] HOLD — do not change runtime defaults

Rationale:
- All 3 overlay smokes are GREEN (tests/e2e/overlay.smoke.spec.ts); no test.skip present.
- Rollback mechanism documented and functional: set OVERLAY_RECOVERY=0 (docs/plans/overlay-recovery.md).
- Note: OR-08B was already deployed (Program.cs default ON as of 2025-11-10); this approval records the decision retroactively.

Notes:
- Default ON means Program.cs injects overlay-core/announce at startup (no behavior change; helpers only).
- Rollback: revert slice; re-enable strict freeze note.
