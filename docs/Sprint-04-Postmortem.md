# Sprint 04 Postmortem — Archived

This file has been archived to reduce clutter in `docs/`.

Current location:
- `docs/archive/2026-01-11/sprints/Sprint-04-Postmortem.md`
# Sprint 04 Post-Mortem — NYC Explorer

## Summary
- **Velocity:** Delivered all planned slices from TOOL-DEV-LOOP-1a through ROUTE-FIND-3b, plus supporting doc refreshes and verification notes.
- **Outcome:** 36 Playwright e2e specs and `npm run typecheck` are green locally and in GitHub Actions; dev loop commands (`npm run dev:api`, `npm run e2e:ui`, F5 debug) were exercised and logged.
- **Theme:** Tightened the build/run/test loop while evolving route finding from static lists to shareable paths with URL history parity.

## What Went Well
- **Dev workflow scripts** (`dev:api`, `e2e:ui`, VS Code tasks) removed manual server wrangling and let us validate hot reload within a single key press.
- **Shared routing helper** (`routeSegment`) stayed central, so deep links, route overlay, live announcements, and history reuse the same data contract with minimal duplication.
- **Popstate integration** reused existing UI helpers, so Back/Forward navigation now exercises the exact Find/reset flows tested elsewhere.
- **Process hygiene** (project-history micro log, decisions lines, selectors doc) stayed current, keeping every slice easy to follow during the rapid-fire TDD cadence.

## What Slowed Us Down
1. **Hot reload validation required manual edits:** Verifying `dotnet watch` meant toggling whitespace in Razor files because we lack an automated probe, adding friction to the tooling story.
2. **History guard edge cases:** Preventing pushState recursion during popstate/deep-link handling took several Playwright reruns to prove the guard worked without muting legitimate state changes.
3. **Type narrowing for route helpers:** `routeSegment` tests needed extra types-only slices (`1d`) before UI wiring, briefly fragmenting the RED→GREEN flow and extending the cycle.

## Root Causes
- **Limited automation for dev loop checks:** We rely on ad-hoc commands to assert watcher behavior; without scripted assertions the feedback loop stays partly manual.
- **Monolithic client bundle:** Even after moving logic into `home.js`, the script still couples map wiring, routing, and history, making targeted testing tricky.
- **UI state encoded in DOM only:** Because we do not persist intermediate state outside the DOM, new flows (history, share links) must reverse-engineer intent from elements, increasing guard complexity.

## Recommendations for Sprint 05
1. **Introduce a frontend build step** (e.g., Vite or esbuild) so routing helpers reside in TypeScript modules with unit coverage and linting, reducing reliance on DOM state juggling.
2. **Add automated watcher smoke tests** that spin up `dotnet watch`, touch a temp file, and assert reload output, eliminating manual whitespace toggles.
3. **Persist route state in a lightweight store** (singleton module or URLSearchParams helper) so history, deep links, and future features (favorites, comparisons) can share a single source of truth.
4. **Expand accessibility coverage** with focused tests (screen reader output, keyboard traps) to ensure the live region and marker focus ring stay compliant as flows grow.

## Risk Watchlist
- **History complexity:** Future features that mutate routes (filters, multi-stop planning) could desync the pushState payload if we keep reconstructing state from the DOM.
- **Map overlay performance:** The SVG path redraw currently runs on every move/zoom; with larger datasets it may jitter without throttling.
- **Dev loop drift:** Without scripts enforcing the tooling workflow, new contributors may bypass the commands and regress into manual server management.

## Closing Notes
Sprint 04 delivered the sought-after shareable routing experience and hardened our day-to-day tooling. Addressing the recommended automation and state-management upgrades next will keep routing scalable as we expand beyond Union Square.
