# Copilot-Instructions — UPDATED for Sprint 02 (v2)

> **Read this before every prompt.** Enforces prompt‑only, tiny‑step TDD with zero guessing.

## Read Order (each prompt)
Project.md → Sprint-03-Plan.md → Protocol.md → Copilot-Instructions.md → selectors.md → code-review.md (last 3)

## Read Order (always)

1) docs/Protocol.md
2) docs/Copilot-Instructions.md (Prompt Skeleton, Hard Guardrails, Allowed-Edits Fence)
3) docs/selectors.md
4) docs/Sprint-04-Plan.md (or latest Sprint-XX-Plan.md)
5) docs/code-review.md (read last 3 Decisions lines only)
6) docs/project-history.md (read last 2 micro-entries only)
7) docs/Project.md
8) docs/Working-With-Stephen.md (skim headings + Do/Don’t)

**Q-GATE TL;DR**
- Ask only if lift ≥10% (default), ≥5% (high-risk: DevOps, adapters/deps, schema/data, a11y), ≥15% (trivial UI/docs).
- ≤2 minutes, ≤3 questions, one message, once.
- Use the `Q-GATE:` header; otherwise proceed silently.

## Response Schema (every reply)
- Assumptions: <none|list>
- Allowed-Edits Fence: planned=<files/LOC>, actual=<files/LOC>
- Commands run: <ordered list>
- Tests: passed=<n>/<N>; suite=<N>; typecheck=<green|errors>; artifacts=<paths+sizes|none>
- Selectors touched: <list|none>; Schema keys: <OK|mismatch>
- Outcome: <RED|GREEN + one-liner why>
- Logs: code-review.md <appended|skipped>; project-history.md <appended|n/a>
- Next step: <one tiny step> or Ambiguity Card

**Logging Policy:** Project-History.md is updated **after GREEN** only; RED steps are logged in code-review.md.

## Prompt Skeleton (strict)
- **TITLE**: `P<NN> — <STORY-ID + slice>`
- **READ**: list the 3 paths above
- **STORY + GOAL**: one sentence
- **BEHAVIOR**: 3–6 Given/When/Then (**include edge + error**)
- **CONSTRAINTS**: name **exact files** + **≤ 2 files / ≤ 60 LOC**
- **ARTIFACTS**: screenshots/log paths if any
- **AFTER-GREEN**: 
  - Append one line to `/docs/code-review.md`
  - Append a micro-entry to `/docs/project-history.md` using the template (≤5 lines)
- **OUTCOME**: **PROCEED / REVISE / BLOCK**
- **Assumptions**: *none* (if any → BLOCK with Ambiguity Card)

## Hard Guardrails (no exceptions)
- **No‑Guessing Contract** → unclear? return **Ambiguity Card** and **BLOCK** (no code).
- **Allowed‑Edits Fence** → touch only named files; honor LOC/file limits.
- **Tests‑First Gate** → first reply is RED spec; await "OK, implement."
- **Schema/Selector Freeze** → don't rename keys/routes/selectors without a new story.
- **Diff Preview Before Commit** → show **unified diff** (inline `git diff` style, not side‑by‑side) and include per‑file LOC delta; await "APPLY."
- **Decisions Log Binding** → after GREEN, append one line to `/docs/code-review.md`.
- **Project History Binding** → after GREEN, append one ≤5-line micro-entry to `/docs/project-history.md` (newest on top, follow template).

## Pause Rule
After a backlog item is GREEN and logged, **STOP**. Await explicit user cue (“NEXT” or “PROCEED — P##”). Do not propose or begin the next prompt.

## Definition of Ready (per prompt)
- Title + READ paths present
- Behavior includes **edge + error** cases
- Allowed **files + LOC** listed
- **UPDATE targets** listed
- Outcome declared (PROCEED/REVISE/BLOCK)
- **Assumptions: none**

## Deterministic E2E (UI stories)
- Fix viewport (e.g., `1280×800`) and prefer `await expect(...).toBeVisible()` over manual throws.
- For async DOM (fetch), rely on Playwright’s built‑in waiting (no sleeps).

## Optional Visual Smoke (UI stories)
- After GREEN, run once in **headed** mode and capture `#map` screenshot to `docs/artifacts/<STORY-ID>/P<NN>-map.png` (no pixel diff). Store in git; keep ≤1 image per story, ≤500KB.

## Selectors Guidance (data-testid vs id/class)
- **Use `data-testid`** for test‑targeted list items/controls (kebab‑case, e.g., `poi-item`, `back-to-map`).
- **Use `id`** for unique structural containers (e.g., `#map`).
- **Use `class`** for styling only; don’t test on classes unless from a third‑party lib.
- **Leaflet classes** (`.leaflet-*`) are external; do **not** customize/rename them. It’s OK to assert their presence (e.g., `.leaflet-marker-icon`).

## Ambiguity Card — example
```
Ambiguity Card — P12 ROUTE-1
Questions:
- Q1: Route to detail page is server `/poi/{id}` or client `/#/poi/{id}`?
- Q2: Selector for “Back to Map” link? (proposal: [data-testid="back-to-map"])
Intended approach if approved:
- Server route `/poi/{id}` with Razor view that fetches POI by id.
Files to touch (≤2) + approx LOC (≤60):
- apps/web-mvc/Program.cs (~20), apps/web-mvc/Views/Poi/Detail.cshtml (~40)
Risk notes:
- Selector drift if names differ from selectors.md
Outcome: **BLOCK** (awaiting answers)
```

## Sprint‑02 Preflight (stories to add before features)
- **TOOL-1**: Playwright `webServer` auto‑start/stop (command: `dotnet run`, port 5000; `reuseExistingServer: true`).
- **TOOL-2**: `tsconfig.json` + `@types/node` to remove TS warnings in tests.
- **SCHEMA-TYPES**: Generate or define TS types that mirror the Zod schema (prevents `coords`/`coordinates` mismatches).

**End.**

## Adapter Guidance (Sprint 05)
- Read `docs/Adapters.md` right after `docs/selectors.md` before drafting any prompt touching geocoding or routing.
- All slices must use `window.App.adapters.geo` / `.route`; swapping implementations requires updating docs/Adapters.md alongside selectors.
