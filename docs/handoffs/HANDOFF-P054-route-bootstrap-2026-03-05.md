# Handoff — P054: Load route-bootstrap.js
**Date:** 2026-03-05  
**From:** End-of-day closeout (Copilot session)  
**To:** Next session (any agent)

---

## Resume State

| Field | Value |
|-------|-------|
| HEAD | `b3a50aa` — "P052 Outcome: R-046 routes proxy contract + mapping" |
| Branch | `main` (in sync with `origin/main`) |
| Working tree | **CLEAN** |
| Stash | `stash@{0}` — "wip end-of-day 2026-03-05 P053 Program.cs proxy + research docs R-047/R-048 moved to /research" |

### What's in the stash

- `apps/web-mvc/Program.cs` — +105 lines: `/api/route` proxy endpoint (P053 work-in-progress, blocked)
- `docs/research/ResearchIndex.md` — updated with R-047, R-048, R-049 entries; paths corrected for R-030–R-033
- `docs/research/R-047-E2E-Failures-Triage-Baseline-Proof.md` — triage report (untracked)
- `docs/research/R-048-Routing-Architecture-Source-of-Truth.md` — architecture analysis (untracked)
- `docs/research/REPORT-E2E-SLICE001-SESSION-2026-03-04.md` — moved from /status (untracked)
- `docs/research/REPORT-OCTOPUS-GHOSTHEADS-SWEEP-SUMMARY-001.md` — moved from /status (untracked)
- `docs/research/REPORT-PLAYWRIGHT-HARDCODED-5000-SCOPEPLAN-001.md` — moved from /status (untracked)
- `docs/research/REPORT-PLAYWRIGHT-PAGEGOTO-HANG-LOCALHOST-DNS-001.md` — moved from /status (untracked)
- `docs/research/tech-debt-and-future-work.md` — moved from /status (untracked)
- `docs/status/` — 5 deleted files (the moves above)

**Restore stash before starting:** `git stash pop`

---

## Next Work Item — P054

**Goal:** Make T1–T4 e2e tests green by loading `route-bootstrap.js` in `home.inline.html`.

### Evidence base
- **R-047** `docs/research/R-047-E2E-Failures-Triage-Baseline-Proof.md` — all 5 failures are pre-existing at `b3a50aa`; not caused by P053.
- **R-048** `docs/research/R-048-Routing-Architecture-Source-of-Truth.md` — root cause and minimal change candidate documented in full.

### Minimal change (from R-048)

**File:** `apps/web-mvc/wwwroot/static/home.inline.html`

1. Add `<script src="/js/route-bootstrap.js"></script>` immediately after the `<script src="/js/dir-ui.js"></script>` tag (line ~108).
2. Remove the inline route IIFE (~lines 298–410): the block containing `normalizeRoute`, `findRoute`, `useCurrentLocation`, and their event bindings — superseded by `route-bootstrap.js`.

**Why:** `route-bootstrap.js` contains all four behaviors missing from the page today:
- `renderRoutePath()` — SVG path overlay (T2)
- `pushGeoHistory()` — `history.pushState` with `gfrom`/`gto` params (T3)
- `popstate` handler — back/forward navigation restore (T4)
- `scheduleDeepLink()` — deep-link restore on page load (T4)
- `renderProviderRoute()` — full provider route flow with "Route ready." message (T1)

**Coupling risk:** Duplicate `findButton.addEventListener` — load route-bootstrap BEFORE the inline IIFE to ensure route-bootstrap's `applySegment` owns the click.

### T5 fix (independent)

**File:** `tests/unit/mock-route-engine.spec.ts`  
Make the `page.evaluate` callback `async` and `await` each `route.path()` / `route.segment()` call. The mock is not activating because `config.routeMock` is `false` at the server level, so the provider-wrapped (async) path is used, and the unresolved Promises serialize as `{}`.

### Verify after P054

```powershell
npm run e2e:auto
npm run typecheck
```

### After T1–T4 + T5 are green

Pop P053 stash changes back and re-verify:
```powershell
git stash pop   # pops stash@{0} — restores Program.cs + research docs
npm run e2e:auto
```
If green → commit P053 (Program.cs proxy) and then commit P054 (home.inline.html + test fix) as separate slices.

---

## Open Items (lower priority)

| Item | Location |
|------|----------|
| Playwright hardcoded `:5000` — 18 files remain | R-031: `docs/research/REPORT-PLAYWRIGHT-HARDCODED-5000-SCOPEPLAN-001.md` |
| PWDEBUG blocker unresolved | R-032: `docs/research/REPORT-E2E-SLICE001-SESSION-2026-03-04.md` |
| Tech debt register | `docs/research/tech-debt-and-future-work.md` |
