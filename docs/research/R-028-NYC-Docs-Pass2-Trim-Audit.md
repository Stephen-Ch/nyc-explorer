# R-028 — NYC Docs PASS 2 Trim Audit

**Date:** 2026-02-07  
**Prompt ID:** DOCS-NYC-PASS2A-DELETE-BACKUP-BRANCH-TRIM-DOCS-001  
**Scope:** Full `docs/**` audit + safe-trim identification  
**Result:** NO TRIMS NEEDED — tree is clean from PASS 1

---

## Inventory

| Metric | Count |
|--------|-------|
| On-disk files | 182 |
| Tracked | 167 |
| Ignored | 2 (PDF + PNG) |
| Untracked | 13 (REPORT-* evidence + 1 loose doc) |
| Identity | 167 + 2 + 13 = 182 ✓ |

## Directory Classification

| Directory | Files | Verdict | Rationale |
|-----------|-------|---------|-----------|
| `_legacy/` | 21 | **KEEP** | Intentional archive of pre-subtree manual kit copy (v7.1.2). All differ from current subtree (v7.1.5) — NOT duplicates. |
| `archive/2026-01-11/` | 34 | **KEEP** | Migration archive bundle committed in PASS 1 (SHA `e23d372`). Contains 5 subdirs: historical, legacy-protocol, sprints, timewalk, workflow. |
| `approvals/` | 1 | **KEEP** | `OR-08A-approval.md` — unique approval record. |
| `artifacts/` | 2 | **KEEP** | `.gitkeep` + `P14-map.png` (ignored binary). |
| `feedback/` | 1 | **KEEP** | `Sprint-02-Retrospective.md` — unique research artifact (R-006). |
| `handoffs/` | 2 | **KEEP** | `README.md` + `archive/.gitkeep`. Session handoff scaffold from PASS 1. |
| `historical-data/` | 1 | **KEEP** | Redirect stub `README.md` pointing to `data/historical/`. Correct post-relocation state. |
| `kb/` | 16 | **KEEP** | Knowledge Base articles (01–16). Active reference material. Unique content. |
| `plans/` | 2 | **KEEP** | `.gitkeep` + `overlay-recovery.md` (54L, unique — differs from `recovery/overlay-recovery-plan.md`). |
| `postmortems/` | 2 | **KEEP** | `GPT Overlay Breakdown postmortem.md` + `overlay-2025-11-09.md`. Both indexed in ResearchIndex (R-002, R-003). |
| `project/` | 8 | **KEEP** | Control Deck (VISION, EPICS, NEXT) + supporting files. Required by protocol. |
| `protocol/` | 3 | **KEEP** | Redirect stubs (copilot-instructions-v7, protocol-v7, working-agreement-v1). Already 5–10 line stubs pointing to `vibe-coding/protocol/`. Start-Here-For-AI.md explicitly mentions them as "backward compatibility." No live operational inbound links. |
| `recovery/` | 1 | **KEEP** | `overlay-recovery-plan.md` (27L, unique content, differs from plans/ version). |
| `releases/` | 1 | **KEEP** | `Sprint-04-ReleaseNotes.md`. Unique. |
| `research/` | 5 | **KEEP** | `README.md`, `ResearchIndex.md`, plus 3 new REPORT-* evidence files (untracked). |
| `rfc/` | 2 | **KEEP** | `2025-11-10-freeze-lift-proposal.md` + `2025-11-10-overlay-recovery-rfc.md`. Indexed as R-007, R-008. |
| `status/` | 3 | **KEEP** | `branches.md`, `solution-report.md`, `tech-debt-and-future-work.md`. Required reading. |
| `templates/` | 1 | **KEEP** | `high-risk-plan.md`. Unique template. |
| `testing/` | 1 | **KEEP** | `test-catalog.md`. Required reading per Start-Here-For-AI.md. |
| `vibe-coding/` | 34 | **KEEP** | Git subtree from vibe-coding-kit (v7.1.5). Source of truth. |
| `wireframes/` | 1 | **KEEP** | `UI-wireframe.md`. Unique. |
| `workspace/` | 0 | **N/A** | Empty dir (not tracked by git). No action possible. |

## Root-Level Files (40 files)

| Category | Files | Verdict |
|----------|-------|---------|
| Entry point | `Start-Here-For-AI.md` | **KEEP** — session bootstrap |
| Redirect stubs | `INDEX.md`, `KB-Index.md`, `Copilot-Instructions.md`, `Protocol.md`, `Session-Start.md`, `Playbook.md` | **KEEP** — all already converted to redirect stubs in PASS 1 |
| Active docs | `selectors.md`, `Adapters.md`, `CODE-SMELL-ANALYSIS.md`, `Working-With-Stephen.md` | **KEEP** — unique operational content |
| Sprint plans | `Sprint-02-Plan.md` through `Sprint-06-Plan.md` (5 files) | **KEEP** — differ from archive copies |
| Sprint postmortems | `Sprint-03-Postmortem.md` through `sprint-06-postmortem.md` (4 files) | **KEEP** — differ from archive copies |
| Project docs | `Project.md`, `project-history.md`, `README.md`, `CHANGELOG.md` | **KEEP** — unique active content |
| Review/CI | `Code-Review-Guide.md`, `Code-Review-Template.md`, `code-review.md`, `CI-Policy.md`, `Artifacts.md`, `Workflow-Tweaks-S6.md` | **KEEP** — active reference, no duplicates |
| Untracked evidence | 10 REPORT-* files + `NYCExplorer_Playwright.md` | **NO ACTION** — ephemeral, untracked |

## Duplicate Scan Results (SHA256)

| Group | File A | File B | Verdict |
|-------|--------|--------|---------|
| 1 | `vibe-coding/VIBE-CODING-KIT-VERSION-2025-12-27.txt` | `_legacy/vibe-coding-manual-2026-02-07/VIBE-CODING-KIT-VERSION-2025-12-27.txt` | **KEEP BOTH** — subtree vs archive copy, by design |
| 2 | `REPORT-docs-tracked-files.txt` | `REPORT-docs-tracked.txt` | **N/A** — both untracked ephemeral evidence |

**No actionable duplicates found.**

## Safe Trim Candidates

**None.** The PASS 1 work (10 commits) already:
- Relocated historical data to `data/historical/` with dedup
- Archived manual kit copy to `_legacy/`
- Converted INDEX.md, KB-Index.md to redirect stubs
- Added redirect stubs for legacy entry points
- Quarantined 21 root-level duplicate data files

## Conclusion

The `docs/` tree is clean. No files are provably redundant. All directories serve defined purposes. No trims warranted at this time.

### Future considerations (NOT actionable now)
- **Sprint plan/postmortem root files** (9 files): Could be consolidated into `archive/` in a future pass, but they differ from archive copies and may have been intentionally kept at root for discoverability.
- **`docs/protocol/` redirect stubs** (3 files): Could be deleted once all external references (bookmarks, other repos) have been updated. Start-Here explicitly retains them.
- **Root-level `code-review.md`** (403 lines): Largest root file after `project-history.md`. Contains decision log — could be moved to `research/` in a future pass if the log is considered research.
