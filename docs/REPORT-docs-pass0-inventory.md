# DOCS PASS 0 — Inventory & Research/Historical-Data Map

**PROMPT-ID:** RESEARCH-NYC-DOCS-PASS0-INVENTORY-HISTDATA-MAP-NOCHANGES-001  
**Date:** 2026-02-07  
**Branch:** `overlay-drift-20251108-155953`  
**DOCS_ROOT:** `docs/`  
**Status:** Research only — NO moves, NO edits, NO commits

---

## Evidence Snapshot

| Key | Value |
|-----|-------|
| Repo root | `C:/Users/schur/workspaces/NYC Explorer` |
| Branch | `overlay-drift-20251108-155953` |
| Tree | **DIRTY** — many docs modified/deleted/untracked (migration in progress) |
| Remote | `origin https://github.com/Stephen-Ch/nyc-explorer.git` |
| DOCS_ROOT | `docs/` |

---

## Compact Summary

1. **205 files on disk** under `docs/` totaling **1.58 MB**
2. **140 files tracked** by git; **75 untracked** (not yet committed); **1 ignored** (P14-map.png via `docs/artifacts/*`)
3. **8 tracked files deleted on disk** (moved to archive/ as part of ongoing migration — TimeWalk docs, kickoff, cheatsheet, system-reset)
4. **`docs/historical-data/`** is the single largest directory: **74 files, 428.9 KB** (28 CSVs, 14 JSONs, 7 SQLs, 3 XLSXs, 21 MDs, 1 TXT) — all **tracked**
5. **`docs/archive/2026-01-11/`** holds 33 files (230.6 KB) — **none tracked** (entire archive is untracked)
6. **`docs/vibe-coding/`** holds 21 files (125.3 KB) — **none tracked** (entire vibe-coding kit is untracked)
7. **`docs/project/`** holds 8 files (7 KB) — **none tracked** (Control Deck is untracked)
8. **5 binary files** exist on disk (542.9 KB PNG, 116.8 KB PDF, 3 XLSXs totaling 56.3 KB); 3 XLSXs are git-tracked without LFS
9. **No `docs/research/` folder** or `ResearchIndex.md` exists — research content is scattered
10. **Research signals** span 6+ directories: `postmortems/`, `feedback/`, `historical-data/` (provenance + scope plans), `kb/`, `status/`, loose root files (`CODE-SMELL-ANALYSIS.md`)

---

## Directory Map Table (top-level under docs/)

| Directory | Files | Size (KB) | Tracked | Status |
|-----------|-------|-----------|---------|--------|
| (root-level files) | 31 | ~160 | Mixed | 8 deleted on disk, many modified |
| `approvals/` | 1 | 0.7 | Yes | Stable |
| `archive/2026-01-11/` | 33 | 230.6 | **None** | Untracked (migration bundle) |
| `artifacts/` | 2 | 542.9 | .gitkeep only | PNG ignored via .gitignore |
| `feedback/` | 1 | 23.0 | Yes | Stable |
| `historical-data/` | 74 | 428.9 | **All** | Stable (largest dir) |
| `kb/` | 16 | 16.4 | All | Stable |
| `plans/` | 2 | 3.0 | All | Stable |
| `postmortems/` | 2 | 9.4 | All | Stable |
| `project/` | 8 | 7.0 | **None** | Untracked (Control Deck, new) |
| `protocol/` | 3 | 0.8 | **None** | Untracked (redirect stubs) |
| `recovery/` | 1 | 1.3 | Yes | Stable |
| `releases/` | 1 | 1.3 | Yes | Stable |
| `rfc/` | 2 | 1.4 | All | Stable |
| `status/` | 3 | 1.8 | **None** | Untracked (new) |
| `templates/` | 1 | 1.1 | Yes | Stable |
| `testing/` | 1 | 1.2 | **None** | Untracked (new) |
| `vibe-coding/` | 21 | 125.3 | **None** | Untracked (entire kit) |
| `wireframes/` | 1 | 5.1 | Yes | Stable |
| `workspace/` | 0 | 0 | — | Empty |

---

## Classification Table

| Category | Items (evidence paths) |
|----------|----------------------|
| **1. CONTROL DECK** | `project/VISION.md`, `project/EPICS.md`, `project/NEXT.md`, `project/README.md`, `project/AI-WORKFLOW.md`, `project/*.template.md` (3) |
| **2. VIBE-CODING** | `vibe-coding/` (21 files: protocol/, templates/, terminology/, tools/, README, VERSION, MIGRATION) — no subtree history (all untracked) |
| **3. forGPT / bootstrap** | `Start-Here-For-AI.md`, `historical-data/README_for_Copilot.md` |
| **4. RESEARCH** | `CODE-SMELL-ANALYSIS.md` (25.6 KB), `postmortems/` (2 files), `feedback/Sprint-02-Retrospective.md` (23 KB), `historical-data/PROVENANCE.md`, `historical-data/*_Provenance_*.md` (7+7 across root+attractions), `historical-data/Manhattan_ScopePlan.md`, `historical-data/LowerManhattan_ScopePlan*.md`, `historical-data/UnionSquare-Flatiron_ResearchDrop_README.md`, `rfc/` (2 files), `kb/07-Researcher-UI-Spec.md`, `kb/08-Research-Team-Playbooks.md`, `status/solution-report.md` |
| **5. STATUS** | `status/branches.md`, `status/solution-report.md`, `status/tech-debt-and-future-work.md` |
| **6. HANDOFFS** | None found (no `handoffs/` folder exists on disk despite being referenced in Start-Here-For-AI.md) |
| **7. TESTING** | `testing/test-catalog.md`, `NYCExplorer_Playwright.md`, `selectors.md` |
| **8. HISTORICAL-DATA / SOURCE-DATA** | `historical-data/` root (53 files): CSVs (BBL seeds, Events, POIs), JSONs (ImageManifests), SQLs (schema, seeds, migrations), XLSXs (templates, checklist), TXT (manifest). `historical-data/attractions/` (21 files across 7 year-folders: 1852–2002, each with CSV+JSON+Provenance.md) |
| **9. ARCHIVE** | `archive/2026-01-11/` (33 files: historical/, legacy-protocol/, loose/, sprints/, timewalk/, workflow/ — all untracked, migration snapshots) |
| **10. GENERATED / OUTPUT** | `REPORT-docs-tree-files.txt`, `REPORT-docs-tracked-files.txt`, `REPORT-docs-ignored-files.txt` (created during this pass) |
| **11. OTHER** | `Adapters.md`, `Artifacts.md`, `CHANGELOG.md`, `CI-Policy.md`, `Code-Review-Guide.md`, `Code-Review-Template.md`, `code-review.md`, `Copilot-Instructions.md`, `INDEX.md`, `KB-Index.md`, `Playbook.md`, `Project.md`, `Protocol.md`, `README.md`, `Session-Start.md`, Sprint plans (02–06), `sprint-06-postmortem.md`, `Workflow-Tweaks-S6.md`, `Working-With-Stephen.md`, `project-history.md`, `plans/overlay-recovery.md`, `recovery/overlay-recovery-plan.md`, `releases/Sprint-04-ReleaseNotes.md`, `templates/high-risk-plan.md`, `wireframes/UI-wireframe.md`, `approvals/OR-08A-approval.md`, `protocol/` (3 redirect stubs) |

---

## Historical Data Focus

### Top 15 Largest Files Under docs/

| # | Size (KB) | Path | Type |
|---|-----------|------|------|
| 1 | 542.9 | `artifacts/VIS-1/P14-map.png` | IMAGE (ignored) |
| 2 | 116.8 | `archive/2026-01-11/loose/Root Cause Summary.pdf` | BIN (untracked) |
| 3 | 69.7 | `project-history.md` | DOC |
| 4 | 61.6 | `historical-data/nycx_seed.sql` | DATA |
| 5 | 39.2 | `historical-data/NYC-Explorer_POIs_AllYears_withBBL.csv` | DATA |
| 6 | 39.2 | `historical-data/POIs_AllYears_withBBL_andTiles.csv` | DATA |
| 7 | 36.0 | `code-review.md` | DOC |
| 8 | 28.8 | `historical-data/Manhattan_Templates.xlsx` | DATA/BIN |
| 9 | 26.4 | `vibe-coding/protocol/protocol-v7.md` | DOC |
| 10 | 25.6 | `CODE-SMELL-ANALYSIS.md` | DOC |
| 11 | 23.0 | `feedback/Sprint-02-Retrospective.md` | DOC |
| 12 | 17.8 | `historical-data/LowerManhattan_Templates_20251031-141045.xlsx` | DATA/BIN |
| 13 | 16.9 | `historical-data/nycx_events_seed.csv` | DATA |
| 14 | 14.6 | `vibe-coding/MIGRATION-INSTRUCTIONS.md` | DOC |
| 15 | 12.0 | `vibe-coding/protocol/alignment-mode.md` | DOC |

### Historical-Data Candidate Directories

| Directory | Files | Size (KB) | Content |
|-----------|-------|-----------|---------|
| `historical-data/` (root) | 53 | 380.8 | BBL seeds, events, POIs, manifests, SQL, provenance |
| `historical-data/attractions/` (7 year-dirs) | 21 | 48.1 | Year-specific POI CSVs + ImageManifest JSONs + Provenance MDs |
| **TOTAL** | **74** | **428.9** | |

**Extension breakdown:** `.csv` (28, 234.5 KB), `.md` (21, 29.3 KB), `.json` (14, 17.3 KB), `.sql` (7, 90.5 KB), `.xlsx` (3, 56.3 KB), `.txt` (1, 1.0 KB)

### Recommendations (no changes)

- **Should datasets stay under docs/?** The `historical-data/` folder is 428.9 KB (26.7% of all docs by size) and contains source datasets (CSVs, SQLs, XLSXs, JSONs) that are NOT documentation. They are research/source data for EPIC-004 (TimeWalk). Moving them to a top-level `/data` or `/historical-data` would decouple source data from documentation and reduce noise in docs/.
- **Duplication detected:** Files in `historical-data/` root are **duplicated** in `historical-data/attractions/` year-folders (7 year-specific POI CSVs + ImageManifests + Provenance MDs appear at both levels). This needs a decision: keep flat, keep nested, or consolidate.
- **Git LFS:** 5 binary files total: 1 PNG (542.9 KB, gitignored), 1 PDF (116.8 KB, untracked), 3 XLSXs (56.3 KB combined, tracked without LFS). The XLSXs are small enough that LFS is optional. If/when larger images or data exports land, LFS should be revisited. **No urgent LFS need today**, but the 542.9 KB PNG would benefit from LFS if it ever gets tracked.

---

## Research Location & Indexing Readiness

### Where Research Lives Today

| Location | Count | Research Content |
|----------|-------|-----------------|
| `docs/` root | 1 | `CODE-SMELL-ANALYSIS.md` (analysis/audit) |
| `postmortems/` | 2 | Overlay postmortems |
| `feedback/` | 1 | Sprint-02-Retrospective (large, 23 KB) |
| `historical-data/` | ~14 | Provenance MDs, ScopePlans, ResearchDrop README, PROVENANCE.md/csv |
| `rfc/` | 2 | Freeze-lift proposal, overlay recovery RFC |
| `kb/` | 2 | Researcher UI Spec, Research Team Playbooks |
| `status/` | 1 | solution-report.md |
| `archive/` | 1 | Root Cause Summary.pdf |
| **Total research-signal items** | **~24** | **Scattered across 8 directories** |

### Is There a Canonical ResearchIndex?

- **`docs/research/`** — does NOT exist
- **`docs/research/ResearchIndex.md`** — does NOT exist
- **`docs/INDEX.md`** — exists, tracked, last modified **2025-11-10** ("S7-01 - Add docs index and header"). General docs index, not a research index.
- **`docs/KB-Index.md`** — exists, tracked, last modified **2025-10-30**. KB article index, not a research index.

**No canonical research index exists.** Research content is spread across 8 directories with no centralized tracking.

---

## Binary Files Inventory

| File | Size (KB) | Tracked | LFS | Notes |
|------|-----------|---------|-----|-------|
| `artifacts/VIS-1/P14-map.png` | 542.9 | No (gitignored) | No | Largest file under docs/ |
| `archive/2026-01-11/loose/Root Cause Summary.pdf` | 116.8 | No (untracked) | No | In archive bundle |
| `historical-data/Manhattan_Templates.xlsx` | 28.8 | **Yes** | No | Tracked without LFS |
| `historical-data/LowerManhattan_Templates_20251031-141045.xlsx` | 17.8 | **Yes** | No | Tracked without LFS |
| `historical-data/NYCX_DB_Checklist.xlsx` | 9.7 | **Yes** | No | Tracked without LFS |

---

## Untracked Folders Summary

These directories exist on disk but have **zero tracked files** in git:

| Directory | Files | Size (KB) | Should track? |
|-----------|-------|-----------|---------------|
| `archive/2026-01-11/` | 33 | 230.6 | Decision needed |
| `vibe-coding/` | 21 | 125.3 | **Yes** (workflow source of truth) |
| `project/` | 8 | 7.0 | **Yes** (Control Deck) |
| `status/` | 3 | 1.8 | **Yes** (required reading) |
| `testing/` | 1 | 1.2 | **Yes** (required reading) |
| `protocol/` | 3 | 0.8 | **Yes** (redirect stubs) |

---

## STOP — Decisions Needed

5 decisions are needed before any restructuring:

### 1. What is the intended canonical home for historical/source data?
- **Option A:** Keep under `docs/historical-data/`
- **Option B:** Move to top-level `/data` or `/historical-data` (outside docs)
- **Option C:** Split — source datasets → `/data`, provenance/research docs → `docs/research/`
- **Sub-decision:** Resolve duplication between `historical-data/` root and `historical-data/attractions/` year-folders

### 2. Should large/binary artifacts remain in git, use LFS, or move out of docs?
- 3 tracked XLSXs (56.3 KB total) — small, LFS optional
- 1 PNG (542.9 KB, currently gitignored) — needs LFS if ever tracked
- 1 PDF (116.8 KB, untracked archive) — track, LFS, or keep local?

### 3. Do we create `docs/research/` + `ResearchIndex.md` now, or keep research indexed in-place?
- Research is scattered across 8 directories (~24 items)
- **Option A:** Create `docs/research/` and consolidate + link
- **Option B:** Add a `ResearchIndex.md` at docs root that links to items where they are
- **Option C:** Keep as-is, index later

### 4. What do we do with docs folders that are currently untracked?
- `docs/archive/` (33 files), `docs/vibe-coding/` (21 files), `docs/project/` (8 files), `docs/status/` (3 files), `docs/testing/` (1 file), `docs/protocol/` (3 files) — **all untracked**
- Track (commit)? Keep as local-only via `_local/` or `_scratch`? Some of each?
- Note: The Control Deck (`project/`), vibe-coding kit, and `status/` seem essential to track

### 5. Do we preserve existing index files (`INDEX.md`, `KB-Index.md`) as legacy redirects or replace them?
- `INDEX.md` last touched 2025-11-10
- `KB-Index.md` last touched 2025-10-30
- Both predate the vibe-coding kit — redirect, merge, or deprecate?

---

## Evidence Files

Three evidence files were created during this pass (not committed):
- `docs/REPORT-docs-tree-files.txt` — all on-disk files under docs/
- `docs/REPORT-docs-tracked-files.txt` — git ls-files output scoped to docs/
- `docs/REPORT-docs-ignored-files.txt` — ignored items + ignore rule

---

*Generated by PASS 0 research. No files were moved, renamed, edited, or committed.*
