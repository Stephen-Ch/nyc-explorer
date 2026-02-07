# Vibe-Coding Kit Version

**Version:** v7.1.2  
**Effective Date:** 2026-01-07

## Purpose
Defines required artifacts + gates used by Doc Audit. This version number tracks changes to the portable vibe-coding workflow bundle, including protocol-v7, required artifacts, and Start-of-Session enforcement rules.

## What Changed in v7.1.2
- Reporting: narrative directory buckets only; raw evidence outputs are authoritative (handles VSCode linkification constraint).

## What Changed in v7.1.1
- Added portable doc-audit tool + CI workflow (low-noise v1: Control Deck placeholder scan only; NEXT required only on non-docs PRs)

## What Changed in v7.1.0
- Added required-artifacts.md defining mandatory project docs (VISION/EPICS/NEXT)
- Added 3-Party Approval Gate (Stephen + ChatGPT + Copilot) to alignment-mode.md
- Added docs/project/NEXT.md Lightweight Rule (~30 line limit, update triggers, paperwork signal) to NEXT.template.md
- Wired Start-of-Session Doc Audit to read VIBE-CODING.VERSION.md + required-artifacts.md before coding
- Created Control Deck templates (VISION.template.md, EPICS.template.md, NEXT.template.md)

## Version History
- v7.1.0 (2026-01-04): Required artifacts + 3-Party Approval Gate + docs/project/NEXT.md Lightweight Rule
- v7.0.0 (2026-01-03): Protocol v7 with Vision & User Story Gate, Alignment Mode, Verification Mode

---

Last updated: 2026-01-04
