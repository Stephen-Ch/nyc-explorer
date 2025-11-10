# CI Policy
## Overlay Freeze Exception (OR)
While overlay freeze is ON, edits to Program.cs or apps/web-mvc/wwwroot/js/route-overlay.js are allowed only under OR slices when all are true:
- Plan doc exists at docs/plans/overlay-recovery.md and is linked in the PR
- ≤2 files, ≤60 LOC
- OVERLAY_RECOVERY=1 gates new paths; default OFF
- Typecheck + Playwright GREEN
- PR labeled `overlay-recovery` and mentions selectors v0.7
