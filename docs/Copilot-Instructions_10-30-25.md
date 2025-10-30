# Copilot-Instructions — 10-30-25

> **Keep this short.** This file sets hard guardrails to prevent guessing and scope creep. Full rules live in `/docs/Project.md` and `/docs/Code-Review-Guide.md`. Read those first.

---

## Read Order (every prompt)
1) `/docs/Project.md`
2) `/docs/Code-Review-Guide.md`
3) `/docs/code-review.md` (last 3 lines)
4) <story file>, <test file> (if present)

---

## Prompt Skeleton (strict order)
1) **Title**: `P<NN> — <STORY-ID + slice>`
2) **READ**: list paths above
3) **STORY + GOAL**: one-sentence scope for this slice
4) **BEHAVIOR**: 3–6 Given/When/Then (must include **edge + error**)
5) **CONSTRAINTS**: ≤2 files, ≤60 LOC; **Manhattan-only**, **Union Square + Flatiron**; **≤3 POIs/block**
6) **ARTIFACTS**: screenshot/log paths (e.g., `docs/artifacts/<ID>/P<NN>/`)
7) **AFTER-GREEN**: append Decisions line; reply **PROCEED/REVISE/BLOCK**

---

## Hard Guardrails (no exceptions)
- **No‑Guessing Contract:** If anything is unclear, return an **Ambiguity Card** and **BLOCK**. Do not write code.
- **Allowed‑Edits Fence:** Only touch files explicitly named in the prompt; **≤ 2 files / ≤ 60 LOC** (unless the story is tagged *refactor*).
- **Tests‑First Gate:** First response is a failing, explicit test/spec only. Await “OK, implement.”
- **Assumptions Table = empty:** If you list any assumption, outcome must be **BLOCK**.
- **Schema/Selector Freeze:** Do not change schema keys, routes, or selectors unless a separate story authorizes it.
- **Diff Preview Before Commit:** Show a **unified diff** and wait for “APPLY” before committing.
- **Decisions Log Binding:** After GREEN, append one line to `/docs/code-review.md` and echo it.

### Ambiguity Card (template)
```
Ambiguity Card — P<NN>
Questions:
- Q1 …
- Q2 …
Intended approach if approved (summary only):
- …
Files to touch (≤2) + approx LOC (≤60):
- …
Risk notes:
- …
Outcome: BLOCK (awaiting answers)
```

### Probe‑First (when routes/selectors unknown)
- Explore minimal candidate routes (e.g., `/`, `/Home`, `/Map`), collect screenshots + final URLs under `docs/artifacts/probe/`.
- Do **not** build helpers/components until selectors/ids are confirmed by tests.

### Outcomes
- **PROCEED** – ready to merge when GREEN + Decisions appended.
- **REVISE** – failing spec or constraint breach; include failing title + error.
- **BLOCK** – ambiguity, assumptions present, or scope exceeds fence.

**End**
