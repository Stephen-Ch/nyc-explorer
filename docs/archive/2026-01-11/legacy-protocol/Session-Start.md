# Session-Start — 10-24-25

**Purpose**  
Start-of-day ritual to align context and kick off the first task.

---

## Checklist
- Open and skim the latest guardrail set: `docs/Protocol.md`, `docs/Workflow-Tweaks-S6.md`, `docs/postmortems/overlay-2025-11-09.md`, `docs/recovery/overlay-recovery-plan.md` — 2 min max
- Confirm the **Sprint Goal** and pick a **Story ID**
- If the slice is high risk, create/update a plan using `docs/templates/high-risk-plan.md` and note its path (e.g., `docs/plans/<story>.md`)
- Copy the last **3 lines** from `/docs/code-review.md`
- Copy the last **2 micro-entries** from `/docs/project-history.md`
- Ensure local tests run (or confirm last baseline run)
- Prepare a minimal prompt using the **Prompt Skeleton** from Copilot-Instructions, including guardrail status (plan link, baseline checks, overlay freeze) and a header like `Prompt 1/3 — elapsed 0m`

---

## Kickoff Message (Developer → Assistant)
```
CONFIRM: GREEN — <STORY-ID>
Sprint Goal: <paste>
Decisions (last 3):
<line>
<line>
<line>
Planned Behavior (3–6 Given/When/Then, includes edge + error):
- Given ...
- When ...
- Then ...
- (edge) Given ...
- (error) Given ...
Constraints: ≤2 files, ≤60 LOC; tests-first; no unrelated edits
Artifacts: <screens/paths if needed>
```
(If blocked, use `BLOCK: <reason>` and propose the next action.)

---

## Expected Assistant Reply
- **PROCEED** — tests GREEN • Decisions appended • AC met • evidence/paths included
- **REVISE** — list concrete issues tied to AC or rules
- **BLOCK** — name dependency and propose unblocking step

**End**
