# Sprint 03 Postmortem — Archived

This file has been archived to reduce clutter in `docs/`.

Current location:
- `docs/archive/2026-01-11/sprints/Sprint-03-Postmortem.md`
# Sprint 03 Post-Mortem — NYC Explorer

## Summary
- **Velocity:** Completed all MVP-critical slices (DATA-10, ROUTE-FILTER, DETAIL-IMG, DOC-MVP) plus verification work.
- **Outcome:** MVP feature set is live with 21/21 Playwright tests green, zero typecheck errors, and project documentation updated.
- **Theme:** Strong delivery cadence with several mid-story debugging loops triggered by inline script complexity and raw string formatting.

## What Went Well
- **POI data expansion** unlocked full route coverage without schema churn; tests caught the exact ≥10 threshold.
- **Search + route recompute** shipped with thorough verification, preventing regressions in guided steps.
- **Detail imagery** landed with tight test coverage (image + credit) ensuring content provenance is visible.
- **Process hygiene** (Decisions log, project history, README updates) stayed current, easing context handoffs.

## What Slowed Us Down
1. **Extended debugging on inline JS wiring (ROUTE-FILTER):** Multiple Playwright reruns and manual verification were needed to confirm route-step recomputation because logic was embedded in a long raw string literal with limited tooling support.
2. **.NET raw string indentation errors (DETAIL-IMG):** After inserting new markup inside the `/poi/{id}` handler, the build failed twice before we corrected whitespace alignment, delaying the GREEN cycle.
3. **Playwright artifact churn:** Visual smoke screenshot re-generated on almost every suite run, polluting diffs and adding noise to commits.
4. **Manual server lifecycle during browser testing:** Stopping the ASP.NET process required shell-side process hunting, costing time and leaving risk of orphaned servers.

## Root Causes
- **Monolithic `Program.cs` HTML:** Mixing large HTML/JS blobs inside C# minimal API increased the risk of syntax and formatting mistakes; IDE assistance was limited and compiler diagnostics surfaced late.
- **Lack of helper abstractions:** Repeated logic (e.g., rendering, route building) lives inline instead of modular helpers, making targeted updates error-prone.
- **Artifact management gap:** No guardrails around when Playwright should refresh screenshots; every full suite pass currently rewrites artifacts.
- **Ops tooling gap:** No scripted way to launch/stop dev server for manual QA, leading to ad-hoc commands.

## Recommendations for Sprint 04
1. **Refactor detail view to Razor or templated partials** (Story: `REFAC-HTML-1`): move HTML/JS into view files so formatting errors are caught earlier and diffing is cleaner. Include unit tests for helper methods.
2. **Extract client scripts to separate `.js` bundle** (Story: `FE-BUNDLE-1`): allow linting and TypeScript tooling while reducing inline script debugging friction.
3. **Add Playwright artifact governance** (Story: `VIS-GOV-1`): configure tests to skip re-capturing screenshots unless explicitly flagged, or store artifacts outside default git tracking.
4. **Create dev server task scripts** (Story: `OPS-DEV-1`): add npm/dotnet tool scripts for `start-dev` and `stop-dev` (or leverage `dotnet watch`) to streamline browser verification sessions.
5. **Expand linting/type coverage** (Story: `TS-LINT-1`): add ESLint/TS checks for the frontend bundle once extracted, preventing regressions before they reach Playwright.
6. **Introduce pre-commit validation** (Story: `OPS-CHK-1`): simple script running `npm run e2e:auto --project=unit` subset + `npm run typecheck` to catch issues locally before full runs.

## Risk Watchlist
- **Content scale:** As POI count grows, manual JSON edits may become tedious; consider authoring tooling in Sprint 04.
- **Accessibility debt:** Markers/buttons gained focus styling, but detailed auditing remains outstanding.
- **Performance:** Inline data processing happens on every filter interaction; future sprint should evaluate caching or Web Worker offload if dataset grows.

## Closing Notes
Sprint 03 delivered the MVP scope but highlighted the fragility of inline HTML/JS and the cost of manual ops steps. Addressing the recommended refactors and tooling in Sprint 04 should reduce debugging loops, stabilize artifacts, and maintain momentum toward post-MVP features.
