# Ghost-Heads Cleanup Report — nyc-explorer

**Report ID:** REPORT-OCTOPUS-GHOSTHEADS-CLEANUP-001
**Date:** 2026-02-08
**Repo:** Stephen-Ch/nyc-explorer
**Scope:** docs-only

## Canonical Subtree Root Kept

    docs/vibe-coding/

## Ghost-Head Paths Removed (9 files)

    docs/_legacy/vibe-coding-manual-2026-02-07/protocol/copilot-instructions-v7.md
    docs/_legacy/vibe-coding-manual-2026-02-07/protocol/protocol-v7.md
    docs/_legacy/vibe-coding-manual-2026-02-07/protocol/working-agreement-v1.md
    docs/archive/2026-01-11/legacy-protocol/copilot-instructions-v7.md
    docs/archive/2026-01-11/legacy-protocol/protocol-v7.md
    docs/archive/2026-01-11/legacy-protocol/working-agreement-v1.md
    docs/protocol/copilot-instructions-v7.md
    docs/protocol/protocol-v7.md
    docs/protocol/working-agreement-v1.md

## Files Kept (not ghosts)

    docs/Start-Here-For-AI.md  (repo-specific, not a kit copy)
    docs/vibe-coding/protocol/protocol-v7.md  (canonical subtree)
    docs/vibe-coding/protocol/working-agreement-v1.md  (canonical subtree)
    docs/vibe-coding/protocol/copilot-instructions-v7.md  (canonical subtree)

## Proof Scan

Command: git ls-files | Select-String "protocol-v7|working-agreement-v1|copilot-instructions-v7|Start-Here-For-AI"

Result (post-staging): 0 ghost matches outside subtree root. Only canonical copies remain.

## Commit

    Hash: (filled after commit)
    PR: N/A (solo merge to main)
