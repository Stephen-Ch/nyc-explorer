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
6. Spike implementation is **cloud-agent-only** — no local spike implementation in the VS Code workspace.
7. There is **no local fallback**. If the GitHub cloud coding agent is unavailable, the spike must STOP.
8. Copilot (local) does **not** make helpful follow-up edits to x-branch code. Dispatch ends at PR creation; all implementation belongs to the cloud agent.
9. **TDD by default.** Spike implementations follow RED → GREEN → VERIFY. If a spike cannot follow TDD (e.g., pure config exploration), the report must include a TDD waiver with a one-sentence justification.

## When to Use X-Branch Mode

- A technical question has high uncertainty and the answer affects architectural direction.
- The spike would produce throwaway code that should not land on main even temporarily.
- The team wants to test a hypothesis (e.g., "Can adapter X handle payload Y without regressions?") with real gate evidence before committing to a story.
- The question is narrow enough to answer in a single focused spike.

Do **not** use x-branch mode for normal story execution, docs-only work, or anything that belongs on main.

## Execution Model

X-branch spikes use a **cloud-agent-only, remote branch/PR workflow**:

- Copilot in VS Code may **dispatch** the spike task (create the remote branch, launch the cloud agent, open the PR).
- The **GitHub cloud coding agent** performs the actual spike implementation on the remote branch.
- The local VS Code workspace is **not** used for spike implementation. No local spike code, no local test runs on the x-branch, no local commits to the x-branch.
- The x-branch is a **remote branch** used exclusively by the cloud agent.
- The PR is a **remote review envelope**.
- A spike is not considered started until the remote x-branch and PR exist.
- If cloud agent launch is unavailable, **STOP** — there is no local fallback.

### Dispatch Boundary

Copilot's dispatch responsibility **ends** when the PR is created and the cloud agent is launched. Specifically, Copilot does **not**:
- Make "helpful" local edits to spike code after dispatch.
- Run spike tests locally as a convenience.
- Commit to the x-branch from the local workspace.
- Offer to finish the spike locally if the cloud agent is slow or unavailable.

## Roles

| Role | Responsibility |
|------|----------------|
| **Copilot (local VS Code)** | Dispatches the spike: creates the remote branch, launches the GitHub cloud coding agent, opens the PR. Copilot does not perform spike implementation locally — it is the orchestrator, not the executor. It does not make adoption decisions. |
| **GitHub cloud coding agent** | Performs the spike implementation on the remote x-branch: writes code, runs gates, drafts the spike report (including hostile scrutiny answers), and updates the PR. |
| **ChatGPT** | Writes the spike prompt, performs hostile scrutiny review of the report, and recommends an adoption verdict (A/B/C/D). ChatGPT does not make the final decision. |
| **Stephen** | Keeps working on main in parallel. Reviews the PR as a review envelope. Makes the final adoption decision (A/B/C/D) and approves or rejects promotion of learning back to main. |

## Authority

- Copilot **proposes** (dispatch, report drafts, promotion packets).
- ChatGPT **recommends** (hostile scrutiny, verdict opinion).
- Stephen alone **approves** (adoption verdict, promotion to main, merge/close decisions).

No AI agent may self-approve an adoption verdict or promote artifacts to main without Stephen's explicit approval.

## Branch and PR Model

- Branch naming: `agent/spike-<topic>`
- One question per spike, one branch per spike.
- The branch is a **remote branch** created and used by the GitHub cloud coding agent. It is not checked out locally.
- The PR is a **remote review envelope**, not a merge path. It exists so Stephen can review the spike evidence, gate results, and report in GitHub's PR UI.
- PRs from x-branches are closed without merging.
- No local spike implementation is permitted. If evidence of local spike execution is found, the spike must be re-evaluated.

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
4. Was the spike performed by the cloud agent on a remote branch with no local spike implementation?
5. Is the learning clearly articulated and actionable?
6. Is the promotion decision (A/B/C/D) justified by the evidence?

All 6 must be YES. If any answer is NO, the report must be revised before adoption. If ChatGPT and Stephen disagree on any answer, Stephen's judgment is final.

## Promotion Rules for Tests and Fixtures

- Tests promoted from a spike must be fixture-backed and pass on main without the spike branch.
- Fixtures must not embed secrets, live API keys, or ephemeral data.
- Promoted tests are rewritten on main via a separate tiny main-branch story, not via merge or cherry-pick from the spike branch.

## Provisional vs. Canonical Research

Spike reports produced on x-branches are **provisional evidence** — they live in the PR and on the disposable branch. They are not canonical research until promoted.

A spike report becomes **canonical** only when:
1. The hostile scrutiny gate passes (ChatGPT + Stephen).
2. Stephen approves an adoption verdict (A, B, or C).
3. The learning is captured in a new `docs/research/R-###` doc written fresh on main (not copied or cherry-picked from the branch).
4. The R-### doc is indexed in `docs/research/ResearchIndex.md`.

Reports with verdict D (Reject/archive) remain provisional. They may be referenced for historical context but are not promoted to the canonical research set.

## Post-Spike Promotion Flow

When a spike completes and Stephen approves a verdict of A, B, or C, promotion follows these steps:

1. **Draft promotion packet.** The spike report's Promotion Packet section (see X-BRANCH-REPORT-TEMPLATE.md) proposes the R-### path, ResearchIndex row, verdict, and named test/fixture (if B).
2. **Stephen reviews** the promotion packet and approves or requests changes.
3. **Write R-### doc on main.** The learning is written fresh on main using the canonical `docs/research/R-###` format — not copied from the spike branch.
4. **Index on main.** The R-### doc is indexed in `docs/research/ResearchIndex.md` in the same commit.
5. **Close PR.** The x-branch PR is closed without merging.
6. **Delete branch** (optional). The remote x-branch may be deleted or left for historical reference.

Code is **never** promoted via this flow. If verdict C creates a story, the story reimplements from scratch on main.

## Canonical Research Location

Spike learnings that are promoted to main use the standard `docs/research/R-###` format and are indexed in `docs/research/ResearchIndex.md` — the same canonical location used for all NYC Explorer research.

## Operating Principle

Spike branches generate evidence, not mergeable code. Main keeps the learning, not the branch.
