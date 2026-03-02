# NYC Explorer — Next

## Completed Stories
- **NYCX-DOCS-STD-001** — COMPLETE (2026-03-02). Docs standardization: Control Deck, vibe-coding subtree, ResearchIndex, archive bundle, dataset relocation, legacy redirects, Start-Here wiring.

## Active Story ID
NYCX-DOCS-STD-002

## Next Step
Clean up stale local branches and untracked files, update ResearchIndex LastUpdated field, and verify all docs links resolve correctly (docs-only hygiene pass).

## Definition of Done (DoD)
Repo has no stale local branches for merged/closed PRs, untracked artifacts are either committed or gitignored, ResearchIndex LastUpdated is current, and broken doc links are fixed.

## Scope Guardrails
**In scope:**
- All paths under `docs/**`, `.gitignore`, and local branch cleanup.

**Out of scope:**
- Runtime app code, package.json, playwright.config.ts, CI workflows.

## Done When
- Stale local branches (for merged/closed PRs) are deleted
- Untracked files (build-errors.json, route-inline-trimmed.js, population-gate-check.ps1) are committed or gitignored
- docs/research/ResearchIndex.md LastUpdated field is current
- Doc link audit passes (no broken relative links in docs/)

## Inputs/Research
- Session audit output from 2026-03-02 (ResearchIndex LastUpdated=MISSING)

Last updated: 2026-03-02
