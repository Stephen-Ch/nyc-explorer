# Hot Files — NYC Explorer

> **File Version:** 2026-02-27

## Purpose

Lists files and folders that require extra caution: analysis-first workflow, full-file replacement, or a Return Packet Gate before touching. The Return Packet Gate and other protocol gates reference this overlay to decide when to trigger research checkpoints.

## Overlay Review Gate

- Best next step? YES
- Confidence: 90

---

## Hot Files (check these first)

| File / Folder | LOC | Purpose | Why Hot |
|---------------|-----|---------|---------|
| `apps/web-mvc/Program.cs` | 156 | ASP.NET Core app bootstrap + middleware pipeline | Highest churn (22 commits in last 100); overlay freeze guard in CI |
| `apps/web-mvc/wwwroot/static/home.inline.html` | 379 | Main page HTML template | >300 LOC; 4 commits; tightly coupled to JS overlays |
| `apps/web-mvc/wwwroot/js/_overlay/overlay-core.js` | 104 | Overlay JS runtime | 6 commits; overlay freeze guard in CI covers sibling `route-overlay.js` |
| `docs/project-history.md` | — | Process log | Highest churn overall (44 commits); docs coordination file |
| `docs/code-review.md` | — | Code review decisions log | 44 commits; docs coordination file |
| `tests/e2e/overlay.smoke.spec.ts` | 56 | Overlay smoke tests | 4 commits; test identity for overlay feature |
| `content/poi.v1.json` | — | POI content data | Schema-frozen; changes require dedicated story |

## Hot Folders

Directories where any change should trigger careful review:

- `apps/web-mvc/wwwroot/js/_overlay/` — Overlay JS components; CI freeze guard active
- `apps/web-mvc/wwwroot/static/` — Inline HTML templates; >300 LOC files
- `tests/e2e/` — E2E test specs; selector/schema freeze applies
- `docs/project/` — Control Deck (VISION/EPICS/NEXT); triggers Doc Audit rerun

## Criteria for Adding Files

Add a file to this list when ANY of these apply:

- **>300 LOC** — Too large for safe inline edits
- **High churn** — Frequently changed, high merge-conflict risk
- **Coordination role** — Orchestrates multiple subsystems
- **CI freeze guard** — Protected by overlay freeze enforcement in CI
- **Schema/selector frozen** — Changes require dedicated story authorization
