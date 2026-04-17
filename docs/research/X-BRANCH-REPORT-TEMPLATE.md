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
| Execution mode | Cloud agent / remote PR workflow |
| Remote branch | `agent/spike-<topic>` |
| PR | #_number_ |
| Local spike implementation used | NO — cloud-agent-only |

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

> **Minimum standard:** This section must contain at least one concrete item. If nothing remains unproven, the spike question was likely too narrow or the evidence is being overstated — revisit and strengthen.

## Suggested Next Action

Based on the verdict, state the recommended next step:
- **A:** Draft R-### research doc on main capturing the learning.
- **B:** Rewrite the named test/fixture on main via a separate tiny main-branch story.
- **C:** Write a story proposal for NEXT.md.
- **D:** Close PR, archive or delete the branch.

---

## TDD Waiver

If the spike did **not** follow RED → GREEN → VERIFY, this section is **required**.

| Field | Value |
|-------|-------|
| TDD followed? | YES / NO |
| Waiver justification | _One sentence explaining why TDD was not feasible (e.g., "Pure config exploration with no testable code path")._ |

If TDD was followed, write "TDD followed — no waiver needed" and leave the justification blank.

---

## Promotion Packet

Complete this section when proposing a verdict of A, B, or C. For verdict D, write "No promotion — verdict D."

| Field | Value |
|-------|-------|
| Proposed R-### path | `docs/research/R-###-<topic>.md` |
| Proposed ResearchIndex row | _Follow the repo's current ResearchIndex.md column format (see docs/research/ResearchIndex.md for the active schema)._ |
| Proposed verdict | A / B / C |
| Named test/fixture for promotion (B only) | _Test name and file, or N/A_ |
| Code promotion | **NO** — code is never promoted from x-branches |

---

## Hostile Scrutiny Gate

Copilot drafts the answers below as part of the spike report. The gate is **not self-certified**: ChatGPT reviews the answers adversarially, and the report is not accepted until Stephen approves the outcome.

Answer each question YES or NO. All 7 must be YES for the report to be accepted (question 7 applies only when a TDD waiver is present; answer YES if TDD was followed).

| # | Question | Answer |
|---|----------|--------|
| 1 | **Question integrity** — Was the spike question well-formed, narrow, and answerable in a single spike? | YES / NO |
| 2 | **Evidence** — Is the evidence (gate results, code behavior, failure logs) sufficient to support the verdict? | YES / NO |
| 3 | **Constraint compliance** — Were all x-branch constraints followed (no main merge, fixture-backed tests, no docs/project/* edits, no quarantine removal)? | YES / NO |
| 4 | **Execution mode** — Was the spike performed by the cloud agent on a remote branch with no local spike implementation? | YES / NO |
| 5 | **Learning quality** — Is the key learning clearly articulated and actionable? | YES / NO |
| 6 | **Promotion decision** — Is the A/B/C/D verdict justified by the evidence above? | YES / NO |
| 7 | **TDD waiver legitimacy** — If a TDD waiver was claimed, is the justification genuine and is the alternate evidence sufficient to compensate for the absence of RED → GREEN → VERIFY? (Answer YES if TDD was followed.) | YES / NO |

**Verdict options:**

| Code | Meaning |
|------|---------|
| **A** | Adopt learning only |
| **B** | Adopt learning + named test/fixture |
| **C** | Create real story |
| **D** | Reject / archive |
