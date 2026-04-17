# X-Branch Spike Report Template

Use this template for every x-branch spike report in NYC Explorer. Copy into the PR description or into a standalone markdown file in the spike branch.

---

## Spike Report

| Field | Value |
|-------|-------|
| Date | YYYY-MM-DD |
| Branch | `agent/spike-<topic>` |
| Spike question | _One clear question this spike set out to answer._ |
| Verdict | A / B / C / D |

## What Was Attempted

Describe the approach taken during the spike. Include the hypothesis tested and the implementation strategy.

## What Broke

List any failures, regressions, or unexpected behaviors encountered. If nothing broke, state that explicitly.

## Gate Results

| Gate | Result | Detail |
|------|--------|--------|
| `npm run typecheck` | PASS / FAIL | Error count or 0 errors |
| `npm run e2e:auto` | PASS / FAIL | X passed, Y skipped, Z failed |

## Key Learning

Summarize the primary insight gained. This is the artifact that may be promoted to main regardless of verdict.

## What Remains Unproven

List any follow-up questions the spike did not answer, edge cases not tested, or assumptions still unvalidated.

## Suggested Next Action

Based on the verdict, state the recommended next step:
- **A:** Draft R-### research doc on main capturing the learning.
- **B:** Cherry-pick or rewrite the named test/fixture on main in a real story.
- **C:** Write a story proposal for NEXT.md.
- **D:** Close PR, archive or delete the branch.

---

## Hostile Scrutiny Gate

Answer each question YES or NO. All must be YES for the report to be accepted.

| # | Question | Answer |
|---|----------|--------|
| 1 | **Question integrity** — Was the spike question well-formed, narrow, and answerable in a single spike? | YES / NO |
| 2 | **Evidence** — Is the evidence (gate results, code behavior, failure logs) sufficient to support the verdict? | YES / NO |
| 3 | **Constraint compliance** — Were all x-branch constraints followed (no main merge, fixture-backed tests, no docs/project/* edits, no quarantine removal)? | YES / NO |
| 4 | **Learning quality** — Is the key learning clearly articulated and actionable? | YES / NO |
| 5 | **Promotion decision** — Is the A/B/C/D verdict justified by the evidence above? | YES / NO |

**Verdict options:**

| Code | Meaning |
|------|---------|
| **A** | Adopt learning only |
| **B** | Adopt learning + named test/fixture |
| **C** | Create real story |
| **D** | Reject / archive |
