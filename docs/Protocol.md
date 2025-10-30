# Protocol — UPDATED for Sprint 02 (v2)

**Keep:** prompt-only, tiny steps, TDD; ≤2 files / ≤60 LOC; Decisions log; Ambiguity Cards; Pause rule.

## Process Flow (each slice)
1) **RED** — write failing spec with clear messages (edge + error).  
2) **GREEN** — minimal change to pass.  
3) **LOG** — append one line to `/docs/code-review.md`.  
4) **PAUSE** — stop until user cue.

## When ≤60 LOC isn’t enough
- **BLOCK** with an Ambiguity Card that proposes:
  - **SPLIT**: break into two smaller slices (e.g., `MAP-2a`, `MAP-2b`), *or*
  - **REFACTOR**: a tiny `REFAC-*` story (≤60 LOC) to extract helpers, then return.
- Never bypass the constraint in the same prompt.

## Testing Standards
- Prefer Playwright `expect` assertions over manual throws.
- Fix viewport (e.g., 1280×800) for UI tests that depend on layout.
- Use built-in waiting (`expect(locator).toBeVisible()`) rather than sleeps.
- **Artifacts**: optional visual smoke — store **one** PNG per UI story at `docs/artifacts/<STORY-ID>/P<NN>-map.png`, ≤500KB.

## Server Lifecycle (Sprint‑02 target)
- Configure Playwright `webServer` to auto‑start/stop the ASP.NET app on port **5000**; block until ready. (Add as a Sprint‑02 story.)

## Types & Schema
- Zod remains the source of truth. For TS usage, derive or mirror **types** to prevent property mismatches.
- Any schema change requires a **new story** (no silent edits).

## Selectors Contract
- Canonical selectors live in `/docs/selectors.md`. Do not invent new ones without a story.

## Commit Policy
- One commit per prompt, message: `STORY — <12 words> (#tests=<N>, green=<true|false>)`.

## Execution Loop (Sprint 03)
RED → GREEN → VERIFY (full suite + typecheck) → COMMIT (one story = one commit) → LOG (Decisions + Project-History) → PAUSE.

### LOC Overflow Rule
- If estimate >50 LOC → split before starting.
- If during work you exceed 60 LOC or 2 files → REVISE or SPLIT and stop.

**End.**
