# Canonical Commands

> **CRITICAL RULE:** Never omit `docs/project/` or `docs/testing/` in printed commands. Never rely on linkified filenames. Always use `git -C ...` to enforce repo-root execution.

## Reporting Standard — Narrative Dirs Only; Raw Evidence Is Authority

**A) Narrative**
- Narrative summaries MUST list ONLY directory buckets (example: docs/project: 2 files; app/src/...: 1 file).
- Narrative MUST NOT list filenames or full file paths.
- Narrative MUST NOT attempt to "fix" or "avoid" VSCode linkification.

**B) Authority**
- File locations and exact paths MUST be proven ONLY via raw command outputs:
  - `git -C $root diff --name-only`
  - `git -C $root ls-files docs/project/VISION.md docs/project/EPICS.md docs/project/NEXT.md docs/testing/test-catalog.md`
  - Population Gate grep command + result
  - doc-audit output (including any "Checked:" lines)
- If narrative conflicts with raw outputs, raw outputs win.

**C) Deprecation**
- Prior "canonical paths in narrative" requirement is deprecated due to tool linkification constraints.
- Commands MUST still use explicit canonical paths; only narrative summaries are restricted to directory buckets.

## Critical Command Rule — Explicit Canonical Paths
- Commands MUST use explicit canonical paths (no pathspec shortcuts such as `docs/project`).
- Population Gate MUST scan using explicit canonical paths.

## REPO ROOT ANCHOR (PowerShell)
```powershell
$root = git rev-parse --show-toplevel
Set-Location $root
git rev-parse --show-toplevel
git rev-parse --show-prefix
Get-Location
```

## CANONICAL PROOF COMMANDS

### A) Control Deck Existence Proof
```bash
git -C "$(git rev-parse --show-toplevel)" ls-files docs/project/VISION.md docs/project/EPICS.md docs/project/NEXT.md
```

### B) Population Gate (Control Deck only)
```bash
git -C "$(git rev-parse --show-toplevel)" grep -n -i -E "(TBD|TODO|TEMPLATE|PLACEHOLDER|FILL IN|COMING SOON|XXX|FIXME|TO BE DETERMINED|<fill)" -- docs/project/VISION.md docs/project/EPICS.md docs/project/NEXT.md
```

### C) Test Catalog Canonical Proof
```bash
git -C "$(git rev-parse --show-toplevel)" ls-files docs/testing/test-catalog.md
```

### D) Mandatory Location Proof
```bash
git -C "$(git rev-parse --show-toplevel)" rev-parse --show-toplevel
git -C "$(git rev-parse --show-toplevel)" rev-parse --show-prefix
```
