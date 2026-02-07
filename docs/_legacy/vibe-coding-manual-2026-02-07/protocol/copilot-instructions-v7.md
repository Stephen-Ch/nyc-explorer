# Copilot Instructions v7 — NYC Explorer

## Prompt Classes

Two request types:

**FORMAL WORK PROMPT:**
- Required for: terminal commands, file edits, tests/builds, commits, merges
- Format: Fenced block with PROMPT-ID + GOAL + SCOPE + TASKS + END PROMPT
- Copilot executes these prompts following all gates (Prompt Review Gate, Command Lock, Proof-of-Read, Green Gate)

**CONVERSATIONAL REQUEST:**
- Allowed for: discussion, analysis, critique, recommendations, verification (read-only)
- Format: Natural language (no PROMPT-ID required)
- Copilot does NOT execute work (no terminal commands, no edits). Read-only tools allowed.
- If conversational request asks for execution: draft FORMAL WORK PROMPT with Story ID + NEXT citation

## Non-Negotiables (FORMAL WORK PROMPTS)
- **PROMPT-ID** required as FIRST line when executing FORMAL WORK PROMPT
- **Prompt Review Gate (MANDATORY FIRST OUTPUT)** must be printed immediately after PROMPT-ID and BEFORE anything else (including Proof-of-Read). Output exactly 4 lines: "What:" (1-line summary), "Best next step?" YES/NO, "Confidence:" HIGH/MEDIUM/LOW, "Work state:" READY|IN-PROGRESS|COMPLETE|MERGED|OBSOLETE. NO commands, edits, searches, or tool calls are allowed until these four lines are printed (Command Lock). If "Best next step?" is NO, "Confidence" != HIGH, or "Work state:" != READY (except merge/closeout prompts requiring COMPLETE), STOP and explain before doing anything further.
- **Proof-of-Read** required on EVERY response (file + quote + "Applying: <rule>") and must appear after the Prompt Review Gate block and before any searches or edits. Repo sanity commands may run after the Gate.
- **Green Gate** for code prompts: `npm run e2e:auto` + `npm run typecheck`
- **Stop on Error**: non-zero exit → stop, propose smallest fix, wait
- No "I tested in browser" claims
- **ONE COPY-PASTE DOCUMENT**: Entire response (PROMPT-ID → Proof-of-Read → Gate → Work → Summary) must be one continuous markdown document with ZERO fenced code blocks anywhere (use 4-space indentation instead)

## Default Formal Report Footer

When a prompt involves codebase searching, include:
- Search method used: `rg | git grep | Select-String`

When any recovery is used, include:
- Recovery applied: `none | retry | fallback`

Notes:
- Default to fallbacks; never assume `rg` exists.
- If strict sequencing is required by the prompt, do not batch commands.

## Sequencing (Hard Rule)
- Do not author or request the next prompt until the prior Copilot completion report has been pasted and acknowledged in chat.
- If the operator says “wait for Copilot’s report” (or implies the current report isn’t posted yet), STOP and wait for confirmation before proceeding.
- If you violate Command Lock or Gate ordering, STOP immediately, report what happened, and restart from the beginning of the prompt.

## Project Context
- Stack: ASP.NET Core 8 MVC + TypeScript (Leaflet + OSM tiles)
- Tests: Playwright e2e (`npm run e2e:auto`) + schema spec (`npm run schema`)
- Type safety: TypeScript typecheck (`npm run typecheck`)
- Content source: `content/poi.v1.json`

## Terminal Policy
- Echo CWD + versions once per session
- Prefer `npm ci` for installs (if ever needed)
- No new dependencies without explicit approval

## Edit Constraints
- Keep steps small (≤ ~50 LOC and ≤ 2 files per step) unless the prompt explicitly allows more
- One numbered plan → execute step 1 only, then report (only after Command Lock is satisfied)
- Hot files: analysis-only first prompt (see below)

## NYC Explorer Hot Files (Two-Path Rule)
When touching any of these, pick ONE path: (1) analysis-only prompt first, OR (2) full-file replacement in one edit + tests/build same prompt:
- `apps/web-mvc/Program.cs` (home HTML generation + routing map)
- `apps/web-mvc/wwwroot/js/home.js` (primary client orchestration)
- `apps/web-mvc/wwwroot/js/adapters.js` (provider bridge + error semantics)
- `apps/web-mvc/wwwroot/js/directions.js` (direction rendering + overlays)
- Any file touched in the last 3 prompts

Piecemeal line edits on hot files are forbidden.

## Cross-cutting Changes — Coverage + Proof Requirements

Treat these as cross-cutting (requiring route coverage proof):
- Palette CSS variables (--mg-primary, --mg-bg, etc.)
- Voice/tone changes (disclaimers, medical framing, calm language)
- Layout grids or spacing systems
- CTA button styles or labels
- Shared UI components
- Monospace rendering or typography

For cross-cutting or UX work, REQUIRED REPORTS must include:
- Route Coverage Table using NYC Explorer routes (source of truth: `apps/web-mvc/Program.cs` and controllers) with statuses limited to UPDATED or NO CHANGE REQUIRED plus reasons.
- Old Pattern Search results (exact grep command, match count, remaining occurrences)
- Proof-of-Experience Block (what user sees now, what changed, which routes, visual verification)

If any of these proofs are missing, STOP. Cross-cutting/UX work is incomplete without evidence.

## Content Gate
If a prompt touches any of:
- `content/*`

Then run:
- `npm run schema`
Then:
- `npm run e2e:auto`
- `npm run typecheck`

## Measure Production First (Production Shape Gate)

For any content-dependent change or assertion about production state:

- **Identify** the production artifact (e.g., `content/poi.v1.json` or `/content/poi.v1.json`)
- **Record** property chains and counts that matter (no guessing)
- **Import** real generated JSON into tests for content-dependent behavior (no invented IDs like "liberty-q0-fu0" unless they exist)
- **Contract Test**: If disabling/removing UI because production has 0 items, add a contract test that locks the measured state and comment: "If this fails, restore <feature>."
- **UI Copy Lock**: UI copy comes from a single dictionary; labels must never be treated as evidence for storage shape

## Routing Notes
- Server routes are defined via `apps/web-mvc/Program.cs` plus controller route attributes.

## After Every Green Change (CODE prompts)
Update `docs/status/solution-report.md` with:
- What changed
- Files touched
- Tests/build results
- Decisions made (if any)

## S1A RED-LOCK (Tests-only)
Purpose: S1A prompts add failing tests ONLY. If tests pass, STOP.

Allowed files in S1A:
- `*.spec.ts` (test files only)
- `docs/testing/test-catalog.md`
- `docs/status/solution-report.md`
- `docs/status/code-review.md`
- `docs/status/branches.md`

Disallowed in S1A:
- Any non-test TypeScript
- Any HTML/SCSS
- Config files
- package.json / lockfiles

Enforcement:
1. Run `npm run e2e:auto` immediately after adding tests
2. Tests MUST FAIL in S1A
3. If tests PASS: STOP and report "Unexpected GREEN in S1A"
4. No commit/push in S1A

## Test Catalog Rules
Required reading: before editing tests, read `docs/testing/test-catalog.md`.

Update rule: if you touch a spec file, update its catalog row in the same prompt.

Header adoption: if you touch a spec file and it lacks the Spec Header Standard, add it in that prompt.

Completion report must include:
- "Tests touched:" list each spec + paste its `@human` line

## Deterministic Tests (Mandatory)
- No unseeded randomness
- No "rerun until green"
- If flakiness exists, record TECH DEBT with an ID and cause

## Entry-point Map (Mandatory in Reports)
Every code prompt completion report must include:
- Entry points touched: path#function list

## Completion Report Required Fields
Every completion report must explicitly include:
- Commit hash + subject of the most recent commit
- `git status --porcelain` output (must be empty at the end)
- `git diff --name-only` output showing touched files
- Results of `npm run e2e:auto` and `npm run typecheck`
- If any spec file was touched: paste each spec’s `@human` line and confirm the catalog row was updated

These required fields are mirrored in the test-touch block and closeout templates; omit nothing even on docs-only prompts.

## S2C Closeout — Artifact Verification (Mandatory)
Every S2C completion report must include the verification table template:
`docs/vibe-coding/templates/closeout-artifact-verification-template.md`

## Legacy Docs
Legacy protocol duplicates live under `docs/` for backward compatibility only; treat `docs/vibe-coding/` as source of truth.
