# NYC Explorer — Next

## Completed Stories
- **NYCX-DOCS-STD-001** — COMPLETE (2026-03-02). Docs standardization: Control Deck, vibe-coding subtree, ResearchIndex, archive bundle, dataset relocation, legacy redirects, Start-Here wiring.
- **NYCX-DOCS-STD-002** — COMPLETE (2026-03-04). Docs hygiene: branch cleanup (none to delete), confirm ignore for build-errors.json + route-inline-trimmed.js, update ResearchIndex "Last updated" to 2026-03-04, doc link audit pass.
- **NYCX-OVERLAY-FREEZE-LIFT-APPROVAL** — COMPLETE (2026-04-17). OR-08A approval checklist reviewed and confirmed Approved. All 5 preconditions verified with grounded evidence.
- **NYCX-MVP-DOD-AUDIT-001** — COMPLETE (2026-04-17). MVP v0.1 DoD audited: all 6 core flows PASS, all 5 error states PASS, schema + typecheck PASS. Quarantine false-positive cleared (R-048, commit e874acb). Green baseline: 97 passed, 1 skipped, 0 failed.

## Active Story ID
NYCX-MVP-V01-DECLARATION-001

## Next Step
Review the green baseline evidence (R-047 audit, R-048 quarantine resolution) and formally declare MVP v0.1 complete or identify remaining blockers. Docs-only: update EPICS.md checkboxes and record the declaration in a closeout doc.

## Definition of Done (DoD)
EPIC-001 MVP v0.1 is explicitly declared COMPLETE or BLOCKED with grounded evidence. If complete: EPICS.md checkboxes are checked, a closeout summary is recorded, and NEXT.md advances to the first post-MVP story. If blocked: exact blockers are listed with smallest unblock steps.

## Scope Guardrails
**In scope:**
- docs/project/EPICS.md (check DoD boxes if evidence supports it)
- docs/project/NEXT.md (advance after declaration)
- docs/status/ (closeout summary if declaring complete)

**Out of scope:**
- Runtime code, test changes, CI config
- New feature work (post-MVP stories wait until declaration is done)
- Overlay wiring, data promotion, proxy work

## Done When
- EPIC-001 MVP v0.1 has an explicit COMPLETE or BLOCKED verdict
- If COMPLETE: all EPICS.md DoD checkboxes checked with evidence references
- NEXT.md points to the first post-MVP story or the smallest unblock step

## Inputs/Research
- R-047: MVP v0.1 DoD Audit (docs/status/REPORT-MVP-V0.1-DOD-AUDIT-001.md)
- R-048: Quarantine policy decision (docs/research/R-048-Quarantine-Live-Provider-Policy-Decision.md)
- Green baseline: npm run typecheck PASS, npm run e2e:auto 97/1/0 (commit e874acb)

Last updated: 2026-04-17
