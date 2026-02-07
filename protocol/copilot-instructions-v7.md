# Copilot Instructions v7 — Blackjack Sensei

> **File Version:** 2026-01-18 | **Bundle:** v7.1.4

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
  - **CRITICAL:** The completion report's FIRST LINE must be EXACTLY: `PROMPT-ID: <id>`
  - No headings, no text, no blank lines before it
  - Common failure: Starting with "## Completion Report" or "Here are the results" — this is WRONG
  - Correct: `PROMPT-ID: US-016-S1E-001` (then Prompt Review Gate on next lines)
- **Prompt Review Gate (MANDATORY FIRST OUTPUT)** must be printed immediately after PROMPT-ID and BEFORE anything else (including Proof-of-Read). Output exactly 4 lines: "What:" (1-line summary), "Best next step?" YES/NO, "Confidence:" HIGH/MEDIUM/LOW, "Work state:" READY|IN-PROGRESS|COMPLETE|MERGED|OBSOLETE. NO commands, edits, searches, or tool calls are allowed until these four lines are printed (Command Lock). If "Best next step?" is NO, "Confidence" != HIGH, or "Work state:" != READY (except merge/closeout prompts requiring COMPLETE), STOP and explain before doing anything further.
- **Proof-of-Read** required on EVERY response (file + quote + "Applying: <rule>") and must appear after the Prompt Review Gate block and before any searches or edits. Repo sanity commands may run after the Gate.
- **Green Gate** for code prompts: `npm run test` + `npm run build`
- **Stop on Error**: non-zero exit → stop, propose smallest fix, wait
- No "I tested in browser" claims
- **ONE COPY-PASTE DOCUMENT**: Entire response (PROMPT-ID → Proof-of-Read → Gate → Work → Summary) must be one continuous markdown document with ZERO fenced code blocks anywhere (use 4-space indentation instead)

## Default Formal Report Footer

When a prompt involves codebase searching, include:
- Search method used: `rg | git grep | Select-String`

When any recovery is used, include:
- Recovery applied: `none | retry | fallback`

For every formal work prompt, include:
- Help trigger used: `YES | NO`
- If YES: Report requested: `PROMPT-ID`

Notes:
- Default to fallbacks; never assume `rg` exists.
- If strict sequencing is required by the prompt, do not batch commands.

## Mandatory Help Trigger Check (Preflight for Execution)

Before implementing any FORMAL WORK PROMPT, Copilot MUST verify:

1. **Multi-scenario/tenant copy?** — Does this touch multi-scenario or multi-tenant copy? If yes, confirm a registry key exists (e.g., `introByScenario[scenarioId]`). If no registry key, STOP and request agent report.
2. **Known runtime key path?** — Do we know the exact runtime key path (how scenarioId/tenantId reaches this code)? If not, STOP and request agent report.
3. **Multi-component change?** — Do we expect edits in 2+ components? If yes, require a call-site map (either from agent report or explicit grep findings in the prompt). If missing, propose agent report.
4. **Refactor without call-site map?** — If the prompt requests a refactor but lacks a call-site map, propose an agent report instead of guessing.

If any check fails, STOP and request an agent report using the template in protocol-v7.md (Help Triggers section).

## STOP / PIVOT Rule for Better-than-Prompt Discoveries

When executing a prompt, Copilot may discover that the repo state differs from what the prompt assumed. This section defines required behavior.

### A) PIVOT REPORT (Mandatory Before Editing)

If the prompt instructs adding a new scoping hook (ID/class) but an existing stable wrapper is found, Copilot MUST output a **PIVOT REPORT** BEFORE making any edits:

    PIVOT REPORT
    Expected (from prompt): Add id="teach-index" to container
    Found (evidence): id="teach" already exists at Views/Teach/Index.cshtml:30
    Proposed pivot: Use #teach li.disabled instead of #teach-index li.disabled
    Risk assessment: Using existing ID is safer (no markup change, already stable)

### B) PIVOT Approval Criteria

Proceed with the pivot ONLY if:
- The pivot produces **identical behavior** (same visual/functional result)
- The pivot uses **strictly narrower or equal scope** (no broader selectors)
- The existing hook is **stable** (not dynamically generated or likely to change)

If ANY of these criteria fail, **STOP** and request guidance from the operator.

### C) Contradiction STOP Rule

If repo evidence **contradicts** the prompt's plan (not just offers a better alternative), STOP immediately:

**Examples requiring STOP:**
- Prompt says "extract CSS from RootsStems.cshtml" but no such CSS exists
- Prompt says "add to style.css" but that file isn't loaded on the target page
- Prompt assumes a container exists but it doesn't

**STOP output format:**

    STOP: PROMPT CONTRADICTED BY EVIDENCE
    Prompt assumption: RootsStems.cshtml contains Continue/Prev button styles
    Evidence: RootsStems.cshtml:13-22 contains only div.scroll styles (no button CSS)
    Request: Clarify scope or update prompt

### D) Confidence Gate Integration

- Mark confidence as **MED** when evidence is incomplete but work can proceed with pivot
- Mark confidence as **LOW** when evidence contradicts prompt (requires STOP)
- Mark confidence as **HIGH** only when evidence is captured and consistent with plan

## Sequencing (Hard Rule)
- Do not author or request the next prompt until the prior Copilot completion report has been pasted and acknowledged in chat.
- If the operator says “wait for Copilot’s report” (or implies the current report isn’t posted yet), STOP and wait for confirmation before proceeding.
- If you violate Command Lock or Gate ordering, STOP immediately, report what happened, and restart from the beginning of the prompt.

## Project Context — Lessonwriter
- Stack: ASP.NET MVC 5, .NET Framework 4.8, Razor views, jQuery, Bootstrap
- Build: MSBuild via Visual Studio or `msbuild /p:Configuration=Release`
- Tests: No automated test project currently (manual browser testing)
- Database: SQL Server via Entity Framework
- Key Projects: LessonWriter2_0 (web app), LessonWriterDB (data layer), parseTaggerNET3 (NLP processing)

## Terminal Policy
- Echo CWD once per session
- Use PowerShell for terminal commands
- No NuGet package changes without explicit approval
- Prefer `msbuild` for builds

## Edit Constraints
- Keep steps small (≤ ~50 LOC and ≤ 2 files per step) unless the prompt explicitly allows more
- One numbered plan → execute step 1 only, then report (only after Command Lock is satisfied)
- Hot files: analysis-only first prompt (see below)

## Lessonwriter Hot Files (Two-Path Rule)
When touching any of these, pick ONE path: (1) analysis-only prompt first, OR (2) full-file replacement in one edit + manual test same prompt:
- `LessonWriter2.0/Controllers/TeachController.cs` — Lesson authoring workflow
- `LessonWriter2.0/Controllers/StudentController.cs` — Student lesson delivery
- `LessonWriterDB/LessonData.cs` — Core data model
- `LessonWriter2.0/Views/Shared/_Layout.cshtml` — Master layout
- `LessonWriter2.0/App_Start/RouteConfig.cs` — Routing configuration
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
- Controller Coverage Table using Lessonwriter controllers:
  | Controller | Action | Status | Evidence |
  |------------|--------|--------|----------|
  | TeachController | Design | UPDATED / NO CHANGE REQUIRED | reason |
  | StudentController | Lesson | UPDATED / NO CHANGE REQUIRED | reason |
  (List all affected controller/action pairs)
- Old Pattern Search results (exact grep command, match count, remaining occurrences)
- Proof-of-Experience Block (what user sees now, what changed, which views, visual verification)

If any of these proofs are missing, STOP. Cross-cutting/UX work is incomplete without evidence.

## Green Gate (Lessonwriter)
Since no automated tests exist:
1. Build: `msbuild LessonWriter2.0\LessonWriter2_0.csproj /p:Configuration=Release /p:BuildProjectReferences=false` must succeed
   - Note: `/p:BuildProjectReferences=false` skips parseTaggerNET3.0 dependencies which have pre-existing build issues
2. Manual: Confirm affected pages load without JavaScript console errors
3. Document: Note which pages/actions were manually tested in completion report

## Measure Production First (Production Shape Gate)

For any content-dependent change or assertion about production state:

- **Identify** the production artifact (e.g., `src/assets/content/rawls-values.generated.json`)
- **Record** property chains and counts that matter (no guessing)
- **Import** real generated JSON into tests for content-dependent behavior (no invented IDs like "liberty-q0-fu0" unless they exist)
- **Contract Test**: If disabling/removing UI because production has 0 items, add a contract test that locks the measured state and comment: "If this fails, restore <feature>."
- **UI Copy Lock**: UI copy comes from a single dictionary; labels must never be treated as evidence for storage shape

## Zoneless Rules
- App: zoneless only (`provideZonelessChangeDetection()`)
- Tests: `zone.js/testing` allowed in `src/test.ts` only

## Routing Sentinel
Root template contains only:
~~~html
<router-outlet></router-outlet>
~~~

## After Every Green Change (CODE prompts)
Update `docs-engineering/status/solution-report.md` with:
- What changed
- Files touched
- Tests/build results
- Decisions made (if any)

## S1A RED-LOCK (Tests-only)
Purpose: S1A prompts add failing tests ONLY. If tests pass, STOP.

Allowed files in S1A:
- `*.spec.ts` (test files only)
- `docs-engineering/testing/test-catalog.md`
- `docs-engineering/status/solution-report.md`
- `docs-engineering/status/code-review.md`
- `docs-engineering/status/branches.md`

Disallowed in S1A:
- Any non-test TypeScript
- Any HTML/SCSS
- Config files
- package.json / lockfiles

Enforcement:
1. Run `npm run test` immediately after adding tests
2. Tests MUST FAIL in S1A
3. If tests PASS: STOP and report "Unexpected GREEN in S1A"
4. No commit/push in S1A

## Test Catalog Rules
Required reading: before editing tests, read `docs-engineering/testing/test-catalog.md`.

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
- Results of `npm run test` and `npm run build`
- If any spec file was touched: paste each spec’s `@human` line and confirm the catalog row was updated

These required fields are mirrored in the test-touch block and closeout templates; omit nothing even on docs-only prompts.

## S2C Closeout — Artifact Verification (Mandatory)
Every S2C completion report must include the verification table template:
`docs/protocol/closeout-artifact-verification-template.md`

## Legacy Docs
Legacy Rawls docs will be archived later under `docs/archive/deprecated/` (Prompt B).
