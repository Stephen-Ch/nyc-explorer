# OR-08A — Freeze-Lift Proposal Approval (v1)
Date: ________
Approver: ________ (Product/Owner)

Preconditions (all must be true):
- [ ] OR-06 (happy) and OR-07 (resilience) overlay smokes are GREEN
- [ ] Selectors locked at v0.7
- [ ] Quarantine unchanged (route-adapter real)
- [ ] RFC: docs/rfc/2025-11-10-freeze-lift-proposal.md exists
- [ ] CI-Policy updated with partial lift note

Approval (check ONE):
- [ ] APPROVED — proceed to OR-08B (default load of overlay core; inert; no UI wiring)
- [ ] HOLD — do not change runtime defaults

Notes:
- Default ON means Program.cs injects overlay-core/announce at startup (no behavior change; helpers only).
- Rollback: revert slice; re-enable strict freeze note.
