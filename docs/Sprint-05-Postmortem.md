# Sprint 05 Postmortem — Archived

This file has been archived to reduce clutter in `docs/`.

Current location:
- `docs/archive/2026-01-11/sprints/Sprint-05-Postmortem.md`
# Sprint 05 Postmortem

## Summary
- Geocoder/typeahead, current-location, and adapter slices converged behind deterministic mocks without breaking POI flows.
- Debounce + stale-result guards kept suggestions honest while share/deep-link contracts stayed aligned across history/back.
- Clipboard share copied live URLs with aria-live feedback, keeping adapters + POIs in parity for researchers.
- Suites held at Playwright 64/64 and unit 7/7; `npm run typecheck` stayed green alongside docs-only verifications.
- Program.cs LOC concentration and pending street-following routing remain the headline risks going into Sprint 06.

## What Worked
- Prompt gating kept RED/green loops disciplined and prevented scope creep mid-sprint.
- Predeclared selectors (geo, share, status) eliminated naming churn once UI wiring began.
- DI adapters behind `window.App.adapters` let mocks and future providers share the same contract.
- Debounce + stale-result guards stabilized the typeahead without sacrificing responsiveness.
- Live-region accessibility copy covered clipboard, adapter errors, and debounce statuses consistently.

## What Hurt
- Program.cs exceeded the comfort limit, making every tweak feel risky and review-heavy.
- Adapter arity drifted between docs and code until the contract spec failed.
- Playwright occasionally hung during webServer shutdown, forcing reruns mid-loop.
- dev:probe timing required manual tuning when dotnet hot reload lagged.

## Time Sinks
1. Program.cs sprawl — inline overlays + DI wiring forced repeated rebase-sized edits; avoid next time: extract overlay + adapter boot to `home.js` before new slices.
2. Adapter contract churn — doc/code mismatches tripped specs twice; avoid next time: land contract tests before wiring new signatures.
3. Playwright/dev probes — reuseExistingServer race left runs hanging; avoid next time: add health-check polling + document restart steps.

## Escaped/Prevented Bugs
| Issue | Detection | Guard added |
| --- | --- | --- |
| Geo adapter arity drift | `adapters-contract.spec.ts` RED after docs update | Length assertions + shared interface docs |
| Clipboard share failure states | `ROUTE-SHARE-UI-1a` Playwright spec | `navigator.clipboard` try/catch with live-region fallback |
| Stale typeahead results resurfacing | `GEO-UI-Perf-1a` e2e | Versioned debounce that ignores outdated promises |

## Risk Watchlist
- Street-following routes and turn-by-turn copy remain unsolved; needs perf + UX alignment.
- Real provider swap-in (keys, quotas, error handling) still theoretical; mocks hide latency spikes.
- Latency budgets for geo/route adapters undefined; risk of regressions once real APIs land.

## Metrics
- Playwright specs: 64 executed, 100% pass; unit specs: 7 executed, 100% pass.
- Typecheck: `npm run typecheck` green (no warnings) across the sprint.
- Per-slice greens: Geo UI 11/11, Route Adapter 5/5, Share/Deep-link 3/3.

## Decisions
- Shared `[data-testid="geo-current"][data-target="from|to"]` control pattern for current-location buttons.
- Locked adapter signatures to the documented `search/reverse` and `walk` contracts with deterministic mocks.
- Standardized a 250 ms debounce window for geo typeahead while keeping live status copy in sync.

## Actions
- [ ] Extract Program.cs overlay + adapters boot logic into `apps/web-mvc/wwwroot/js/home.js`.
- [ ] Add adapter performance budgets + logging around debounce/latency (docs + code).
- [ ] Ship unit coverage for debounce/version helpers (resolve TODOs from GEO-UI-Perf slices).
- [ ] Expand README Quickstart with provider toggle walkthrough + failure debugging steps.
- [ ] Harden Playwright webServer health check to stop hangs on shutdown.
- [ ] Automate dev:probe timing with retry/timeout guards.
- [ ] Draft real-provider spike plan (keys, quotas, error copy) before Sprint 06 kickoff.
- [ ] Document street-following acceptance criteria + perf expectations ahead of roadmap work.

## Prompting Improvements
- Adopt "ask if ≥5% success gain" as the sprint rule for clarifying questions.
- Copilot question template:
  - State the uncertainty in one sentence.
  - Quantify expected success lift (≥5%) and impact radius.
  - Offer the proposed next step if the user declines clarification.
