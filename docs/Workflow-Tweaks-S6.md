# Workflow Tweaks — Sprint 6

## Keep Doing
- Honor doc gates before code: read Protocol → selectors → Copilot → Project on every slice.
- Auto-split any story estimated over 60 LOC into smaller prompts before touching files.
- Follow the stuck-run protocol the moment a command hangs or a spec stays RED unexpectedly.
- Maintain dev-probe discipline: rerun probes after server changes and stop immediately on regressions.
- Keep the micro "touch-it, tidy-it" rule alive—leave files a little clearer each time they are edited.
- Lead with error-UX fixes before happy-path polish when a regression appears.

## Improve
- Surface doc clarifications earlier; raise ambiguity cards instead of guessing when requirements drift.
- Capture risky assumptions inline in prompts so reviewers can veto quickly.
- Trim redundant selectors/tests the same day they become obsolete.
- Tighten Playwright log collection by copying stdout/stderr before re-running the suite.

## Stop-the-Line Triggers
- Playwright run hangs >2 minutes with no new log output.
- `npm run dev:probe` times out or fails twice in a row.
- Required selector or data-testid is missing from the DOM contract.

## Sprint 6 Kickoff Checklist
1. Confirm selectors and dependency-injection gates are current (selectors.md, Adapters.md).
2. Draft a tiny RED contract for the first slice—no code until it fails.
3. Run `npm run dev:probe` to prove the watch loop is healthy.
4. Ship the first GREEN slice, then reassess scope and split follow-ups.

## Definition of Done Chain
1. Targeted spec(s) GREEN.
2. Full Playwright suite GREEN.
3. `npm run typecheck` GREEN.
4. Append Decisions line + project-history micro-entry.
5. Update CODE-SMELL checklist item if touched by the slice.
