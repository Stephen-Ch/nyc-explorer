# NYC Explorer — Next

## Completed Stories
- **NYCX-DOCS-STD-001** — COMPLETE (2026-03-02). Docs standardization: Control Deck, vibe-coding subtree, ResearchIndex, archive bundle, dataset relocation, legacy redirects, Start-Here wiring.
- **NYCX-DOCS-STD-002** — COMPLETE (2026-03-04). Docs hygiene: branch cleanup (none to delete), confirm ignore for build-errors.json + route-inline-trimmed.js, update ResearchIndex "Last updated" to 2026-03-04, doc link audit pass.

## Active Story ID
NYCX-OVERLAY-FREEZE-LIFT-APPROVAL

## Next Step
Review freeze-lift materials and complete the OR-08A approval checklist (decision + sign-off only; no runtime wiring in this story).

## Definition of Done (DoD)
OR-08A approval checklist is completed and explicitly marked Approved/Not Approved, with decision rationale captured, and next action identified (wire overlay or revise plan).

## Scope Guardrails
**In scope:**
- docs/approvals/OR-08A-approval.md, docs/rfc/*, docs/project/NEXT.md (this file after decision).

**Out of scope:**
- Runtime app code, overlay wiring, wwwroot, Program.cs, tests, package.json, CI workflows.

## Done When
- OR-08A approval checklist is located and reviewed
- Decision recorded: Approved or Not Approved (with rationale)
- If Approved: note the immediate follow-on story (wire overlay / remove OVERLAY_RECOVERY flag) without doing it now
- If Not Approved: note what's missing/blocked

## Inputs/Research
- R-007 Freeze-Lift Proposal: docs/rfc/2025-11-10-freeze-lift-proposal.md
- R-008 Overlay Recovery RFC: docs/rfc/2025-11-10-overlay-recovery-rfc.md

Last updated: 2026-03-04
