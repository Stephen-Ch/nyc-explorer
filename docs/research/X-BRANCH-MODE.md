# X-Branch Spike Mode — NYC Explorer

This document describes an optional spike workflow for NYC Explorer. It is a local pilot — not a kit-required process, not a replacement for normal story execution, and not part of session-start, doc-audit, or the required reading order.

## Purpose

X-branch mode lets the team explore risky technical questions in disposable branches without disrupting main-line development. Spikes generate evidence and learning, not mergeable code.

## Non-Negotiable Rules

1. X-branches **never merge** to main.
2. Main keeps the learning, not the branch.
3. This mode is **optional** — it does not affect session-start, doc-audit, startup reading, normal VISION/EPICS/NEXT flow, or any kit-required workflow.
4. X-branch work does not modify `docs/project/*`.
5. X-branch work does not remove quarantine skips.

## When to Use X-Branch Mode

- A technical question has high uncertainty and the answer affects architectural direction.
- The spike would produce throwaway code that should not land on main even temporarily.
- The team wants to test a hypothesis (e.g., "Can adapter X handle payload Y without regressions?") with real gate evidence before committing to a story.
- The question is narrow enough to answer in a single focused spike.

Do **not** use x-branch mode for normal story execution, docs-only work, or anything that belongs on main.

## Roles

| Role | Responsibility |
|------|----------------|
| **Copilot** | Creates the x-branch, initiates the agent, runs the spike, runs gates, drafts the spike report (including hostile scrutiny answers), opens/updates the PR. Copilot is the experiment executor — it does not make adoption decisions. |
| **ChatGPT** | Writes the spike prompt, performs hostile scrutiny review of the report, and recommends an adoption verdict (A/B/C/D). ChatGPT does not make the final decision. |
| **Stephen** | Keeps working on main in parallel. Reviews the PR as a review envelope. Makes the final adoption decision (A/B/C/D) and approves or rejects promotion of learning back to main. |

## Branch and PR Model

- Branch naming: `agent/spike-<topic>`
- One question per spike, one branch per spike.
- The PR is a **review envelope**, not a merge path. It exists so Stephen can review the spike evidence, gate results, and report in GitHub's PR UI.
- PRs from x-branches are closed without merging.

## Completion Signal

A spike is complete when:
1. The spike question has a clear answer (proven, disproven, or inconclusive).
2. Gates (`npm run typecheck`, `npm run e2e:auto`) have been run and results recorded.
3. A spike report (see X-BRANCH-REPORT-TEMPLATE.md) has been drafted.
4. The PR has been opened or updated with the report.

## Required X-Branch Constraints

- All new tests must be fixture-backed (no live API calls in CI).
- Use `data-testid` selectors in any new UI tests.
- Do not modify `docs/project/*` (VISION, EPICS, NEXT).
- Do not remove or weaken quarantine skips.
- Do not edit kit docs or manifests.

## What May Come Back to Main

Only these artifacts may be promoted from an x-branch spike:

| Artifact | Promotion path |
|----------|---------------|
| Learning / insight | Captured in a `docs/research/R-###` doc on main |
| Named test or fixture | Rewritten on main (or deliberately promoted via a separate tiny main-branch story) |
| Story proposal | Written into NEXT.md on main through normal story selection |
| Code | **Never** — code is rewritten on main if the spike proves the approach viable |

## Adoption Outcomes

| Verdict | Meaning |
|---------|---------|
| **A — Adopt learning only** | The insight is captured in a research doc on main. No code or tests promoted. |
| **B — Adopt learning + named test/fixture** | Learning captured, plus a specific test or fixture is rewritten on main via a separate tiny main-branch story. |
| **C — Create real story** | The spike proves the approach viable. A real story is written into NEXT.md for proper implementation on main. |
| **D — Reject / archive** | The spike is inconclusive or the approach is not viable. PR is closed, branch is archived or deleted. |

## Hostile Scrutiny Rule

Every spike report must pass a hostile scrutiny gate before an adoption decision is made. Copilot drafts the hostile scrutiny answers as part of the spike report, but the gate is not self-certified. ChatGPT reviews the answers adversarially, and the report is not accepted until Stephen approves the outcome.

The gate asks:

1. Was the spike question well-formed and narrow?
2. Is the evidence sufficient to support the verdict?
3. Were all x-branch constraints followed?
4. Is the learning clearly articulated and actionable?
5. Is the promotion decision (A/B/C/D) justified by the evidence?

If any answer is NO, the report must be revised before adoption. If ChatGPT and Stephen disagree on any answer, Stephen's judgment is final.

## Promotion Rules for Tests and Fixtures

- Tests promoted from a spike must be fixture-backed and pass on main without the spike branch.
- Fixtures must not embed secrets, live API keys, or ephemeral data.
- Promoted tests are rewritten on main via a separate tiny main-branch story, not via merge or cherry-pick from the spike branch.

## Canonical Research Location

Spike learnings that are promoted to main use the standard `docs/research/R-###` format and are indexed in `docs/research/ResearchIndex.md` — the same canonical location used for all NYC Explorer research.

## Operating Principle

Spike branches generate evidence, not mergeable code. Main keeps the learning, not the branch.
