# Research Index — NYC Explorer

**Last updated:** 2026-02-07  
**Coverage:** Links to all identified research, audit, postmortem, and investigation artifacts.  
**Method:** Index-in-place (no physical moves in this pass).

## Summary

| Category | Count |
|----------|-------|
| Code Analysis / Audits | 1 |
| Postmortems | 4 |
| Retrospectives | 1 |
| RFCs / Proposals | 2 |
| Provenance / Research Docs | 16 |
| Knowledge Base (research-adjacent) | 2 |
| Status Reports | 1 |
| Audits | 1 |
| **Total indexed** | **29** |

---

## Code Analysis / Audits

| ID | Title | Path | Status |
|----|-------|------|--------|
| R-001 | Code Smell Analysis | [docs/CODE-SMELL-ANALYSIS.md](../CODE-SMELL-ANALYSIS.md) | Complete |

## Postmortems

| ID | Title | Path | Status |
|----|-------|------|--------|
| R-002 | GPT Overlay Breakdown | [docs/postmortems/GPT Overlay Breakdown postmortem.md](../postmortems/GPT%20Overlay%20Breakdown%20postmortem.md) | Complete |
| R-003 | Overlay Incident 2025-11-09 | [docs/postmortems/overlay-2025-11-09.md](../postmortems/overlay-2025-11-09.md) | Complete |
| R-004 | Sprint-03 Postmortem | [docs/Sprint-03-Postmortem.md](../Sprint-03-Postmortem.md) | Complete |
| R-005 | Sprint-04 Postmortem | [docs/Sprint-04-Postmortem.md](../Sprint-04-Postmortem.md) | Complete |

## Retrospectives

| ID | Title | Path | Status |
|----|-------|------|--------|
| R-006 | Sprint-02 Retrospective | [docs/feedback/Sprint-02-Retrospective.md](../feedback/Sprint-02-Retrospective.md) | Complete |

## RFCs / Proposals

| ID | Title | Path | Status |
|----|-------|------|--------|
| R-007 | Freeze-Lift Proposal (2025-11-10) | [docs/rfc/2025-11-10-freeze-lift-proposal.md](../rfc/2025-11-10-freeze-lift-proposal.md) | Complete |
| R-008 | Overlay Recovery RFC (2025-11-10) | [docs/rfc/2025-11-10-overlay-recovery-rfc.md](../rfc/2025-11-10-overlay-recovery-rfc.md) | Complete |

## Provenance / Historical Data Research

| ID | Title | Path | Status |
|----|-------|------|--------|
| R-009 | PROVENANCE.md (master) | [data/historical/PROVENANCE.md](../../data/historical/PROVENANCE.md) | Complete |
| R-010 | PROVENANCE.csv | [data/historical/PROVENANCE.csv](../../data/historical/PROVENANCE.csv) | Complete |
| R-011 | Provenance 1852 | [data/historical/NYC-Explorer_Provenance_1852.md](../../data/historical/NYC-Explorer_Provenance_1852.md) | Complete |
| R-012 | Provenance 1877 | [data/historical/NYC-Explorer_Provenance_1877.md](../../data/historical/NYC-Explorer_Provenance_1877.md) | Complete |
| R-013 | Provenance 1902 | [data/historical/NYC-Explorer_Provenance_1902.md](../../data/historical/NYC-Explorer_Provenance_1902.md) | Complete |
| R-014 | Provenance 1927 | [data/historical/NYC-Explorer_Provenance_1927.md](../../data/historical/NYC-Explorer_Provenance_1927.md) | Complete |
| R-015 | Provenance 1952 | [data/historical/NYC-Explorer_Provenance_1952.md](../../data/historical/NYC-Explorer_Provenance_1952.md) | Complete |
| R-016 | Provenance 1977 | [data/historical/NYC-Explorer_Provenance_1977.md](../../data/historical/NYC-Explorer_Provenance_1977.md) | Complete |
| R-017 | Provenance 2002 | [data/historical/NYC-Explorer_Provenance_2002.md](../../data/historical/NYC-Explorer_Provenance_2002.md) | Complete |
| R-018 | Manhattan Scope Plan | [data/historical/Manhattan_ScopePlan.md](../../data/historical/Manhattan_ScopePlan.md) | Complete |
| R-019 | Lower Manhattan Scope Plan | [data/historical/LowerManhattan_ScopePlan_20251031-141045.md](../../data/historical/LowerManhattan_ScopePlan_20251031-141045.md) | Complete |
| R-020 | Union Square-Flatiron Research Drop README | [data/historical/UnionSquare-Flatiron_ResearchDrop_README.md](../../data/historical/UnionSquare-Flatiron_ResearchDrop_README.md) | Complete |
| R-021 | BBL Lookup Playbook | [data/historical/BBL_Lookup_Playbook.md](../../data/historical/BBL_Lookup_Playbook.md) | Complete |
| R-022 | Historical Data README | [data/historical/README.md](../../data/historical/README.md) | Complete |
| R-023 | Historical Data README for Copilot | [data/historical/README_for_Copilot.md](../../data/historical/README_for_Copilot.md) | Complete |
| R-024 | Root Cause Summary (archived PDF) | [docs/archive/2026-01-11/loose/Root Cause Summary.pdf](../archive/2026-01-11/loose/Root%20Cause%20Summary.pdf) | Archived (untracked binary) |

## Knowledge Base (research-adjacent)

| ID | Title | Path | Status |
|----|-------|------|--------|
| R-025 | Researcher UI Spec | [docs/kb/07-Researcher-UI-Spec.md](../kb/07-Researcher-UI-Spec.md) | Complete |
| R-026 | Research Team Playbooks | [docs/kb/08-Research-Team-Playbooks.md](../kb/08-Research-Team-Playbooks.md) | Complete |

## Status Reports

| ID | Title | Path | Status |
|----|-------|------|--------|
| R-027 | Solution Report | [docs/status/solution-report.md](../status/solution-report.md) | Complete |

## Audits

| ID | Title | Path | Status |
|----|-------|------|--------|
| R-028 | Docs PASS 2 Trim Audit | [docs/research/R-028-NYC-Docs-Pass2-Trim-Audit.md](R-028-NYC-Docs-Pass2-Trim-Audit.md) | Complete (no trims needed) |

---

## Notes

- **Historical data relocated** (2026-02-07): Datasets moved from `docs/historical-data/` to `data/historical/`. Provenance links (R-009 through R-023) updated. Redirect stub at `docs/historical-data/README.md`.
- **Year-folder duplicates** (`data/historical/attractions/YYYY/`) were confirmed identical to root-level files via SHA256 and quarantined to `data/historical/_legacy/root-duplicates-2026-02-07/`.
- **Archived research** (R-024, Root Cause Summary.pdf) is an untracked binary in the archive bundle.
