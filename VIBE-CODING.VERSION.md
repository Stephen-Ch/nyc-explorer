# Vibe-Coding Kit Version

**Version:** v7.1.5  
**Effective Date:** 2026-02-07

## Purpose
Defines required artifacts + gates used by Doc Audit. This version number tracks changes to the portable vibe-coding workflow bundle, including protocol-v7, required artifacts, and Start-of-Session enforcement rules.

## What Changed in v7.1.5
- Added `tools/session-start.ps1` wrapper: chains kit subtree update → forGPT sync → 5-line Doc Audit
- Wired canonical-commands.md, protocol-v7.md, protocol-primer.md, session-start-checklist.md to reference the wrapper
- "RUN START OF SESSION DOCS AUDIT" now invokes the wrapper when present

## What Changed in v7.1.4
- Updated Green Gate build command to skip parseTaggerNET3.0 dependencies (`/p:BuildProjectReferences=false`)
- Added file versioning system with session-start handshake for cross-agent sync
- Created docs/forGPT folder for ChatGPT Planner uploads

## What Changed in v7.1.3
- Added redirect banners to all legacy docs/protocol/ files
- Clarified canonical source location (docs-engineering/vibe-coding/protocol/)
- Committed outstanding protocol changes from v7.1.2

## What Changed in v7.1.2
- Reporting: narrative directory buckets only; raw evidence outputs are authoritative (handles VSCode linkification constraint).

## What Changed in v7.1.1
- Added portable doc-audit tool + CI workflow (low-noise v1: Control Deck placeholder scan only; NEXT required only on non-docs PRs)

## What Changed in v7.1.0
- Added required-artifacts.md defining mandatory project docs (VISION/EPICS/NEXT)
- Added 3-Party Approval Gate (Stephen + ChatGPT + Copilot) to alignment-mode.md
- Added docs-engineering/project/NEXT.md Lightweight Rule (~30 line limit, update triggers, paperwork signal) to NEXT.template.md
- Wired Start-of-Session Doc Audit to read VIBE-CODING.VERSION.md + required-artifacts.md before coding
- Created Control Deck templates (VISION.template.md, EPICS.template.md, NEXT.template.md)

## Version History
- v7.1.5 (2026-02-07): Session-start wrapper (auto kit update + forGPT sync + doc audit)
- v7.1.4 (2026-01-18): Green Gate build fix + file versioning + forGPT folder
- v7.1.3 (2026-01-16): Legacy file redirect banners + canonical source clarification
- v7.1.2 (2026-01-07): Reporting directory buckets (narrative only)
- v7.1.1 (2026-01-05): Portable doc-audit tool + CI workflow
- v7.1.0 (2026-01-04): Required artifacts + 3-Party Approval Gate + docs-engineering/project/NEXT.md Lightweight Rule
- v7.0.0 (2026-01-03): Protocol v7 with Vision & User Story Gate, Alignment Mode, Verification Mode

---

Last updated: 2026-02-07
