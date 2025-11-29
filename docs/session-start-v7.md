# Session Card (Operator Cheat Sheet v7)

> Keep this pinned. It defines HOW you drive the agent.

## 1. Session Boot (Start of Day)
Paste this into the first prompt:

```markdown
Use repo rules (v7). Echo CWD/Versions.
I will run many prompts. For each, I will:
- Provide a Prompt-ID (P-XXX).
- Require you to read `docs/code-review.md`.
- Apply step 1 only (Red/Green loop).

Verify your environment now.
```

---

## 2. Kickoff Message (New Task)
When starting a new Story or Task, use this template:

```text
CONFIRM: GREEN — <story-id>
Goal: <one-line objective>
Decisions (last 3):
<paste from code-review.md>

Planned Behavior:
- Given <context>
- When <action>
- Then <result>
- (Edge) <condition>

Constraints: ≤2 files, ≤60 LOC, Tests-First.
Hot Files involved: <none|list>
```

---

## 3. Per-Prompt (The Loop)
Before every follow-up action:

```text
Prompt: P-XXX <step name>
Read: docs/code-review.md
Plan: <next tiny step>
Execute: Step 1 only.
```

---

## 4. Manual Smoke Checklist
*Run these manually before closing a Feature Branch.*

*   [ ] **Unit Tests:** `npm run test` is Green.
*   [ ] **Build:** `npm run build` succeeds.
*   [ ] **Linter:** No new lint errors.
*   [ ] **Critical Path:** (See `ai-project-status.md`)
