# High-Risk Slice Plan Template

Use this template before touching Program.cs, overlay scripts, provider wiring, or any slice flagged as high risk. Store the filled plan in `docs/plans/<story-id>-<short-name>.md` and link to it in the first prompt and PR description.

## Slice Summary
- **Story / Slice ID:**
- **Goal (≤2 sentences):**
- **Allowed files & LOC ceiling:**
- **Guardrails in play:** overlay freeze | prompt/time caps | environment reset | other (list)

## Current Baseline
- **Worktree & SHA:**
- **Last full Playwright run:** date/time + command
- **Last `npm run typecheck`:** date/time + command
- **Additional verification (if any):**

## Plan of Attack
1. Step-by-step checklist (≤5 steps, each ≤60 LOC impact)
2. Targeted tests per step (spec names)
3. Expected prompts (estimate count)

## Rollback & Abort Criteria
- Signals to declare BREAKDOWN immediately
- Files/commands to revert on abort

## Evidence to Capture
- Logs, DOM snapshots, traces, etc., needed to prove the slice is safe

## Review Aids
- Related docs to re-read (selectors, adapters, postmortems)
- Stakeholders to notify / reviewers to tag
