# Session Start Checklist

> **Purpose:** Single-page checklist to reduce "too many places to check" friction.  
> **Usage:** Run through this before starting any work session.  
> **Quick Reference:** See [protocol-lite.md](protocol-lite.md) for core rules summary.

---

## Pre-Flight Checks (< 2 minutes)

- [ ] **RUN START OF SESSION DOCS AUDIT** — This single command chains: kit update (subtree pull) → kit version print → forGPT sync → Consumer doc-audit (hard fail) → audit print. Run it first; everything below is verified automatically (including overlay structure and required files).
- [ ] **Goal Anchor** — Write North Star, Current Slice, and Proof before any work.
- [ ] **NEXT.md Status** — Open [NEXT.md](../project/NEXT.md). Confirm Status = ACTIVE or PAUSED with clear Next Step.

### Informational (review if relevant, do not block on these)

- [ ] **Open PRs** — Run `gh pr list --state open` or check GitHub. Note any blocking dependencies.
- [ ] **Blockers** — Check [tech-debt-and-future-work.md](../project/tech-debt-and-future-work.md) for known blockers.

> **Note:** Branch hygiene, research indexing, and orphan-branch cleanup are
> **end-of-session** concerns handled by `run-vibe -Tool end-session`.
> They do not need to block session start.

---

## If Any Check Fails

| Check | Action |
|-------|--------|
| NEXT.md unclear | Update NEXT.md before proceeding |
| PRs blocking | Note in prompt; consider docs-only work |

---

## End of Session

- [ ] **RUN END OF SESSION** -- Run `run-vibe -Tool end-session` to check repo hygiene (path-independent; no hardcoded DOCS_ROOT needed).
- [ ] If tracked changes reported: commit or stash before closing.
- [ ] If non-merged branches listed: open PRs or clean up per repo policy.
- [ ] Optionally: add `-WriteReport` to save a status snapshot under `<DOCS_ROOT>/status/`.

---

## Quick Links

| Doc | Purpose |
|-----|---------|
| [protocol-lite.md](protocol-lite.md) | Quick reference (start here) |
| [NEXT.md](../project/NEXT.md) | **Active story + next step (live work-state authority)** |
| [protocol-v7.md](protocol/protocol-v7.md) | Full protocol rules |
| [PROTOCOL-INDEX.md](protocol/PROTOCOL-INDEX.md) | Navigate protocol-v7 by task |
| [PAUSE.md](PAUSE.md) | End-of-session handoff (not needed during active work) |
| [critical-transition-checklist.md](critical-transition-checklist.md) | Preflight for critical transitions only (subtree updates, broad staging, handoffs) — **not part of per-prompt flow** |
| [branches.md](../status/branches.md) | Branch/PR tracking |
| [tech-debt-and-future-work.md](../project/tech-debt-and-future-work.md) | Known issues |
