# Code-Review-Guide — 10-24-25

**Purpose**  
Reviewer-facing checklist. Keep this lean. All gating and read-order rules live in `/docs/Protocol_10-24-25.md`.

---

## Review Objectives
- Verify the **Behavior Contract** is present and accurate (happy path + edge + error).
- Ensure **tests exist and are GREEN**; skim failing spec titles in CI if red.
- Confirm the **Decisions line** is appended to `/docs/code-review.md` in the **new format**.
- Check changes **match the story’s AC and Sprint Goal**; flag scope creep.
- Confirm **Constraints** were respected (≤2 files / ≤60 LOC unless refactor story).
- Sanity-check **UX/strings/accessibility** for regressions.
- Confirm **artifacts** (screenshots, output paths) were attached when requested.

---

## Decisions Line (enforced format)
```
[YYYY-MM-DD HH:MM] <REPO>/<BRANCH> <STORY-ID> — <~12 words on what changed> (#tests=<N>, green=<true|false>)
```

**Example**
```
[2025-10-24 11:02] rawls-game/feat/route ROUTE-7 — add review route + e2e (#tests=5, green=true)
```

---

## PR Readiness Checklist (Reviewer)
- [ ] Behavior Contract covers **happy + edge + error** and matches diff
- [ ] Tests are **GREEN** in CI
- [ ] Decisions line appended to `/docs/code-review.md` (correct format)
- [ ] No unrelated files edited; diff aligned to story
- [ ] Artifacts included (if requested)
- [ ] Security / PII / secrets scan ok
- [ ] Approve or request **REVISE** with concrete items

---

## Anti‑Patterns to Flag
- Missing or vague Behavior Contract
- Tests added but not asserting the behavior described
- Large, multi-file diffs without a refactor story
- Schema edits without version/tag + validation
- Unexplained selector changes (no Probe-First evidence)

**End**
