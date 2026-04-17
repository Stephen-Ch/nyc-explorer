# Copilot X-Branch Guide — NYC Explorer

This is a brief guide for Copilot's role in x-branch spike mode. X-branch mode is optional and does not replace normal story execution. See X-BRANCH-MODE.md for the full workflow description.

X-branch spikes are **cloud-agent-only**. The local VS Code workspace is used for dispatch and orchestration only — **not** for spike implementation. There is **no local fallback**.

## Copilot's Job in X-Branch Mode

Copilot in VS Code handles **local dispatch/orchestration**:

1. Creates the remote x-branch from main HEAD.
2. Launches the GitHub cloud coding agent with the spike prompt.
3. Opens or updates the remote PR as a review envelope.

The **GitHub cloud coding agent** handles **remote execution**:

4. Performs the spike work (code, tests, experiments) on the remote x-branch.
5. Runs gates (`npm run typecheck` and `npm run e2e:auto`) remotely and records results.
6. Drafts the spike report using the X-BRANCH-REPORT-TEMPLATE.md format.
7. Updates the PR with the spike report.

Copilot (local) does **not**:
- Run spike code locally.
- Check out the x-branch locally.
- Run gate commands locally for the spike.
- Make helpful follow-up edits to spike code after dispatch — dispatch ends at PR creation.
- Fall back to local execution if the cloud agent is unavailable — the spike must **STOP**.

## Branch Rules

- Branch naming pattern: `agent/spike-<topic>`
- One question per spike, one branch per spike.
- The branch is a **remote branch** created for the cloud agent. It is not checked out locally.
- X-branches never merge to main.
- No local spike implementation is permitted.

## Prompt Structure

Each spike prompt should contain:

1. A single, clear spike question.
2. The scope of what to try.
3. The expected evidence to gather.
4. The constraints to follow.

## Prompt-Writing Principles

- One question per spike — keep it narrow and answerable.
- **TDD by default.** The spike prompt should instruct the cloud agent to follow RED → GREEN → VERIFY. If TDD is not feasible for the spike (e.g., pure config exploration), include a TDD waiver instruction in the prompt and note the justification in the spike report.
- All new tests must be fixture-backed (no live API calls in CI).
- Use `data-testid` selectors for any new UI test assertions.
- Do not modify `docs/project/*` (VISION, EPICS, NEXT).
- Do not remove quarantine skips.
- Do not edit kit docs, manifests, or forGPT files.

## Required Self-Review Output

Before marking the PR ready for review, the cloud agent must verify:

| Check | Expected |
|-------|----------|
| `npm run typecheck` | PASS (0 errors) |
| `npm run e2e:auto` | PASS (no new failures) |
| Spike report drafted | Yes — uses X-BRANCH-REPORT-TEMPLATE.md |
| Hostile scrutiny gate | All 6 questions answered YES (cloud agent drafts; ChatGPT reviews adversarially; Stephen approves) |
| No `docs/project/*` edits | Confirmed |
| No quarantine skips removed | Confirmed |
| All new tests fixture-backed | Confirmed |
| Execution mode | Cloud agent / remote branch (no local spike implementation) |

## Promotion Reminder

Nothing from the spike branch crosses to main automatically. If the spike produces valuable learning:

- **Learning** is captured in a `docs/research/R-###` doc on main (written fresh, not copied from the branch).
- **Tests/fixtures** are rewritten on main via a separate tiny main-branch story (not merged or cherry-picked from the spike branch).
- **Code** is never merged — it is rewritten on main if the approach is proven viable.

## PR Reminder

The PR is a **remote review envelope**, not a merge path. It exists so Stephen can review the spike evidence, gate results, and report in GitHub's PR UI. The PR is closed without merging when review is complete.

## Authority Reminder

Copilot **proposes** (dispatch, report drafts, promotion packets). ChatGPT **recommends** (hostile scrutiny, verdict opinion). Stephen alone **approves** (adoption verdict, promotion to main). Copilot must never self-approve an adoption verdict or promote artifacts to main without Stephen's explicit approval.

## No Local Fallback

If the GitHub cloud coding agent cannot be launched, the spike must **STOP**. Do not attempt to perform spike implementation in the local VS Code workspace. The local workspace is reserved for main-line development and dispatch/orchestration only.
