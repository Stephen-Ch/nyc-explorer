# Overlay Recovery Plan (worktree-based)

## Strategy
- Use a clean worktree at sprint-06 closeout for isolation.
- Re-land overlay as one deterministic JS + Program.cs include (after home.js) for '/' and '/__view-home'.
- Guard with a smoke suite and meta fingerprint; Commit-on-Green; Stop-on-RED.

## Smoke Suite
- route-find-real.spec.ts, rate-limit-probe.spec.ts, dir-list.spec.ts, geo-typeahead-a11y.spec.ts, poi-load-timeout.spec.ts.

## Abort Criteria
- Per-slice: max 3 prompts (Plan → Execute → Diagnose), or 60 minutes, or 3 consecutive BLOCKERs.
- Initiative: max 6 prompts.

## Pivot Options
- A (preferred if overlay not required now): Defer overlay; proceed with Program.cs hardening; schedule Sprint-07 overlay RFC.
- B (must ship overlay): use Program.cs inline renderer (known-green pattern) as a single slice guarded by fingerprint + smoke.

## Operational Reset (post-prompt)
- Reboot machine / restart VS Code; hard-refresh browsers.
- Kill lingering dotnet/playwright servers; clear localhost storage.
- Open fresh chats in VS Code and ChatGPT.

## Acceptance
- Baseline re-verified green in worktree before any overlay work.
- Overlay slice green in smoke + full suite + typecheck.
- CI green via draft PR; minimal diff (Program.cs + overlay JS).
