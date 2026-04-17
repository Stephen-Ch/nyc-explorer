# NYC Explorer — Next

## Completed Stories
- **NYCX-DOCS-STD-001** — COMPLETE (2026-03-02). Docs standardization: Control Deck, vibe-coding subtree, ResearchIndex, archive bundle, dataset relocation, legacy redirects, Start-Here wiring.
- **NYCX-DOCS-STD-002** — COMPLETE (2026-03-04). Docs hygiene: branch cleanup (none to delete), confirm ignore for build-errors.json + route-inline-trimmed.js, update ResearchIndex "Last updated" to 2026-03-04, doc link audit pass.
- **NYCX-OVERLAY-FREEZE-LIFT-APPROVAL** — COMPLETE (2026-04-17). OR-08A approval checklist reviewed and confirmed Approved. All 5 preconditions verified with grounded evidence.
- **NYCX-MVP-DOD-AUDIT-001** — COMPLETE (2026-04-17). MVP v0.1 DoD audited: all 6 core flows PASS, all 5 error states PASS, schema + typecheck PASS. Quarantine false-positive cleared (R-048, commit e874acb). Green baseline: 97 passed, 1 skipped, 0 failed.
- **NYCX-MVP-V01-DECLARATION-001** — COMPLETE (2026-04-17). Manhattan MVP v0.1 declared COMPLETE. All DoD checkboxes verified and checked in EPICS.md. Declaration report: docs/status/REPORT-MVP-V0.1-DECLARATION-001.md. Green baseline at e582dfa.

## Active Story ID
NYCX-POST-MVP-STORY-SELECTION-001

## Next Step
Select the first post-MVP v0.1 story. Review EPICS.md for remaining epics and deferred items, consult the R-045 cut list, and pick the highest-value next piece of work.

## Definition of Done (DoD)
A single next story is chosen with a clear scope, DoD, and guardrails written into NEXT.md.

## Scope Guardrails
**In scope:**
- docs/project/NEXT.md (populate with chosen story)
- docs/project/EPICS.md (reference only)
- docs/research/ (reference only)

**Out of scope:**
- Runtime code, test changes, CI config
- Execution of the chosen story (that's the next prompt)

## Done When
- NEXT.md has a fully populated Active Story with scope, DoD, guardrails, and inputs

## Inputs/Research
- EPICS.md (remaining epics / deferred items)
- R-045 cut list
- R-047 MVP audit (for residual items)
- R-048 quarantine policy (for live-provider work sizing)

Last updated: 2026-04-17
