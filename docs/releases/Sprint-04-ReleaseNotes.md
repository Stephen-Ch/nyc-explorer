# Sprint 04 Release Candidate — v0.4.0-rc (2025-11-01)

## What changed
- Dev loop hardened with a scripted hot-reload probe, Razor cleanup routine, and ignored VIS artifacts so `dotnet watch` stays reliable.
- Routing experience now spans find, deep-link share, reset, and browser history sync, with SVG path overlays and active marker highlights.
- Accessibility passes: aria-live route messaging, keyboard-ready overlay controls, UTF-8 placeholder guarantees, and labeled Search/From/To inputs.

## How to run
1. `npm ci` (if fresh clone) and `npm run dev:api` for the ASP.NET + Leaflet app on http://localhost:5000.
2. `npm run dev:probe` to verify dotnet hot reload end-to-end.
3. `npm run e2e:auto` for the full Playwright suite; `npm run typecheck` to keep TS lint-free.

## Known gaps
- Map imagery/licensing pipeline still pending; placeholder assets remain.
- Street-level routing and turn-by-turn guidance deferred to post-MVP planning.
- Manhattan-wide POI import (beyond Union Square/Flatiron) still queued.
- Lighthouse/performance audit not yet completed for this milestone.
