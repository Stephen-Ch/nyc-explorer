# CI Policy
## Overlay Freeze Exception (OR)
While overlay freeze is ON, edits to Program.cs or apps/web-mvc/wwwroot/js/route-overlay.js are allowed only under OR slices when all are true:
- Plan doc exists at docs/plans/overlay-recovery.md and is linked in the PR
- ≤2 files, ≤60 LOC
- OVERLAY_RECOVERY=1 gates new paths; default OFF
- Typecheck + Playwright GREEN
- PR labeled `overlay-recovery` and mentions selectors v0.7

## Overlay Freeze — Partial Lift (APPROVED 2026-03-04)
This partial lift was approved via docs/approvals/OR-08A-approval.md (Stephen, Product Owner, 2026-03-04):
- Program.cs and overlay JS allowed under ≤2 files / ≤60 LOC with GREEN tests.
- Legacy overlay remains enabled; new core loads by default (inert); disable with OVERLAY_RECOVERY=0.
- Logs required per slice; selectors v0.7 lock.
