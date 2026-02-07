# Protocol v7 — NYC Explorer

## Core Rules (Non-Negotiable)

1. **Prompt Review Gate + Command Lock (MANDATORY FIRST OUTPUT)**: Immediately after PROMPT-ID and BEFORE Proof-of-Read, the AI must output exactly 4 lines:
   - "What:" (1-line summary of what you will do)
   - "Best next step?" YES/NO
   - "Confidence:" HIGH/MEDIUM/LOW
   - "Work state:" READY|IN-PROGRESS|COMPLETE|MERGED|OBSOLETE
   **Prompt Review Gate (ROLE CLARITY):** The Prompt Review Gate is performed by **Copilot** (the executor) on the prompt text **before** running any commands. ChatGPT may draft prompts, but Copilot must first output the gate decision (YES/NO, confidence, PROCEED/STOP). If STOP, Copilot must ask the minimum questions or request edits and must not execute anything.

   **STOP conditions:** 
   - If "Best next step? NO" OR "Confidence:" != HIGH, STOP immediately and explain why.
   - If "Work state:" != READY, STOP immediately (EXCEPTION: merge/closeout prompts require state = COMPLETE).
   - If prompt is unclear, request clarification from operator.
   - If the prompt adds stricter sequencing/format/tool constraints beyond this protocol (e.g., “Proof-of-Read immediately after Gate”, “Stop immediately on any error”, “no fenced code blocks”, “no rg”), and you are not prepared to follow them exactly with the available tools, you MUST set "Best next step? NO" (or "Confidence: MEDIUM") and STOP with the smallest prompt correction needed.
   
   **Command Lock:** NO terminal commands, NO file edits, NO searches until the Prompt Review Gate is printed. If you realize you already ran a command before printing the gate, STOP immediately and report exactly what you ran. The Prompt Review Gate must appear before the first command (including git, npm, editors, search, generators, etc.) in EVERY report without exception. Before any git/grep commands, anchor to repo root using: Set-Location (git rev-parse --show-toplevel); git rev-parse --show-toplevel; Get-Location. Never run git pathspec checks from a subfolder.
   
   **Sequencing (Two-tier Command Lock):** Lock A (hard) forbids terminal execution/edits/searches/network/file writes before the 4-line Gate output. After the Gate, repo sanity commands (e.g., `git status`, `git log`) are allowed before Proof-of-Read; Proof-of-Read must appear before any searches or edits.

   **Gate Approval Checklist (required before answering YES):**
   - Read the entire prompt (all sections) and identify any additional constraints (ordering, formatting, stop-on-error behavior, forbidden tools, etc.).
   - Verify feasibility with available tools (e.g., if `rg` isn’t available, plan to use `git grep` or `Select-String` if allowed by the prompt).
   - Verify you can follow the prompt’s exact ordering (e.g., Proof-of-Read immediately after Gate) without mixing in commands or extra output.
   - If any required constraint cannot be met reliably, do NOT approve the prompt.

   **Preflight (MANDATORY in formal prompts):** Every FORMAL WORK PROMPT must include a short Preflight checklist stating:
   - Expected search tool + approved fallbacks (`rg` → `git grep` → PowerShell `Select-String`)
   - Clean tree expectation (required vs allowed dirty)
   - Sequencing allowance: repo sanity allowed after Gate (Lock B)
   - Command batching: allowed by default; if strict ordering is required, batching is disallowed
   - Required output targets (files to write, if any)

   **Anti-batching for strict sequencing:** If a prompt requires a strict order across multiple commands, run commands one-at-a-time (no batching). Batching is fine for repo sanity unless a prompt explicitly forbids it.

   **Prompt overrides protocol:** Prompts may impose stricter sequencing than this protocol, but must state it explicitly in a single line:
   - STRICT SEQUENCE: Proof-of-Read must occur before ANY commands.
   
   **Work State Definitions:** See [prompt-lifecycle.md](protocol/prompt-lifecycle.md) for state definitions and STOP rules.

## Prompt Classes (Request Types)

Two request types are recognized:

**FORMAL WORK PROMPT** (required for execution):
- Required for: ANY terminal commands, file edits, tests/builds, commits, merges
- Format: Single fenced code block with PROMPT-ID + GOAL + SCOPE + TASKS + END PROMPT marker
- Enforcement: MUST include Story ID + NEXT STEP citation from docs/project/NEXT.md (exception: protocol maintenance)
- All gates apply: Prompt Review Gate, Command Lock, Proof-of-Read, Green Gate

**CONVERSATIONAL REQUEST** (discussion/analysis only):
- Allowed for: Discussion, planning, analysis, critique, recommendations, verification audits
- Format: Natural language (no PROMPT-ID required)
- Restrictions: MUST NOT run terminal commands, edit files, or claim Green Gate results. Read-only tools (read_file, grep_search, list_dir, git log/status/diff) allowed.
- If conversational request asks for work execution: respond by drafting a FORMAL WORK PROMPT (with Story ID + NEXT citation) rather than STOP.

## Vision & User Story Gate (MANDATORY for work prompts)

**Canonical Active Plan:** `docs/project/NEXT.md` is the single source of truth for ACTIVE STORY + NEXT STEP.

Every work prompt MUST include:
1. **Story ID** (from docs/project/NEXT.md)
2. **Next step sentence** (verbatim or near-verbatim from docs/project/NEXT.md)
3. **DoD snippet** (1 sentence Definition of Done)
4. **Copy Source Decision** (TS vs JSON vs content schema vs admin pipeline) when touching user-facing copy
5. **3-Party Approval Gate declaration:** "3-Party Approval Gate: satisfied" OR "in Alignment Mode" (see [alignment-mode.md](protocol/alignment-mode.md) → 3-Party Approval Gate (Canonical))

**"Best next step? YES" is ONLY allowed if:**
- The prompt's GOAL matches NEXT STEP for the ACTIVE STORY (docs/project/NEXT.md), AND
- It is a single tiny step with a testable proof (RED→GREEN or docs-only evidence), AND
- Repo safety gates are satisfied (clean tree, tests pass, build passes), AND
- 3-Party Approval Gate is satisfied (see [alignment-mode.md](protocol/alignment-mode.md) → 3-Party Approval Gate (Canonical))

**docs/project/NEXT.md Freshness Rule:** "Best next step? YES" is only possible when the ACTIVE NEXT STEP is still current. If you just completed it (work shipped per DoD), the next action is closeout/advance docs/project/NEXT.md, NOT new feature work. See [Start-Here-For-AI.md](../../Start-Here-For-AI.md) "docs/project/NEXT.md Freshness Rule" for detection command and enforcement.

**Population Gate Pre-Flight:** Population Gate is verified during the Start-of-Session Doc Audit (after reading docs/project/VISION.md, docs/project/EPICS.md, and docs/project/NEXT.md), not in the Prompt Review Gate. The Doc Audit MUST have been run in this session and returned Population Gate PASS before any coding work. If Doc Audit has not been run or returned FAIL, STOP and run/remediate it first (see [Start-Here-For-AI.md](../../Start-Here-For-AI.md)).

**Doc Audit Sequencing (Session Prerequisite):** Doc Audit is a session-level prerequisite that occurs AFTER Proof-of-Read, never before the Prompt Review Gate. Work prompts in a fresh session must run Doc Audit first as per the ordered sequence in [Start-Here-For-AI.md](../../Start-Here-For-AI.md): Prompt Review Gate → Proof-of-Read → Doc Audit → (if PASS) proceed to work. After each commit, run the rerun-trigger detection command defined in [Start-Here-For-AI.md](../../Start-Here-For-AI.md) to determine if Doc Audit must be rerun.

**Tech Debt Rule:** Any TECH-DEBT prompt and any new tech-debt row MUST include a Story ID (even if it's a "Maintenance/Protocol" story). Put it in the tech-debt row description as: "Story: <ID> — …".

**Alignment Mode (Start-of-Session):**
If `docs/project/NEXT.md` is missing/unclear/outdated OR **Control Deck Population Gate FAIL** (placeholders detected in docs/project/VISION.md, docs/project/EPICS.md, or docs/project/NEXT.md) → STOP coding and enter Alignment Mode. See [alignment-mode.md](protocol/alignment-mode.md) for 3-Party Approval Gate (Canonical), placeholder remediation, and questions to ask Stephen + Copilot before coding. Update `docs/project/*` (VISION/EPICS/NEXT) before any code work.

2. **Proof-of-Read**: Proof-of-Read MUST appear after the Gate and BEFORE any searches or edits (file path + quote of 1-2 complete sentences 10-50 words + "Applying: <rule name>"). Repo sanity commands may run between the Gate and Proof-of-Read.
3. **Single-Block Prompts**: All operator prompts are one fenced code block ending with `# END PROMPT`.
4. **Green Gate**: `npm run test` and `npm run build` MUST pass before any commit.
5. **Stop on Error**: On non-zero exit, stop and propose smallest fix (unless the error is classified as "recoverable once" under Resilience Rules (v7 patch)).
6. **Measure Production First**: If a prompt asserts "production has X / doesn't have Y" or any feature is content-dependent, the FIRST step is to identify the production artifact (generated JSON/db/API), record property chains + counts + one example item, and add/confirm a shape-proof + contract test BEFORE changing behavior. Tests must use real production JSON for content-dependent behavior; avoid invented fixtures.
7. **Terminology Lock**: Terminology caused model drift; lock UI copy to a dictionary; never infer data shape from labels.
8. **Guard Rejection Visibility**: Any canActivate/redirect-to-review must emit a single reason code in dev (console or debug overlay); no console spam in prod; deterministic route behavior remains.
9. **Verification Mode**: Read-only audit prompts must not include edits, tests, builds, or merges. See [verification-mode.md](protocol/verification-mode.md) for allowed commands, forbidden actions, required output format, and STOP boundaries.
10. **Search + Recovery Reporting**: If a prompt performs codebase searching, the report MUST include:
   - "Search method used: rg | git grep | Select-String"
   - "Recovery applied: <none | retry | fallback>"

## Resilience Rules (v7 patch)

These rules reduce false STOPs caused by tooling and environment variability, while preserving strict safety around edits, scope, and canonical docs.

### A) Two-tier Command Lock

- **Lock A (Hard):** No edits, searches, network access, or file writes before the 4-line Gate. Violating Lock A is always STOP.
- **Lock B (Soft):** After the Gate, repo sanity commands are allowed before Proof-of-Read. Violating Lock B is recoverable only if no edits occurred and Recovery Policy (below) is followed.

### B) Search tool fallbacks

Required search order for codebase search:
1) `rg` (if installed)
2) `git grep`
3) PowerShell `Select-String`

Tool absence (e.g., “rg not found”) is NOT an error if you switch to the next approved fallback and record it in the report (“Search method used: …”).

### C) Recoverable error policy

**Recoverable once** (choose ONE recovery path):
- command not found (tooling)
- interrupted command (`^C`)
- transient path mismatch
- missing optional file
- empty search results

**Recovery rule:** Retry once OR switch to the approved fallback once. If it still fails, STOP and give minimal unblock instructions.

**Non-recoverable (always STOP):**
- edits made before the Gate
- failing tests/builds during code prompts (unless the prompt explicitly instructs fixing)
- scope violations
- missing required canonical docs (e.g., `docs/project/NEXT.md`, required handoff/protocol files)

## Copy & Semantics Gate (MANDATORY for UX/copy/narration changes)

Before changing any user-facing copy (coach/tutor text, labels, microcopy, narration, prompts), you MUST write down:

1. **Section Map** (screen structure)
   - List the sections in order as users see them (e.g., Meta line → Prompt → Controls → Coach → Continue).

2. **Semantic Hierarchy**
   - Assign roles / header levels (e.g., H1 page intent, H2 prompt, H3 helper/coach).
   - State what is PRIMARY vs SUPPORTING vs OPTIONAL.

3. **Copy Source Decision**

Choose ONE:
- **TS constant** (only if stable and unlikely to churn)
- **JSON asset dictionary** (preferred when iterating)
- **Content schema** (content/categories/*.json) when copy should be content-owned
- **Admin pipeline** (only when we explicitly scope it)

**Rule**: If copy is likely to iterate, move it OUT of TypeScript first (JSON dictionary minimum) before "voice" tuning.

**Evidence to include in the report**:
- The final Section Map + chosen Copy Source.

## Required Reading (Proof-of-Read List)

Before starting work, read and quote from these files:
- `docs/vibe-coding/protocol/protocol-v7.md` (this file)
- `docs/vibe-coding/protocol/copilot-instructions-v7.md`
- `docs/vibe-coding/protocol/stay-on-track.md`
- `docs/vibe-coding/protocol/working-agreement-v1.md`
- `docs/status/branches.md`
- `docs/testing/test-catalog.md` (required when touching tests)

**Required Reading Integrity Check (MANDATORY):**
If a required-reading document is missing from the repo:
1. STOP — do not claim Proof-of-Read PASS for missing files
2. Choose one of:
   - (A) Create a minimal stub for the missing doc, OR
   - (B) Update the required-reading list to reference a correct/existing doc
3. Document which option was chosen in the report

You may NOT proceed with work while required-reading files are missing.

## Required Reading Sets (by Prompt Type)

### Work Prompts (S0A / S1A / S2A)

Full reading set:
- `docs/vibe-coding/protocol/protocol-v7.md`
- `docs/vibe-coding/protocol/copilot-instructions-v7.md`
- `docs/vibe-coding/protocol/stay-on-track.md`
- `docs/vibe-coding/protocol/working-agreement-v1.md`
- Relevant story doc(s) for the work
- `docs/testing/test-catalog.md` (if tests may be touched)

### Closeout Prompts (S2C merge/closeout)

Minimal reading set (merge-focused):
- `docs/vibe-coding/protocol/protocol-v7.md` (S2C / Merge Checklist section)
- `docs/vibe-coding/templates/closeout-artifact-verification-template.md`
- `docs/status/branches.md`
- `docs/vibe-coding/protocol/stay-on-track.md` (only when scope includes strict guardrails)

**Note**: S2C prompts that include additional work beyond merge should use the full Work Prompt reading set.

## Prompt Structure

~~~markdown
PROMPT-ID: <ID>
## GOAL
## SCOPE GUARDRAILS
## TASKS
# END PROMPT
~~~

## Response Structure

**CRITICAL:** The entire response (from PROMPT-ID through final summary) must be ONE copy-paste ready markdown document. Do NOT fragment output or treat "the report" as separate from "the response."

1. **PROMPT-ID** (mandatory first line): Echo exact PROMPT-ID from the executed prompt. If prompt lacks PROMPT-ID, STOP and request corrected prompt.
2. **Prompt Review Gate** (mandatory, exactly 4 lines, BEFORE any work or Proof-of-Read):
   - What: (1-line summary)
   - Best next step? YES/NO
   - Confidence: HIGH/MEDIUM/LOW
   - Work state: READY|IN-PROGRESS|COMPLETE|MERGED|OBSOLETE
   
   **Command Lock enforcement:** NO commands, edits, or searches are allowed before printing these 4 lines. If Confidence != HIGH, Best next step != YES, or Work state != READY (except merge/closeout requiring COMPLETE), STOP and explain.
3. **Proof-of-Read** (mandatory after the Gate; must appear before any searches or edits; 1-2 complete sentences 10-50 words per file)
4. **Work** (execute tasks only after gate passes; repo sanity commands may run before Proof-of-Read)
5. **Green Gate** (run tests + build)
6. **Summary** (what changed, files touched)

### Session Sequencing Rule (Hard Stop)
- Do not propose or author a new operator prompt until the full Copilot completion report for the current prompt has been pasted and acknowledged in chat.
- If an operator says “wait for Copilot’s report” (or any phrasing that the prior report is still pending), STOP immediately and wait for their confirmation before resuming.

**Report Formatting Rule (STRICTLY ENFORCED):**
- ZERO fenced code blocks anywhere in your response (no ``` markers)
- Use 4-space indentation for command output, code snippets, and examples
- The response IS the report - one continuous markdown document
- Operator must be able to copy the entire response with one selection

## Lint-Suppress Before Lint-Fix (MANDATORY DEFAULT)

**Default action:** When working code triggers a lint warning, **suppress with rationale** rather than "fix" the code.

**Rule:** If a linter (ESLint, TSLint, etc.) complains about intentionally-designed code:
- **DO:** Add `// eslint-disable-next-line <rule> -- <rationale>` immediately above the line
- **DO NOT:** "Fix" the code to satisfy the linter unless you have explicit behavior verification

**Escalation:** Only "fix" (change code to satisfy linter) if the prompt explicitly includes:
1. Behavior contract (what the code does before/after)
2. Verification plan (test or smoke that proves behavior unchanged)
3. Approval for behavioral change in scope

**ESLint Suppression Placement (MANDATORY):**
- `eslint-disable-next-line` must be immediately above the suppressed line (not on same line, not separated by blank lines)
- Must include 1-line rationale after `--`

**Background:** See postmortem `docs/postmortems/2026-01-08-postmortem-lint-cleanup-regression.md` — "fixing" react-hooks/exhaustive-deps warnings broke SignalR multiplayer functionality.

## Hook Dependency Change Gate (MANDATORY)

**Rule:** Any change to React hook dependency arrays (`useEffect`, `useCallback`, `useMemo`) is a **behavioral change**, not a cleanup.

**Rationale:** Dependency arrays control when effects re-run. Adding/removing deps changes execution timing and can introduce race conditions.

**Hook Deps Change Block (REQUIRED for any deps modification):**

    HOOK DEPS CHANGE
    File: <path>
    Hook: <useEffect/useCallback/useMemo> at line <N>
    BEFORE deps: [<list>]
    AFTER deps: [<list>]
    Rationale: <why this change is necessary>
    Behavior contract: <what should happen before and after>
    Verification: <test name or smoke sequence proving behavior preserved>

**STOP condition:** If you cannot complete this block, do not modify the dependency array. Use `eslint-disable-next-line` instead.

## Cleanup Scope Rule (MANDATORY for lint/formatting/hygiene stories)

**Rule:** Cleanup stories may NOT introduce runtime behavior changes.

**Prohibited in cleanup scope:**
- Modifying React hook dependency arrays
- Adding guards/refs that change execution flow
- Changing connection lifecycle or subscription timing
- Altering state update sequences

**If lint can only be satisfied via behavior change:**
1. STOP the cleanup story
2. Split into a separate story with explicit behavior scope
3. New story must include behavior contract + verification (test or smoke)

**Safe cleanup actions:**
- Removing unused imports/variables
- Renaming private identifiers
- Reformatting/indentation
- Adding type annotations
- Suppressing lint warnings with rationale

## SignalR / Multiplayer Hot Files (ALWAYS HOT)

**DealersChoice-specific always-hot files:**
- `frontend/ClientApp/src/hooks/useGameSignalR.js`
- `frontend/ClientApp/src/Pages/Game/Main.js`
- `backend/Repository/GameRepository.cs`

These files coordinate multiplayer state and are ALWAYS treated as hot, regardless of change size.

**Mandatory Multiplayer Smoke Gate:**
Any prompt touching these files MUST include this smoke sequence BEFORE commit:
1. Chrome: Create game, note game code
2. Edge: Join game using code — verify player appears on Chrome table
3. Firefox: Join game using code — verify player appears on Chrome AND Edge tables
4. Edge: Refresh page — verify page reloads, other players still see Edge
5. Chrome: Perform action (ante/bet) — verify all players see updated state

**Timing requirement:** The smoke gate must be executed AFTER the final local build/test gates pass, and BEFORE commit/push.

**STOP condition:** If manual smoke is blocked (environment, time), pivot to automation or diagnostics-only. Do NOT commit untested SignalR changes.

**Smoke Evidence Block (MANDATORY IN COMPLETION REPORT):**

When SignalR Hot Files are modified, the completion report MUST include this exact structure:

    SMOKE EVIDENCE
    SmokeRunId: <YYYY-MM-DD-HHMM local time or unique id>
    Host browser: <Chrome/Edge/Firefox> + version (if known)
    Joiner browsers: <browser1>, <browser2> + versions (if known)
    GameCode: <value>
    Evidence steps:
      1) Host created game → Player count observed: <n> (time)
      2) Joiner #1 joined → Host count: <n>, Joiner#1 count: <n> (time)
      3) Joiner #2 joined → Host count: <n>, Joiner#1 count: <n>, Joiner#2 count: <n> (time)
    Refresh/Rejoin check:
      Which joiner refreshed: <browser>
      After refresh counts: Host=<n>, J1=<n>, J2=<n> (time)
    Action check:
      Action performed: <ante/bet/etc.>
      All clients saw update: YES/NO
    Failures (if any):
      Symptom: <1 sentence>
      Screenshot/log pointer: <path or "none">

**STOP rule (ENFORCED):** If SignalR Hot Files were modified and the Smoke Evidence Block is missing or incomplete, the completion report is INVALID and must be redone before merge.

## Hot File Protocol (General)

Hot files include any of the following:
- Files over ~300 LOC that coordinate routing, state, or persistence
- Known churn magnets (question.component.ts, session.store.ts, app.routes.ts, content.service.ts, scripts/content-build.js, or anything the operator flags as "hot")
- Files touched in the last three prompts (detect via: git log --oneline --follow -3 -- <file>)
- SignalR / Multiplayer hot files listed above (always hot)

When a prompt touches a hot file, you MUST pick one of two paths:
1. **Analysis-first prompt**: map the file’s responsibilities, enumerate entry points, and list all impacted tests before any edits.
2. **Full-file replacement prompt**: replace the entire file in one shot (single edit) and run tests/build in the same prompt.

Piecemeal line edits on hot files are forbidden. If a prompt would require them, STOP and request the operator restructure the work.

## Pre-S2C Sync Check (Mandatory)

Before starting any S2C (merge) prompt, check if your branch is behind main:

~~~powershell
git fetch origin
git log HEAD..origin/main --oneline
~~~

If behind main: run an S2B sync step first (merge origin/main into branch), then `npm run e2e:auto` + `npm run typecheck`.

## S2C / Merge Checklist

Before closing any S2C (merge/closeout) prompt:

- [ ] `npm run e2e:auto` passes
- [ ] `npm run typecheck` passes
- [ ] Verify artifacts exist on main (file presence + key strings)
- [ ] Include Artifact Verification table in completion report

See `docs/vibe-coding/templates/closeout-artifact-verification-template.md`.

## GREEN Means Merge Now (Mandatory)

Any branch that reaches 🟢 GREEN must be merged (S2C) in the same session.

If you cannot merge immediately, add a **PARKED** row to `docs/status/branches.md` including:
- Why parked
- Exact next prompt ID to resume
- Date/time parked

## Enforcement

- Missing Proof-of-Read → STOP
- Confidence < HIGH → STOP and clarify
- Test/build failure → STOP and fix before proceeding
- Missing artifact verification in S2C → incomplete closeout

## Coverage Checklist for cross-cutting work (MANDATORY)

**Objective definition (a change is cross-cutting if ANY of):**
- Touches 2+ routes (count distinct route definitions in app.routes.ts; parameterized variants like q1/:id, q2/:id count separately if separate route configs), OR
- Changes a shared file imported by 3+ components, OR
- Modifies global CSS variables/shared copy dictionaries/typography standards

**Examples (non-exhaustive):**
- Palette CSS variables (--mg-primary, --mg-bg, etc.)
- Voice/tone adjustments (disclaimers, calm language, medical framing)
- Layout grids or spacing systems
- CTA button styles or labels
- Shared UI components (headers, footers, navigation)
- Monospace rendering or typography standards

For ANY cross-cutting change, your completion report MUST include a route coverage table using NYC Explorer routes (source of truth: `apps/web-mvc/Program.cs` and controllers):

   Route               | Status
   --------------------|-------------------------------
   /                   | UPDATED or NO CHANGE REQUIRED (reason)
   /poi/{id}           | UPDATED or NO CHANGE REQUIRED (reason)
   /__view-home         | UPDATED or NO CHANGE REQUIRED (reason)
   /__view-ok           | UPDATED or NO CHANGE REQUIRED (reason)
   /content/poi.v1.json | UPDATED or NO CHANGE REQUIRED (reason)

Status values must be exactly **UPDATED** or **NO CHANGE REQUIRED** with a short justification. Do not invent alternate labels. If you cannot complete this table, STOP and clarify scope.

**Old Pattern Search (MANDATORY STOP CONDITION):**
- Command used: paste the exact search/grep command you ran for the retired pattern.
- Total matches found: include the count and note which files were inspected.
- Remaining occurrences: list intentional exceptions or confirm 0. If you cannot show this search, STOP and request help before editing further.

## UX Proof requirement for user-visible changes (MANDATORY)

For any change affecting what users see (copy, layout, tone, labels, disclaimers, visualizations):

Your completion report MUST include:

**Proof-of-Experience Block (Before / After / Where):**
- What the user sees now: quote the current copy or describe the DOM
- What changed: show Before → After for the exact element(s)
- Routes displaying this change: map to the same coverage list (/ , /select, /q/:id, /review, /result, /store)
- Visual verification: screenshot description or DOM snippet confirming the new state

Without proof-of-experience, UX work is incomplete and prone to regression.

## Bundle warnings policy (STANDARD)

Bundle size warnings are informational during demos but must be resolved or tracked before pre-release:
- Warnings under +1 kB per component: acceptable; note briefly in the report.
- Warnings over +1 kB: document rationale and mitigation plan (ticket link or TODO) before shipping pre-release builds.
- Persistent growth trend (3+ commits): flag for optimization review and propose a fix path.

**Pre-release definition:** Any tagged release candidate (vX.X.X-rc1 or later). Demo branches and dev commits exempt. Bundle warnings do NOT block Green Gate by themselves, but you must either fix or track them before tagging a release candidate.

## Prompt Authoring — Test-Touch Rule

Any prompt that may touch `*.spec.ts` MUST include the Test-Touch Block from:
`docs/vibe-coding/templates/test-touch-block-template.md`
