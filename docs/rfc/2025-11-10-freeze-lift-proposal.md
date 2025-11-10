# RFC: Overlay Freeze — Partial Lift (v1)
Status: Proposed
Date: 2025-11-10
Prereqs: OR-06 (happy) + OR-07 (resilience) smokes passing (97/98 overall); selectors v0.7 lock
Scope:
- Keep legacy overlay as-is.
- Allow **tiny slices** to Program.cs and overlay JS under general guardrails (≤2 files, ≤60 LOC, Commit-on-Green), with tests.
- Overlay core scripts may be **loaded by default** (inert; no UI wiring required).
Conditions:
1) Typecheck + Playwright GREEN on each slice.
2) Decisions line + project-history micro-log per slice.
3) No selector changes (v0.7 lock) without a separate RFC.
Rollback:
- Re-enable strict freeze if failures rise or UI regressions appear.
