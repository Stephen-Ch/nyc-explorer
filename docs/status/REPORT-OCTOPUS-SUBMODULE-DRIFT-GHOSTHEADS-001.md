# Submodule, Drift & Ghost-Heads Inventory

**Report ID:** REPORT-OCTOPUS-SUBMODULE-DRIFT-GHOSTHEADS-001
**Date:** 2026-02-08
**Scope:** Research-only (no edits, no commits, no PRs)
**Prompt ID:** OCTOPUS-SUBMODULE-DRIFT-AND-GHOSTHEADS-INVENTORY-001

## Summary of Findings

No repo uses a git submodule (`.gitmodules` containing "vibe-coding"). All repos that have the kit use **git subtree** integration instead (remote named `vibe-coding-kit` or `vibe-kit`, tracked under a `docs/vibe-coding/` or `docs-engineering/vibe-coding/` prefix). Since the prompt's detection method is `.gitmodules`-based, all repos report Submodule = NO.

The analysis extends to subtree detection for completeness.

## Inventory Table

| Repo | Submodule? | Subtree? | Subtree / kit path | Ghost heads? | Status | Notes |
|------|-----------|----------|-------------------|-------------|--------|-------|
| Stephen-Ch/PIE | NO | NO | N/A | YES (4 files) | GHOST-HEADS | Manual copy; no subtree remote; all 4 kit files at `docs/vibe-coding/protocol/` and `docs/` |
| Stephen-Ch/mortality | NO | YES | `docs/vibe-coding/` | YES (8 ghosts) | GHOST-HEADS | Subtree at `docs/vibe-coding/`; ghosts in `docs/forGPT/`, `docs/_legacy/` |
| Stephen-Ch/justice-sprite | — | — | — | — | NOT-FOUND | Not cloned locally |
| Stephen-Ch/JustSpritesRPG | — | — | — | — | NOT-FOUND | Not cloned locally |
| Stephen-Ch/rawls | NO | YES | `docs/vibe-coding/` | YES (20+ ghosts) | GHOST-HEADS | Git root at `Rawls/JustSprites/`; ghosts in `docs/forGPT/`, `docs/protocol/`, `docs/_legacy/`, `docs/_shared/v7\|v8\|v9/` |
| Stephen-Ch/blackjack | NO | YES | `docs/vibe-coding/` | YES (13+ ghosts) | GHOST-HEADS | Ghosts in `docs/forGPT/`, `docs/forGPT/_legacy/`, `docs/protocol/`, `docs/_legacy/` |
| Stephen-Ch/nyc-explorer | NO | YES | `docs/vibe-coding/` | YES (9 ghosts) | GHOST-HEADS | Subtree canonical at `docs/vibe-coding/`; ghosts in `docs/protocol/`, `docs/archive/`, `docs/_legacy/` |
| OurProjectsRandD/DealersChoice | — | — | — | — | NOT-FOUND | Not cloned locally |
| OurProjectsRandD/Lessonwriter | NO | YES | `LessonWriter2.0/docs-engineering/vibe-coding/` | YES (5 ghosts) | GHOST-HEADS | Ghosts in `docs-engineering/forGPT/`, `vibe-coding-kit-verify/protocol/` |

## Ghost Head Details Per Repo

### Stephen-Ch/PIE (no subtree, manual copy)

- `docs/vibe-coding/protocol/protocol-v7.md`
- `docs/working-agreement-v1.md`
- `docs/Start-Here-For-AI.md`
- `docs/vibe-coding/protocol/copilot-instructions-v7.md`

Note: PIE has no `vibe-coding-kit` remote — these are all manual copies, so technically ALL are "ghost" (no authoritative subtree source).

### Stephen-Ch/mortality (subtree: `docs/vibe-coding/`)

Ghosts outside subtree:

- `docs/forGPT/vibe-coding/protocol/protocol-v7.md`
- `docs/_legacy/vibe-coding-manual-2026-02-06/protocol/protocol-v7.md`
- `docs/forGPT/vibe-coding/protocol/working-agreement-v1.md`
- `docs/_legacy/vibe-coding-manual-2026-02-06/protocol/working-agreement-v1.md`
- `docs/forGPT/Start-Here-For-AI.md`
- `docs/forGPT/vibe-coding/protocol/copilot-instructions-v7.md`
- `docs/_legacy/vibe-coding-manual-2026-02-06/protocol/copilot-instructions-v7.md`

(`Start-Here-For-AI.md` at `docs/` root is repo-specific, not a ghost.)

### Stephen-Ch/rawls (subtree: `docs/vibe-coding/`)

Ghosts outside subtree:

- `docs/forGPT/protocol-v7.md`
- `docs/protocol/protocol-v7.md`
- `docs/_legacy/vibe-coding-manual-2026-02-07/protocol/protocol-v7.md`
- `docs/_shared/v7/protocol-v7.md`
- `docs/_shared/v8/protocol-v7.md`
- `docs/_shared/v9/protocol-v7.md`
- Same pattern for `working-agreement-v1.md` and `copilot-instructions-v7.md` (3× each in `_shared/v7|v8|v9`, plus `forGPT/`, `protocol/`, `_legacy/`)
- `docs/forGPT/Start-Here-For-AI.md`

### Stephen-Ch/blackjack (subtree: `docs/vibe-coding/`)

Ghosts outside subtree:

- `docs/forGPT/protocol-v7.md`
- `docs/forGPT/_legacy/ChatGPTneeds-2026-02-06/protocol-v7.md`
- `docs/protocol/protocol-v7.md`
- `docs/_legacy/vibe-coding-manual-2026-02-06/protocol/protocol-v7.md`
- Same pattern for `working-agreement-v1.md`, `copilot-instructions-v7.md`
- `docs/forGPT/Start-Here-For-AI.md`
- `docs/forGPT/_legacy/ChatGPTneeds-2026-02-06/Start-Here-For-AI.md`

### Stephen-Ch/nyc-explorer (subtree: `docs/vibe-coding/`)

Ghosts outside subtree:

- `docs/archive/2026-01-11/legacy-protocol/protocol-v7.md`
- `docs/protocol/protocol-v7.md`
- `docs/_legacy/vibe-coding-manual-2026-02-07/protocol/protocol-v7.md`
- Same pattern for `working-agreement-v1.md`, `copilot-instructions-v7.md`

(`Start-Here-For-AI.md` at `docs/` root is repo-specific, not a ghost.)

### OurProjectsRandD/Lessonwriter (subtree: `LessonWriter2.0/docs-engineering/vibe-coding/`)

Ghosts outside subtree:

- `LessonWriter2.0/docs-engineering/forGPT/protocol-v7.md`
- `LessonWriter2.0/docs-engineering/forGPT/working-agreement-v1.md`
- `LessonWriter2.0/docs-engineering/forGPT/Start-Here-For-AI.md`
- `LessonWriter2.0/docs-engineering/forGPT/copilot-instructions-v7.md`
- `vibe-coding-kit-verify/protocol/protocol-v7.md` (and all 3 others)

## Repos Requiring Cleanup PRs

- **Stephen-Ch/PIE** — GHOST-HEADS: No subtree integration at all; kit files are manual copies with no update mechanism
- **Stephen-Ch/mortality** — GHOST-HEADS: `docs/forGPT/` and `docs/_legacy/` contain duplicate kit files outside the subtree
- **Stephen-Ch/rawls** — GHOST-HEADS: `docs/forGPT/`, `docs/protocol/`, `docs/_legacy/`, `docs/_shared/v7|v8|v9/` all contain stale copies
- **Stephen-Ch/blackjack** — GHOST-HEADS: `docs/forGPT/`, `docs/protocol/`, `docs/_legacy/` contain stale copies
- **Stephen-Ch/nyc-explorer** — GHOST-HEADS: `docs/protocol/`, `docs/archive/`, `docs/_legacy/` contain stale copies
- **OurProjectsRandD/Lessonwriter** — GHOST-HEADS: `docs-engineering/forGPT/` and `vibe-coding-kit-verify/` contain stale copies
- **Stephen-Ch/justice-sprite** — NOT-FOUND locally (needs remote check)
- **Stephen-Ch/JustSpritesRPG** — NOT-FOUND locally (needs remote check)
- **OurProjectsRandD/DealersChoice** — NOT-FOUND locally (needs remote check)

## Key Observations

1. **All 6 locally-available repos have GHOST-HEADS status.** The ghost pattern is consistent: `docs/forGPT/`, `docs/protocol/`, `docs/_legacy/`, and `docs/_shared/` directories contain copied kit files that duplicate the subtree-managed `docs/vibe-coding/` content.

2. **Ghost origin:** These were likely created before subtree integration was adopted, or by forGPT sync scripts that copy kit files for ChatGPT upload convenience.

3. **`Start-Here-For-AI.md` at the docs root is NOT a ghost** — it is a repo-specific file expected to exist outside the kit subtree and is customized per project.

4. **PIE is the only repo without any subtree integration.** It has no `vibe-coding-kit` remote and no `.gitmodules`. Kit files there are entirely manual copies.

5. **3 repos could not be checked** (justice-sprite, JustSpritesRPG, DealersChoice) because they are not cloned locally.
