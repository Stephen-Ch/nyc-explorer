# Session-Start — 10-24-25

**Purpose**  
Start-of-day ritual to align context and kick off the first task.

---

## Checklist
- Open and skim `/docs/Protocol_10-24-25.md` (top sections) — 60 sec
- Confirm the **Sprint Goal** and pick a **Story ID**
- Copy the last **3 lines** from `/docs/code-review.md`
- Ensure local tests run
- Prepare a minimal prompt using the **Prompt Skeleton** from Copilot-Instructions

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
