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
- Enforce the high-risk plan template (`docs/templates/high-risk-plan.md`) and store each plan under `docs/plans/` before editing `Program.cs`, overlay JS, or provider wiring slices.
- Log baseline verification (full suite + typecheck) in project-history before and after these slices.
- Track prompt cadence inside each prompt header using `Prompt X/Y — elapsed <minutes>` to make the cap visible.

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
2. Full Playwright suite GREEN (pre-flight + post-change when `Program.cs`/overlay/adapters touched).
3. `npm run typecheck` GREEN (pre-flight + post-change when `Program.cs`/overlay/adapters touched).
4. Append Decisions line + project-history micro-entry with baseline notes.
5. Confirm guardrails (plan link, overlay freeze status, renderer fingerprint meta) in the prompt summary.
6. Update CODE-SMELL checklist item if touched by the slice.

## Guardrail Checklist (Sprint 06 Closeout → Sprint 07)
- Overlay freeze active: no `/` overlay edits until Sprint‑07 RFC approved. Fail fast if diffs appear.
- Prompt/time caps: stop after 3 prompts or 60 minutes of RED; declare BREAKDOWN and reset.
- Environment reset: after any BREAKDOWN, reboot tools and reload worktree before resuming.
- Renderer fingerprint meta and script-order parity tests must remain GREEN.
- Session cadence: before first prompt each day, skim `docs/Protocol.md`, `docs/Workflow-Tweaks-S6.md`, `docs/postmortems/overlay-2025-11-09.md`, the active recovery plan, and the relevant plan under `docs/plans/`; refresh after every BREAKDOWN or RFC approval.
