# Copilot X-Branch Guide — NYC Explorer

This is a brief guide for Copilot's role in x-branch spike mode. X-branch mode is optional and does not replace normal story execution. See X-BRANCH-MODE.md for the full workflow description.

## Copilot's Job in X-Branch Mode

When Stephen or ChatGPT initiates an x-branch spike, Copilot:

1. Creates the x-branch from main.
2. Initiates the agent and begins the spike work.
3. Runs the spike (code, tests, experiments) on the branch.
4. Runs gates (`npm run typecheck` and `npm run e2e:auto`) and records results.
5. Drafts the spike report using the X-BRANCH-REPORT-TEMPLATE.md format.
6. Opens or updates the PR with the spike report in the description.

## Branch Rules

- Branch naming pattern: `agent/spike-<topic>`
- One question per spike, one branch per spike.
- The branch is created from current main HEAD.
- X-branches never merge to main.

## Prompt Structure

Each spike prompt should contain:

1. A single, clear spike question.
2. The scope of what to try.
3. The expected evidence to gather.
4. The constraints to follow.

## Prompt-Writing Principles

- One question per spike — keep it narrow and answerable.
- All new tests must be fixture-backed (no live API calls in CI).
- Use `data-testid` selectors for any new UI test assertions.
- Do not modify `docs/project/*` (VISION, EPICS, NEXT).
- Do not remove quarantine skips.
- Do not edit kit docs, manifests, or forGPT files.

## Required Self-Review Output

Before opening the PR, Copilot must verify:

| Check | Expected |
|-------|----------|
| `npm run typecheck` | PASS (0 errors) |
| `npm run e2e:auto` | PASS (no new failures) |
| Spike report drafted | Yes — uses X-BRANCH-REPORT-TEMPLATE.md |
| Hostile scrutiny gate | All 5 questions answered YES (Copilot drafts; ChatGPT reviews adversarially; Stephen approves) |
| No `docs/project/*` edits | Confirmed |
| No quarantine skips removed | Confirmed |
| All new tests fixture-backed | Confirmed |

## Promotion Reminder

Nothing from the spike branch crosses to main automatically. If the spike produces valuable learning:

- **Learning** is captured in a `docs/research/R-###` doc on main (written fresh, not copied from the branch).
- **Tests/fixtures** are rewritten on main via a separate tiny main-branch story (not merged or cherry-picked from the spike branch).
- **Code** is never merged — it is rewritten on main if the approach is proven viable.

## PR Reminder

The PR is a **review envelope**, not a merge path. It exists so Stephen can review the spike evidence, gate results, and report in GitHub's PR UI. The PR is closed without merging when review is complete.
