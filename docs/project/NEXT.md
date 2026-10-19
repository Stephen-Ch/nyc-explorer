# NYC Explorer — Next

## Completed Stories
- **NYCX-DOCS-STD-001** — COMPLETE (2026-03-02). Docs standardization: Control Deck, vibe-coding subtree, ResearchIndex, archive bundle, dataset relocation, legacy redirects, Start-Here wiring.
- **NYCX-DOCS-STD-002** — COMPLETE (2026-03-04). Docs hygiene: branch cleanup (none to delete), confirm ignore for build-errors.json + route-inline-trimmed.js, update ResearchIndex "Last updated" to 2026-03-04, doc link audit pass.
- **NYCX-OVERLAY-FREEZE-LIFT-APPROVAL** — COMPLETE (2026-04-17). OR-08A approval checklist reviewed and confirmed Approved. All 5 preconditions verified with grounded evidence.
- **NYCX-MVP-DOD-AUDIT-001** — COMPLETE (2026-04-17). MVP v0.1 DoD audited: all 6 core flows PASS, all 5 error states PASS, schema + typecheck PASS. Quarantine false-positive cleared (R-048, commit e874acb). Green baseline: 97 passed, 1 skipped, 0 failed.
- **NYCX-MVP-V01-DECLARATION-001** — COMPLETE (2026-04-17). Manhattan MVP v0.1 declared COMPLETE. All DoD checkboxes verified and checked in EPICS.md. Declaration report: docs/status/REPORT-MVP-V0.1-DECLARATION-001.md. Green baseline at e582dfa.
- **NYCX-POST-MVP-STORY-SELECTION-001** — COMPLETE (2026-07-13). After a ~10-week pause, full status review run with Stephen; next story chosen: historical POI + event promotion (not the previously-selected-then-reverted live routing proxy — that reversal's original reason is unrecoverable and is logged as such, not guessed at). See docs/handoffs/HANDOFF-Historical-Places-Events-2026-07-13.md.

## Active Story ID
NYCX-HISTORICAL-PLACES-EVENTS-001

## Story Title
Historical Places + Events — additive data model, schema, and era-switching foundation

## Epic
EPIC-004 — Historical TimeWalk Expansion (now in scope; see decision record below)

## Next Step
Sanity-check the 5 Union Square event-to-place matches flagged in the handoff doc, then extend `tests/schema/poi.spec.ts` and the `apps/web-mvc` POI types to add an optional, additive `events[]` field — no behavior change, no UI yet.

## Definition of Done (DoD)
Schema and types legally accept `events[]` on a POI record, `npm run typecheck` and `npm run e2e:auto` both remain green at 97 passed / 1 skipped / 0 failed, and the 5 flagged event matches have been confirmed or corrected by a human pass.

## Scope Guardrails
**In scope:**
- `tests/schema/poi.spec.ts` — additive schema change only
- `apps/web-mvc/` POI TypeScript/C# type definitions — additive field only
- Sanity-check pass over `content/poi.historical-draft-with-events.v1.json`

**Out of scope:**
- Wiring `events[]` into any live route, controller, or the runtime `content/poi.v1.json`
- Year/time-range selector UI (no design chosen yet — slider vs. dropdown vs. era buttons)
- Replacing the live present-day POIs (decision made to Replace eventually; not this slice)
- Any change to `main` or the unmerged `chore/vibe-kit-rollout-v7516-verify-20260506` branch state

## Done When
- Schema test suite accepts a POI record with a populated `events[]` array without failing
- `npm run e2e:auto` and `npm run typecheck` both pass at the current baseline count
- The Union Square 5-event match question has an explicit answer, not a silent default

## Inputs/Research
- docs/handoffs/HANDOFF-Historical-Places-Events-2026-07-13.md (full resume state, file locations, decision context)
- R-038 (docs/research/R-038-Data-Promotion-CSV-to-POIJSON-v0.md) — promotion field mapping
- R-044 (docs/research/R-044-Content-Model-and-Storage-Decision-Rules.md) — Place/Incarnation/Event model, additive-schema rules
- R-049, R-050 — historical data inventory and promotion criteria
- content/poi.historical-draft.v1.json, content/poi.historical-draft-with-events.v1.json (untracked, already built)
- scripts/draft/promote-pois-DRAFT.py, scripts/draft/attach-events-DRAFT.py (untracked, already built)

Last updated: 2026-07-13
