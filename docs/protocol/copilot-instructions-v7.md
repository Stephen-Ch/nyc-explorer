# Copilot Instructions (v7 Hybrid)

> **Goal:** Keep AI edits safe, small, and green. Enforces prompt-only, tiny-step TDD with zero guessing.

## Read Order (each prompt)
1. `docs/protocol/protocol-v7.md`
2. `docs/protocol/copilot-instructions-v7.md`
3. `docs/project/ai-project-status.md` (Architecture & Hot Files)
4. `docs/project/selectors.md` (if UI)
5. `docs/code-review.md` (Read last 3 entries)

---

## 1. Boot Prompt (Start of Session)
> Run this verification ONCE at the start of a session to prevent environment drift.

**Agent Action:**
1. Verify CWD is the repo root.
2. Print `node -v`, `npm -v`.
3. Check for a `SNAPSHOT` block in the user's last message.
   - If absent/stale → Run **Repo Snapshot Macro** (see below).

---

## 2. Prompt Schema (Your Response Structure)

Every reply MUST surface these headers before executing code:

1.  **READ**: Explicit list of files reviewed.
2.  **GOAL**: Single-sentence objective in user's words.
3.  **BEHAVIOR**: 3–6 Given/When/Then scenarios (include edge + error).
4.  **CONSTRAINTS**: File/LOC limits (≤2 files, ≤60 LOC).
5.  **DRIFT RADAR**: specific risks (Schema, Selectors, Env, Hot Files).
6.  **PLAN**: Numbered steps. **Execute Step 1 only**.

**Hard Rule:** If you cannot fill any header (e.g., unclear goal), **STOP** and issue an **Ambiguity Card**.

---

## 3. Q-GATE (Clarification Thresholds)
Ask clarifying questions **ONLY** if the answer improves success probability by:
*   **≥10%** (Default)
*   **≥5%** (High-risk: Adapters, Schema, Data, Auth)
*   **Never** (Trivial docs/UI tweaks)

**Format:** `Q-GATE: [Question]? If confirmed, I will [Action].`

---

## 4. Guardrails & Rules

### A. Analysis-First for "Hot Files"
Before editing any "Hot File" listed in `docs/project/ai-project-status.md`:
1.  **STOP**.
2.  Run an **Analysis-Only Prompt**. Read the file, trace the flow, and describe the current behavior.
3.  Only *then* propose changes in the next prompt.

### B. Tests-First
1.  **RED**: Write a failing test that proves the missing feature or bug.
2.  **Wait**: Ask for permission to implement.
3.  **GREEN**: Make the minimal code change to pass.

### C. Selectors & Schema Freeze
*   Do not invent new selectors or schema keys without explicit authorization.
*   If a selector is missing, update `docs/project/selectors.md` FIRST.

### D. Loop Stop Rule
*   If a fix fails **twice** with the same error → **STOP**.
*   Emit a **BLOCKER CARD** (Summary, Failing Spec, Hypothesis, Next Exp).

---

## 5. Macros

### REPO SNAPSHOT MACRO
Run this if the session is stale or starting fresh.
```text
SNAPSHOT:
- tree: <dirs/files touched>
- branch: <name> @ <sha> (<clean|dirty>)
- tests: passed=<n>; skipped=<ids>
- runtimes: <command>=<seconds>, ...
- selectors: v<major.minor> (last bump=<date>)
- env: <key>=<value>, ...
```
