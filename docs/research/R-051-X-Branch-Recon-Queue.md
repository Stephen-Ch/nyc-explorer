# R-051 — X-Branch Reconnaissance Queue

| Field | Value |
|-------|-------|
| Date | 2026-04-17 |
| PROMPT-ID | NYCX-XBRANCH-RECON-QUEUE-DOC-001 |
| Area | Planning / X-Branch |
| Status | Complete |
| Confidence | 88% |
| Evidence Links | R-049, R-050, R-038, X-BRANCH-MODE.md, COPILOT-X-BRANCH-GUIDE.md, CODE-SMELL-ANALYSIS.md, EPICS.md |

## Prior Research Lookup

Searched ResearchIndex.md and read the following prior work:
- **R-049** (Historical Data Inventory): identifies BBL landmark seed candidates, event seed counts, enrichment gaps across `data/historical/`
- **R-050** (POI Promotion Criteria): synthesizes source hierarchy, verification checklist, reject/defer rules, and 7 open questions
- **R-038** (Data Promotion v0): proposes CSV → poi.v1.json pipeline, field mapping, validation gates (open)
- **X-BRANCH-MODE.md** / **COPILOT-X-BRANCH-GUIDE.md**: cloud-agent-only spike workflow, hostile scrutiny gate, adoption verdicts
- **CODE-SMELL-ANALYSIS.md**: remaining code smells (typeahead duplication, magic numbers, error-handling gaps)
- **EPICS.md**: EPIC-003 (Content Contract, in progress), EPIC-004 (TimeWalk, planned)

No prior recon-queue document exists.

## Question

What x-branch reconnaissance opportunities exist in the NYC Explorer repo that a cloud agent could explore ahead of main-line implementation to reduce uncertainty, find hidden blockers, and save Stephen's limited attention?

## Why an X-Branch Recon Queue Is Useful for This Project

NYC Explorer is a side project with sporadic attention — days or weeks may pass between sessions. When Stephen returns, he faces cold-start friction: re-reading context, rediscovering blockers, and making decisions under uncertainty.

X-branch spikes let a cloud agent scout ahead during gaps. The agent explores a narrow question, runs gates, and writes a report. When Stephen returns, the recon report is waiting in a PR — evidence is pre-gathered, friction points are surfaced, and the decision is smaller.

This queue captures the reconnaissance opportunities so they do not depend on Stephen's memory to surface them. Any queued topic can be dispatched quickly when a session has bandwidth, or skipped indefinitely with no cost.

X-branches are optional. This queue is a menu, not a commitment.

## Selection Rule: When an X-Branch Is Worth Using

Use an x-branch when:
- The question has real uncertainty and the answer would change how main-line work proceeds
- Advance evidence is likely to save time or prevent waste on main
- The question is narrow enough for a single cloud-agent spike
- The recon output (report + gate results) is independently valuable even if the code is discarded

Do not use an x-branch when:
- The answer is already known or easily discoverable by reading repo docs
- The work is straightforward implementation with no architectural risk
- The question requires Stephen's editorial judgment before any code is useful

See [X-BRANCH-MODE.md](X-BRANCH-MODE.md) for the full workflow and constraints.

## Ranked Recon Queue

| Rank | Recon Topic | Core Question | Why It Saves Time on Main | Inputs Needed | Expected Output | Stephen Attention | Status |
|------|-------------|---------------|---------------------------|---------------|-----------------|-------------------|--------|
| 1 | Lower Manhattan candidate packet dry-run (2–3 landmarks) | Can a BBL seed row be promoted to poi.v1.json using R-050 criteria end-to-end? | Surfaces real friction in the promotion pipeline before committing to a batch. Finds missing fields, broken source URLs, and tooling gaps. | R-050 checklist, BBL_Seed_Landmarks_Extended.csv, poi.v1.json schema (R-034) | Spike report with per-field pass/fail for 2–3 candidates (e.g., Federal Hall, Trinity Church, Stonewall Inn). List of blockers and enrichment gaps. | Low | Queued |
| 2 | Events vs. POIs schema decision | Should events be a distinct runtime type, a POI subtype, or narrative-only enrichment? | Unblocks the largest data tranche (88+ events). Current schema has no event representation — this blocks EPIC-004. | R-049 event inventory, R-050 §9, R-044 content model, poi.v1.json | Spike report comparing 2–3 schema options with pros/cons. Prototype JSON for one event under each option. | Medium | Queued |
| 3 | Dedup / identity-key rules | What is the canonical deduplication key across seed CSVs (name+neighborhood, bbl10, address, or composite)? | Prevents duplicate POIs when promoting from overlapping CSVs. No canonical rule exists (R-050 open question #7). | BBL_Seed_Landmarks.csv, BBL_Seed_Landmarks_Extended.csv, BBL_Seed_Landmarks_Manhattan.csv | Spike report with collision analysis across CSVs, recommended key, and edge cases (parks, multi-lot sites). | Low | Queued |
| 4 | Image-policy practical fit | Can the current Lower Manhattan candidates ship with available public-domain/CC imagery, or will most be image-pending? | Determines if images are a blocker for the first expansion batch or a deferred cosmetic issue. R-050 open question #2. | BBL_Seed_Landmarks_Extended.csv (32 rows), Wikimedia Commons, NYPL Digital Collections, LOC | Spike report with image availability for 10–15 candidates. Recommended policy (ship without images vs. block on images). | Low | Queued |
| 5 | Overflow / "more available" weighting UX | How should the UI handle blocks with > 3 POIs per era — hidden overflow, ranked list, or "more available" badge? | The density cap is operational, not a credibility gate (R-050). The repo contemplates overflow ("flagged as 'more available' in UI") but no UX exists. | README_for_Copilot.md density cap, R-050 §7, home.js, poi.v1.json | Spike with 1–2 prototype UX approaches. Report on technical feasibility and user experience tradeoffs. | Medium | Queued |
| 6 | Promotion-pipeline friction (CSV → poi.v1.json) | Can `promote-pois.ts` (R-038) be built and tested against real seed data without blocking on editorial decisions? | Separates technical pipeline work from editorial policy. R-038 is open; R-050 open question #6 asks build-before-or-after. | R-038 spec, R-050 field requirements, BBL_Seed_Landmarks_Extended.csv, poi.v1.json | Working prototype script + gate results. Report on which fields require human input vs. automatable. | Low | Queued |
| 7 | Demolished buildings policy | Should a building that no longer exists be a valid historical POI, and if so, how is it presented? | Affects which seed rows are promotable. Some BBL landmarks may reference structures demolished since their era. R-050 open question #5. | BBL_Seed_Landmarks.csv, R-050 §7, historical provenance docs | Policy recommendation with 2–3 real examples. Proposed JSON representation (e.g., `demolished: true` flag or description-only). | Low | Queued |
| 8 | Route_id / order editorial conventions | Should route_id and order be assigned in seed CSVs or generated at promotion time? | Blocks batch promotion if undecided. R-050 open question #4 and suggested next action #4. | R-050 §3, poi.v1.json existing route groups, Manhattan_ScopePlan.md neighborhood list | Proposed naming convention (e.g., `FIDI-1852`) and assignment rules. Report on whether automated grouping is feasible. | Low | Queued |
| 9 | Multi-neighborhood schema validation | Does the current poi.v1.json schema + e2e test suite break when POIs from neighborhoods outside Union Square + Flatiron are added? | The prior multi-neighborhood spike (PR #8, closed) hit a schema enum barrier. Recon would confirm if `poi.spec.ts` needs schema changes before expansion. | poi.v1.json, tests/schema/poi.spec.ts, BBL_Seed_Landmarks_Extended.csv | Gate results with expanded test data. Report on schema barriers and minimal fixes. | Low | Queued |

## Suggested Operating Pattern for Low-Attention Weeks

When Stephen has limited time between sessions:

1. **Pick one queued topic** from the table above (lowest rank that hasn't been explored).
2. **Dispatch the spike** — Copilot creates the remote branch, launches the cloud agent with a narrow prompt, opens the PR. This takes ~5 minutes of Stephen's time.
3. **Walk away.** The cloud agent works asynchronously on the remote branch.
4. **On return,** review the PR report. The hostile scrutiny gate and adoption verdict can be processed in a single focused block.
5. **Capture learning** — if verdict A/B/C, write the R-### doc on main. If verdict D, close the PR and move on.

The key insight: dispatching a spike is cheap. The cloud agent does the exploration. Stephen's attention is spent reviewing evidence, not producing it.

If no spike is worth dispatching, skip it — the queue will still be here next session.

## Open Notes / Future Additions

- Queue entries may be reordered as priorities shift. Rank reflects current best guess, not a commitment.
- New recon topics can be appended as they surface from story work or research.
- Completed spikes should have their status updated to `Done (R-###)` or `Done (D — rejected)` with a link to the spike report.
- If a queued topic becomes moot (e.g., answered by main-line work), mark it `Superseded` with a brief note.
- Topics requiring Stephen's editorial judgment before any code is useful are marked Medium attention. These may benefit from a brief ChatGPT prompt to narrow the question before dispatch.

## Confidence Statement

**Confidence:** 88%
**Basis:** All 9 queue entries are grounded in existing repo research (R-049, R-050, R-038), open questions documented in those research docs, and code smells identified in CODE-SMELL-ANALYSIS.md. The ranked order is a judgment call based on estimated value-to-effort ratio — it may shift as priorities evolve.
**Ready to proceed:** YES — this queue is immediately usable for dispatch decisions.
