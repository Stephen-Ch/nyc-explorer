# NYC Explorer: Current State

Updated October 19 2026.

## PICK UP HERE

- **Status:** Paused. Last in the launch order (after Pastime Rivals, BlackJack Sensei, Dealer's Choice). Start only when Pastime Rivals is waiting only on Stephen.
- **Workflow (Stephen, Oct 19):** Claude as product owner and builder, the same recipe as Pastime Rivals and Mortality. Run the product-owner-preflight skill first. Numbered plans, hostile review by several agents, Stephen's yes, then code. The vibe-coding kit is retired for this project.
- **Hosting (Stephen, Oct 19):** SmarterASP. Site name, folder and live address not yet written down; get them at pre-flight.
- **App:** ASP.NET Core (.NET 8) in `apps/web-mvc`, Leaflet map, 10 present-day places around Union Square and Flatiron, map, list, detail pages and walking route steps.
- **Tests (checked Oct 19 on a fresh copy of GitHub main):** `npm run typecheck` 0 errors. `npm run e2e` 96 passed, 1 skipped on purpose, 1 flaky (`route-share-ui` "copies adapter route after history navigation", passed 2 of 3 reruns). Browser tests start the .NET server themselves.

## Git state (Oct 19, plan 01)

- Work branch: `chore/retire-kit`, based on GitHub main. It holds the July drafts and handoffs (commit A) and removes the retired kit folders `docs/vibe-coding` and `docs/forGPT` (commit B). Entry-point docs carry a "Retired" line; `.github/copilot-instructions.md` and `docs/Start-Here-For-AI.md` now just point here.
- Old branch `chore/vibe-kit-rollout-v7516-verify-20260506` and local `main` (3 never-pushed kit commits) are left as they are. Full backup: `workspaces\nyc-bundles\nyc-all-2026-10-19b.bundle`.
- Plan: `docs/project/plans/plan-01-retire-kit.md`. After the pull request is green and merged (Stephen's yes): point local main at GitHub main and remove the `vibe-coding-kit` remote.

## Next feature: historical places and events

- Decided July 13: the map switches by time period; events attach to places. Details: `docs/handoffs/HANDOFF-Historical-Places-Events-2026-07-13.md`.
- First small check: 5 Union Square events landed on the Croton Fountain point instead of Union Square Park. Confirm which is right.
- Time-period picker: Claude recommends era buttons (the data has 7 fixed eras). Mockup for Stephen to judge on his phone before any build.

## Stephen's steps, in order

1. Push `chore/retire-kit` and open its pull request (plan 01 step 5); later, yes to merge it (step 6).
2. At pre-flight: SmarterASP site name and address for NYC Explorer.
3. Judge the era picker mockup on the phone.

## Older notes

`_Projects\NYC-Explorer` (status review, decision log, July drafts). Its `00-START-HERE.md` is retired in favour of this file.
