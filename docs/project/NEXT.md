# NYC Explorer — Next

## Completed Stories
- **NYCX-DOCS-STD-001** — COMPLETE (2026-03-02). Docs standardization: Control Deck, vibe-coding subtree, ResearchIndex, archive bundle, dataset relocation, legacy redirects, Start-Here wiring.
- **NYCX-DOCS-STD-002** — COMPLETE (2026-03-04). Docs hygiene: branch cleanup (none to delete), confirm ignore for build-errors.json + route-inline-trimmed.js, update ResearchIndex "Last updated" to 2026-03-04, doc link audit pass.
- **NYCX-OVERLAY-FREEZE-LIFT-APPROVAL** — COMPLETE (2026-04-17). OR-08A approval checklist reviewed and confirmed Approved. All 5 preconditions verified with grounded evidence. Follow-on: wire overlay (OR-08B+) or plan next feature story.

## Active Story ID
NYCX-MVP-DOD-AUDIT-001

## Next Step
Run the MVP v0.1 automated gates (typecheck, e2e:auto) and audit every DoD checkbox in EPICS.md to determine which items pass, which fail, and which have gaps. Produce a single status snapshot.

## Definition of Done (DoD)
Each MVP v0.1 DoD item in EPICS.md is marked PASS, FAIL, or GAP with evidence (test name + result or file reference). A summary table is recorded in docs/status/ and NEXT.md is updated with the top-priority gap to fix next.

## Scope Guardrails
**In scope:**
- Running `npm run typecheck` and `npm run e2e:auto`
- Auditing each EPICS.md MVP v0.1 DoD checkbox against test results
- Recording a status snapshot doc (docs/status/)
- Updating docs/project/NEXT.md after audit

**Out of scope:**
- Fixing failures (separate story per gap)
- Runtime code changes, new tests, schema changes
- Overlay wiring, data promotion, proxy work
- Any file outside docs/ except running existing npm scripts read-only

## Done When
- typecheck and e2e:auto have been run and results captured
- Every MVP v0.1 DoD item has a PASS/FAIL/GAP verdict with evidence
- Status snapshot saved to docs/status/
- NEXT.md updated to reflect the top-priority gap or MVP-complete status

## Inputs/Research
- EPICS.md MVP v0.1 DoD (Section 2–5)
- Test results from `npm run typecheck` and `npm run e2e:auto`
- Existing test files in tests/e2e/ and tests/unit/

Last updated: 2026-04-17
