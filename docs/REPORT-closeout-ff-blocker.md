# STOP Report — FF-Only Blocker on Main

**Prompt ID:** NYCX-CLOSEOUT-DOCS-STD-001-DIRECT-TO-MAIN-001  
**Date:** 2026-02-07  
**Status:** STOPPED — `--ff-only` will fail  
**Branch:** `overlay-drift-20251108-155953` → `main`

---

## Root Cause

Local `main` (`d15c741`) has 1 unpushed commit not present in the overlay-drift branch. Both branches diverged from merge-base `c2d1439`.

```
c2d1439 (origin/main)
   ├── d15c741 (local main, ahead 1, unpushed)
   │     └── "docs(reset): add system reset brief, recovery plan, postmortems..."
   │         15 files: .github/*, docs/Copilot-Instructions.md, docs/Protocol.md,
   │         docs/postmortems/*, docs/recovery/*, docs/templates/*, etc.
   │
   └── e23d372 → ... → 3d2d724 (overlay-drift-20251108-155953, 10 commits)
             └── PASS 1 docs standardization chain
```

## Key Facts

| Item | Value |
|------|-------|
| `origin/main` | `c2d1439` |
| Local `main` | `d15c741` (ahead 1 of origin, **unpushed**) |
| `overlay-drift` HEAD | `3d2d724` (10 commits from `c2d1439`) |
| Merge-base | `c2d1439` (both branch from here) |

## Divergent Commit: `d15c741`

```
docs(reset): add system reset brief, recovery plan, postmortems, and templates; tighten guardrails
Author: StephenChurchville
Date:   Sun Nov 9 09:30:35 2025 -0500

15 files changed, 401 insertions(+), 49 deletions(-)
```

### Files in `d15c741`

| File | Change |
|------|--------|
| `.github/pull_request_template.md` | +22 (NEW) |
| `.github/workflows/ci.yml` | +8 |
| `docs/Code-Review-Guide.md` | +5 |
| `docs/Copilot-Instructions.md` | +42/-10 (rewrite) |
| `docs/Protocol.md` | +15/-4 |
| `docs/Session-Start.md` | +8/-1 |
| `docs/Workflow-Tweaks-S6.md` | +19/-1 |
| `docs/code-review.md` | +14/-1 |
| `docs/nyc-explorer-system-reset-2025-11-09.md` | +64 (NEW) |
| `docs/plans/.gitkeep` | 0 (NEW) |
| `docs/postmortems/GPT Overlay Breakdown postmortem.md` | +96 (NEW) |
| `docs/postmortems/overlay-2025-11-09.md` | +60 (NEW) |
| `docs/project-history.md` | +39/-5 (rewrite) |
| `docs/recovery/overlay-recovery-plan.md` | +27 (NEW) |
| `docs/templates/high-risk-plan.md` | +31 (NEW) |

### Scope concern

`.github/pull_request_template.md` and `.github/workflows/ci.yml` are **non-docs** files. Merging `d15c741` into the overlay-drift branch would violate the DOCS-ONLY scope guardrail.

### Content overlap

Several files created in `d15c741` (postmortems, recovery plan, templates) already exist in the overlay-drift branch via the archive bundle commit (`e23d372`) and tracked-folders commit (`f99a1f0`).

---

## Options

| Option | Action | Risk |
|--------|--------|------|
| **A** | Reset local `main` to `origin/main` (`c2d1439`), discarding the unpushed `d15c741` commit. Then ff-only `main` → overlay-drift succeeds. The `d15c741` content appears already archived in overlay-drift. Commit stays in reflog. | LOW |
| **B** | Rebase overlay-drift onto `main` (`d15c741`), creating linear history including both. Requires force-push of overlay-drift. | MEDIUM — rebase conflicts likely in shared docs files |
| **C** | Allow a merge commit (`git merge` without `--ff-only`). Prompt explicitly forbids this. | N/A per prompt rules |

## Recommendation

**Option A** — reset local main to `origin/main`. Rationale:

1. The `d15c741` commit was never pushed to origin (local-only, ahead 1).
2. Its content (postmortems, recovery plan, templates) is already captured in the overlay-drift archive bundle and tracked folders.
3. Non-destructive: commit remains in `git reflog` for 90 days.
4. Unblocks the clean ff-only merge path with zero conflict risk.

### Verification before executing Option A

Before discarding `d15c741`, confirm no unique content is lost:

```powershell
# Check each file in d15c741 against overlay-drift HEAD
git diff d15c741 overlay-drift-20251108-155953 -- docs/postmortems/ docs/recovery/ docs/templates/
```

If the diff shows the overlay-drift branch already has equivalent or superseding content, proceed with:

```powershell
git checkout main
git reset --hard origin/main          # main → c2d1439
git merge --ff-only overlay-drift-20251108-155953
git push origin main
```

---

**Decision required from Stephen before proceeding.**
