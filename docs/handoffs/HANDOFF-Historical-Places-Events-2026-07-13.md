# Handoff — Historical Places + Events Model

**Date:** 2026-07-13
**From:** Claude (Cowork), working directly with Stephen after a ~10-week pause
**To:** Next session (any agent, or Stephen)

---

## Resume State

| Field | Value |
|-------|-------|
| HEAD | `84b3101` — Revert "docs: populate active story for NYC Explorer rollout" (2026-05-07) |
| Branch | `chore/vibe-kit-rollout-v7516-verify-20260506` — **7 commits ahead of `main`, unmerged.** This predates today's session; not something today's work caused. |
| Working tree | Untracked additions only (below). No modified-and-uncommitted files from today. |
| Stash | None |

### What's untracked (all new, all draft, nothing live touched)

- `content/poi.historical-draft.v1.json` — 42 historical POIs (7 eras × 6 places, Union Square + Flatiron), promoted from `data/historical/NYC-Explorer_POIs_AllYears_withBBL.csv`. Real sources; 9/42 image-pending (allowed per R-050).
- `content/poi.historical-draft-with-events.v1.json` — same 42, each with an additive `events[]` array attached by proximity join against `data/historical/Events_withBBL_andTiles.csv` (13 of 14 events matched within 150m; 1 left unmatched rather than force-fit).
- `scripts/draft/promote-pois-DRAFT.py` — CSV → poi.v1.json promotion script (implements R-038's field mapping, including the `images.url → images.src` rename).
- `scripts/draft/attach-events-DRAFT.py` — proximity-join script that produced the events-attached file.

**None of this has touched `content/poi.v1.json` or any runtime code.** The live app still runs on its original 10 present-day (placeholder-sourced) POIs.

---

## Why this session happened

Stephen hadn't worked on NYC Explorer in ~10 weeks. Session started with a full status review (see `docs/status/` — no, see the CTO working folder referenced below; nothing was added to `docs/status/` this session) covering vision, plans, and whether the project was on the right track. Two decisions came out of it:

1. **Next post-MVP story: historical POI promotion** (not the previously-reverted live-routing-proxy idea — see Decision Log below for why that was dropped: reason is genuinely unrecoverable, logged as such rather than guessed at).
2. **Data model: Replace** the present-day-only view. Default is present day; selecting a year/time-range switches the map to that era. Point-in-time stories ("this is where X happened") attach to places as an additive `events[]` list, filtered by exact date independent of which era-description is showing.

Full reasoning, the original status review, and a running decision log live outside this repo, in Stephen's CTO working folder:
**`C:\Users\schur\OneDrive\Documents\_Projects\NYC-Explorer`** (four subfolders: `01-Status-Reports`, `02-Decisions-Needed`, `03-Research-Memos`, `04-Working-Notes`). If you don't have access to that folder, everything you need to resume the code work is in this handoff and in the files listed above.

---

## Next Work Item

**Goal:** Turn the draft data layer above into something schema-legal and testable, without breaking the current 97 green tests, before any UI work starts.

### Proposed order (small, testable, reversible — do not batch)

1. **Sanity-check the event join.** 5 Union Square events (Fort Sumter rally, first Labor Day parade, Emma Goldman's arrest, a 1930 demonstration, 9/11 vigils) all nearest-matched to the **Croton Fountain** point in `poi.historical-draft-with-events.v1.json` rather than the broader **Union Square Park** point — geometrically correct (17m), semantically arguable. Confirm the right anchor before this ships.
2. **Extend the schema, additively.** Add optional `events[]` to `tests/schema/poi.spec.ts` and any TypeScript/C# POI types in `apps/web-mvc/`. No behavior change — just makes the shape legal. Verify `npm run typecheck` and `npm run e2e:auto` still pass (they should; this is additive-only).
3. **Wire era-switching behind a test-only route param first** (no UI yet), so it's verifiable via Playwright before visual work starts.
4. **Only then:** design and build the actual year/time-range selector UI (no design exists yet — needs a decision: slider vs. dropdown vs. era buttons).

### Verify after each step

```
npm run e2e:auto
npm run typecheck
```

### Not yet decided

- Time-range selector UI control type.
- Whether to keep both draft JSON files or consolidate into one before wiring in.
- The present-day POIs that remain the default view still have placeholder sources/images — a separate, smaller content-quality problem not addressed by this work.

---

## Open Items (lower priority, pre-existing, not from today)

| Item | Location |
|------|----------|
| Playwright hardcoded `:5000` — 18 files remain | R-031: `docs/status/REPORT-PLAYWRIGHT-HARDCODED-5000-SCOPEPLAN-001.md` |
| PWDEBUG blocker unresolved | R-032: `docs/status/REPORT-E2E-SLICE001-SESSION-2026-03-04.md` |
| `chore/vibe-kit-rollout-v7516-verify-20260506` branch still unmerged into `main` | 7 commits ahead; predates this session |
