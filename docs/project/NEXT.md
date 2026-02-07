# NYC Explorer — Next

## Active Story ID
NYCX-DOCS-STD-001

## Next Step
Commit session-critical folders, adopt vibe-coding kit subtree, create research index, relocate historical datasets, add legacy redirects, and push (docs-only).

## Definition of Done (DoD)
Repo has tracked Control Deck + vibe-coding subtree + research index + archived bundle + datasets relocated; Start-Here is wired, and the docs tree is clean with no non-doc files committed.

## Scope Guardrails
**In scope:**
- All paths under `docs/**` and `data/**` (new dataset location).

**Out of scope:**
- Runtime app code, package.json, playwright.config.ts, scripts/, .github/.

## Done When
- docs/archive/2026-01-11 committed (migration bundle)
- docs/project, docs/status, docs/testing, docs/protocol, docs/handoffs tracked
- docs/vibe-coding is a git subtree from vibe-coding-kit (v7.1.5+)
- docs/research/ResearchIndex.md exists with links to all research
- data/historical/ contains relocated datasets; docs/historical-data has redirect stub
- docs/INDEX.md and docs/KB-Index.md are redirect stubs
- docs/Start-Here-For-AI.md updated for new structure

## Inputs/Research
- docs/REPORT-docs-pass0-inventory.md
- docs/REPORT-docs-pass0_5-decision-pack.md

Last updated: 2026-02-07
