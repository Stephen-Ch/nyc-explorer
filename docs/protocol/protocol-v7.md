# Workflow Protocol (v7)

## 1. Branching Strategy
*   **Feature Branches:** `feat/<id><short-desc>`
*   **Fix Branches:** `fix/<id><short-desc>`
*   **Chore Branches:** `chore/<desc>`

## 2. The TDD Loop
1.  **RED**: Write the failing test.
    *   *Agent stops and reports failure.*
2.  **GREEN**: Implement minimal code to pass.
    *   *Agent stops and reports success.*
3.  **REFACTOR**: Clean up code if needed (≤60 LOC).
4.  **COMMIT (Code)**: `feat: <summary> (#tests=N, green=true)`

## 3. The Documentation Loop (Dual Commit)
*After code is Green and Committed:*
1.  **LOG**: Append entry to `docs/code-review.md`.
    *   Format: `[YYYY-MM-DD] <BRANCH> <ID> — <Summary> (#tests=N, green=Y)`
2.  **UPDATE**: Update `docs/project/ai-project-status.md` if Hot Files or Architecture changed.
3.  **COMMIT (Docs)**: `docs: update decisions/status`

## 4. Stop Rules
*   **Double Failure:** If the same test fails twice with the same error, STOP.
*   **Blind Editing:** If the agent proposes editing a "Hot File" without analysis, STOP.
*   **Selector Drift:** If the agent edits a selector without updating `docs/project/selectors.md`, STOP.

## 5. Quarantine Policy
*   If a test is flaky/blocking:
    1.  Tag it with `// QUARANTINE: <Reason> (TTL: 48h)`
    2.  Skip it in the suite.
    3.  Log it in `code-review.md`.
    4.  Must resolve within 48h or escalate.
