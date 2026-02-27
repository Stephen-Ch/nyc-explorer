# Repo Policy — NYC Explorer

> **File Version:** 2026-02-27

## Purpose

Declares NYC Explorer's branch policy, PR rules, merge method, and naming conventions. Protocol gates reference this overlay for repo-specific workflow decisions.

## Overlay Review Gate

- Best next step? YES
- Confidence: 88

---

## Branch Policy

| Setting | Value |
|---------|-------|
| Default branch | `main` (evidence: `git symbolic-ref refs/remotes/origin/HEAD` → `refs/remotes/origin/main`) |
| Feature branch pattern | `<type>/<scope>-<short-description>` (e.g., `chore/align-vibe-kit-v7211-nyc`, `docs/octopus-overlay-nyc-explorer`) |
| Merge method | Merge commit (evidence: `git log` shows `Merge branch '...'` entries) |
| Delete branch after merge | Not documented; TODO: confirm GitHub repo setting |

## PR Rules

| Rule | Value |
|------|-------|
| Required reviewers | TODO: not documented in README or CI config |
| Required checks | CI workflow: typecheck, meta gate, E2E gate, overlay freeze guard |
| Auto-merge allowed | TODO: not documented |

## CI Checks (from `.github/workflows/ci.yml`)

1. **Overlay freeze guard** — blocks edits to `apps/web-mvc/Program.cs` and `apps/web-mvc/wwwroot/js/route-overlay.js`
2. **Typecheck Gate** — `npm run typecheck`
3. **Playwright Meta Gate** — `npx playwright test tests/meta`
4. **Playwright E2E Gate** — `npx playwright test`

## Working Agreement

From [README.md](../../README.md):
- ≤2 files / ≤60 LOC per prompt
- Tests-first: spec goes red before implementation
- Schema/Selector freeze unless a dedicated story authorizes changes
- Diff preview required before commit; Decisions log appended after GREEN

## Return Packet Naming Convention

```
return-packet-YYYY-MM-DD-<topic-slug>.md
```

Stored in: `docs/status/`

## Commit Message Convention

```
<type>: <short description>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore` (evidence: `git log` commit messages follow this pattern)
