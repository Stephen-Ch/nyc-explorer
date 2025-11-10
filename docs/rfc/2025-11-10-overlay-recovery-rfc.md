# RFC: Overlay Recovery Edits (v1)
Status: Proposed
Date: 2025-11-10
Baseline: sprint-06-closeout-20251106@dfbf54a (worktree: baseline/sprint06-verify)
Freeze: ON (Program.cs, apps/web-mvc/wwwroot/js/route-overlay.js)
Selectors: v0.7
Decision:
- Permit tiny edits to Program.cs and/or route-overlay.js only when:
  1) docs/plans/overlay-recovery.md exists and is linked in the PR,
  2) change is ≤60 LOC across ≤2 files,
  3) OVERLAY_RECOVERY=1 gates new code paths (default 0),
  4) Playwright + typecheck are GREEN, and
  5) PR uses "OR" tag and cites selectors v0.7.
Consequences:
- CI may allow those paths when the PR links the plan and has label `overlay-recovery`.
Rollback:
- Flip flag OFF and revert last slice.
