# Plan 01: Retire the coding kit and save the July work (v3, after hostile review rounds 1 and 2)

October 19 2026. Claude is product owner and builder. No app code changes.

Round 1 (3 reviewers): 3 blockers, 9 majors. Round 2 (2 reviewers): no logic blockers, 1 permission gap, 7 majors. All addressed; changes listed at the end.

**Done =** CI green on the pull request, plus every step 4 check passing.

## Goal
1. Move to a clean branch based on GitHub's main.
2. Commit the July historical-places work so it is safe.
3. Remove the retired vibe-coding kit so no agent follows it again.
4. App unchanged, tests passing, CI green.

## Facts (checked Oct 19)
- Current branch `chore/vibe-kit-rollout-v7516-verify-20260506` plus local `main` hold 10 commits that GitHub does not have. Outside the two kit folders they add only 6 files: `DR-POI-UnionSquare-Flatiron-1852-2002_Research-Brief.md` (real research, KEEP), `docs/handoffs/HANDOFF-P054-route-bootstrap-2026-03-05.md` (real handoff, KEEP), and 4 kit files (`NYC-Explorer-Control-Deck-Template.md`, `NYC-Explorer-Prompt-Example-P001-DOC-INDEX.md`, `NYC-Explorer-Prompt-Only-Template-v3.md`, `NYC_human-readme.txt`; DROP, they stay in the backup and old branch).
- `docs/project/NEXT.md` and `EPICS.md` are identical on GitHub main and the current branch, so the PC edits apply to main as they are. Real change: 32 lines added, 19 removed. The files on disk are CRLF; the repo stores LF; there is no `.gitattributes`.
- Uncommitted on the PC (full list from `git status --porcelain --untracked-files=all`): those 2 edits, `CURRENT-STATE.md`, `content/poi.historical-draft.v1.json`, `content/poi.historical-draft-with-events.v1.json`, `docs/handoffs/HANDOFF-Historical-Places-Events-2026-07-13.md`, `scripts/draft/attach-events-DRAFT.py`, `scripts/draft/promote-pois-DRAFT.py`.
- Kit on GitHub main: `docs/vibe-coding/` (92 files) and `docs/forGPT/` (10 files). Nothing that runs (tests, typecheck, CI, package.json, app) reads them.
- `.github/copilot-instructions.md` (Copilot loads it automatically) and `docs/Start-Here-For-AI.md` tell agents to run kit scripts.
- Baseline: typecheck 0 errors; browser tests 96 passed, 1 skipped on purpose, 1 flaky (`route-share-ui` history test).
- CI runs on pull requests and pushes to main only. Claude cannot push to GitHub from the cloud (no access); the PC can.

## Stephen's yes needed before step 1 (one message)
- (a) OK to remove `docs/vibe-coding` and `docs/forGPT` (102 files; they stay in git history and the backup). If no: banners and the two rewrites only, folders kept.
- (b) Approve the two prompts: folder access to `C:\Users\schur\workspaces\NYC Explorer` and delete permission on that folder only. (The backup goes in `workspaces\nyc-bundles\`, which is already connected and needs no delete permission.) Git deletes files when it switches branches, so this lets Claude do the git work on the PC with no commands from Stephen. Close VS Code on this repo first.

## Steps
0. **Pre-checks, then backup.** Read-only first: `find .git -name '*.lock'` (any found: stop, ask Stephen to close VS Code and any git window, then remove them), `git status --porcelain -uall` must equal the expected list below (CHECKED once on Oct 19 in the same VM git: no ownership error, no whole-repo changes). All git work runs in this one place, with any needed setting passed on the command line only (`-c safe.directory=...`), never saved. Backup Into `C:\Users\schur\workspaces\nyc-bundles\` (outside the repo): `git bundle create nyc-all-2026-10-19.bundle --all`, `git bundle verify`, and a copy of the 8 uncommitted items in `uncommitted-2026-10-19\`. No change to the repo.
1. **New branch.** `git switch -c chore/retire-kit origin/main`. The 8 uncommitted items come along unchanged (the 2 edited files are the same on both sides). Any "unable to unlink" warning means stop and report. Then `git status --porcelain -uall` must list exactly the 8 items (6 lines `??`, 2 lines ` M`) and nothing else; if not, stop and report.
2. **Commit A, the work to keep.** Commit all 8 items by name: `docs/project/NEXT.md`, `docs/project/EPICS.md`, `CURRENT-STATE.md`, `content/poi.historical-draft.v1.json`, `content/poi.historical-draft-with-events.v1.json`, `docs/handoffs/HANDOFF-Historical-Places-Events-2026-07-13.md`, `scripts/draft/attach-events-DRAFT.py`, `scripts/draft/promote-pois-DRAFT.py`. Convert them to LF first. Check `git diff --stat` shows about 32 added and 19 removed lines on the 2 files (stop if it shows whole-file changes). Bring in the 2 KEEP files with `git checkout chore/vibe-kit-rollout-v7516-verify-20260506 -- <file>`. Add `scripts/draft/__pycache__/` to `.gitignore`. One commit.
3. **Commit B, remove the kit** (only with yes (a)). `git rm -r docs/vibe-coding docs/forGPT`.
   - Rewrite completely, as a 5-line pointer to `CURRENT-STATE.md`: `.github/copilot-instructions.md`, `docs/Start-Here-For-AI.md`.
   - Banner line at the top of every other file found by `git grep -lE "vibe-coding|forGPT" -- . ':!docs/_legacy' ':!docs/archive' ':!docs/status' ':!docs/research' ':!docs/REPORT-*'`: "Retired Oct 19 2026: the vibe-coding kit is no longer used. Start at CURRENT-STATE.md." (Round 1 found at least: Project.md, Working-With-Stephen.md, Code-Review-Guide.md, Code-Review-Template.md, Playbook.md, overlays/OVERLAY-INDEX.md, Session-Start.md, Copilot-Instructions.md, Protocol.md, INDEX.md, project/AI-WORKFLOW.md, project/README.md, project/NEXT.md, project/EPICS.md.) The banner alone is enough: no other edits to those files, even where old kit commands remain below it, except EPIC-005's kit sentence, which points to CURRENT-STATE.md.
   - History folders are left as they are.
4. **Verify.** Copy the branch to the cloud as a new bundle (new name, checksum compared) and run there: typecheck, `tests/meta`, all browser tests (pass = baseline; the flaky test may fail once if it passes on rerun). Also: every file the step 3 grep finds has the banner as its first line; the 2 rewritten files contain no `vibe-coding` or `forGPT` text; `git diff origin/main --stat -- apps tests package.json package-lock.json playwright.config.ts tsconfig.json` is empty (app unchanged); the 2 draft JSON files and 2 scripts match the step 0 copies after LF conversion (checksums).
5. **Stephen, about 2 minutes.** In PowerShell, paste: `cd "C:\Users\schur\workspaces\NYC Explorer"; git push -u origin chore/retire-kit`. If it asks you to sign in to GitHub, do so and paste the line again. Then click the "Create pull request" link it prints and paste the pull request link to Claude. Claude checks CI if the repo is readable from the cloud (it was not on Oct 19); otherwise Claude opens it in Chrome, or Stephen says green or red.
6. **Later, another yes:** merge the pull request on GitHub, then point local `main` at GitHub's main (this drops the 3 never-pushed kit commits from local main; they stay in the backup and the old branch) and remove the `vibe-coding-kit` git remote. No branches are deleted in this plan.

## Not in this plan
App code, the era picker, the 5 Union Square event matches, deleting branches, cleaning history docs, `docs.zip` (purpose unknown), the old branch's July stash (none exists).

## Way back
The step 0 bundle restores every branch and commit; the uncommitted items have a folder copy. Nothing is pushed to main in this plan.

## Changes from round 1
- Delete permission on the repo folder only: Claude does the git work; Stephen's 5-minute command sitting became one paste plus one click. No stash (it could never be restored cleanly).
- Yes (a) for removing files added (blocker).
- Copilot instructions and Start-Here rewritten instead of bannered (blocker).
- NEXT/EPICS: checked they are identical on both bases, so no hidden kit changes ride along (blocker).
- The 6 non-kit files from the 10 commits reviewed one by one.
- Line endings stated (LF) with a diff-size check; checksums after LF conversion.
- Banner list defined by a grep rule, not a count.
- Bundle outside the repo, full fetch, verify on both sides; `__pycache__` ignored.
- Done includes CI green on a pull request; main changes only through the pull request.
- Byte-for-byte script rerun dropped; checksum check instead.

## Changes from round 2
- Backup folder confirmed inside the already-connected `workspaces` folder.
- Lock-file and VM-git pre-checks; one git environment; settings passed per command.
- "unable to unlink" = stop.
- All 8 commit A files named; exact `git status` expectation.
- Banner-only rule made explicit; step 4 checks rewritten to be passable and to prove what they claim; app-unchanged check added.
- Done defined at the top; CI reading path made honest; sign-in note for the push.
