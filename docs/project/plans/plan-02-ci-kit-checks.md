# Plan 02: Remove the two coding-kit checks that block CI (v2, after hostile review round 1)

October 19 2026. Claude is product owner and builder. Follows plan 01; pull request #9 is held until this is done.

Round 1 (3 reviewers, one of them ran the tests): no blockers, 5 majors; all addressed (list at the end).

**Done =** CI green on pull request #9, plus every step 3 check passing. Any CI failure in the E2E gate = stop; Done is not reached.

## Facts (checked Oct 19)
- CI (`.github/workflows/ci.yml`) runs one job: typecheck, then "Playwright Meta Gate" (`tests/meta`, with `CI=true` and `SELECTOR_HELPER_STRICT=1`), then "Playwright E2E Gate" (`npx playwright test`, the whole suite, which runs `tests/meta` again with `CI=true` only). A failed step stops the job, so on PR #9 the E2E gate never ran.
- PR #9 failed in the Meta Gate on `tests/meta/commit-scope.spec.ts` ("runtime commits include prompt + decisions metadata"). This is a coding-kit rule: if the newest commit touches `apps/`, `wwwroot/` or `tests/e2e/`, its message must contain a P-number, "Outcome:" and "Snapshot:". CI downloads only the newest commit, so git lists every file as changed and the rule always fires (reproduced: a one-commit copy lists 83 app files). None of main's last 20 commits carry those tags, so this rule likely fails on main too (main's CI result not seen).
- `tests/meta/selector-helper.spec.ts` fails only when `SELECTOR_HELPER_STRICT=1` (CI sets it): `tests/e2e/home-parity.spec.ts` uses the turn-list selectors without importing `tests/helpers/selectors`. Without the setting it adds a warning and passes. It also fails on GitHub main with the setting.
- The other 4 meta tests pass in CI.
- Not yet seen: whether the E2E gate passes in CI (Node 18 there; Playwright 1.56.1; retries 2 on CI).

## Stephen's yes needed (one message)
- (a) OK to delete `tests/meta/commit-scope.spec.ts` (a kit rule that cannot pass in CI; stays in git history).
- (b) OK to turn the selector-helper rule from a CI failure into a warning (remove `SELECTOR_HELPER_STRICT`).

## Steps
1. On branch `chore/retire-kit` in the cloud copy, commit C:
   - `git rm tests/meta/commit-scope.spec.ts`.
   - In `ci.yml`, remove the line `SELECTOR_HELPER_STRICT: '1'` (and nothing else). The selector rule stays as a warning.
   - Add this plan file (`git add` it explicitly; it is new).
   - Commit message names plan 02.
2. No app code, no other test or workflow changes.
3. **Verify in the cloud, copying CI's conditions:** a one-commit copy (`git clone --depth 1`) of the branch, `CI=true`, nothing else using port 5000: typecheck; `npx playwright test tests/meta` (5 tests, all pass); full `npx playwright test` run **3 times in a row** (pass = all 3 runs green except the planned skip `tests/unit/route-adapter-real.spec.ts` "handles missing polyline and timeout"; the known flaky `tests/e2e/route-share-ui.spec.ts` history test may need a retry, CI allows 2). Any failed run: save the server log, stop and report. In the full repo (not the one-commit copy): `git diff origin/main --stat -- apps` is empty and `git diff HEAD~1 --stat` shows only the 3 files above.
4. **Hand back:** new bundle `nyc-bundles\nyc-plan02-2026-10-19.bundle` (new name). Claude copies it to the PC and compares the checksum there.
5. **Stephen, one paste (PowerShell):**
   ```
   cd "C:\Users\schur\workspaces\NYC Explorer"
   git switch chore/retire-kit
   git pull --ff-only "C:\Users\schur\workspaces\nyc-bundles\nyc-plan02-2026-10-19.bundle" chore/retire-kit
   git push origin chore/retire-kit
   ```
   CI reruns on PR #9 by itself. Stephen (or Copilot with the same report prompt as before) reports the checks.
6. If CI is green: Stephen's yes to merge PR #9 (plan 01 step 6 follows). If the E2E gate fails in CI: stop, report the failing tests, no further changes without a new plan.

## Not in this plan
Fixing `home-parity.spec.ts` to use the helper; the other kit-era meta tests (they pass); Node version in CI (CI uses 18, package.json asks for 20+, cloud runs 22; Playwright 1.56.1 and TypeScript accept 18, so this is an unmeasured risk); `playwright install` downloading all browsers; the "overlay freeze guard" CI step, which silently checks nothing in CI's one-commit copy (known gap); branch protection.

## Way back
Commit C is one revert (`git revert`) away; the deleted test stays in history and in the step 0 backup bundle from plan 01.

## Changes from round 1
- Yes (b) added for weakening the selector rule.
- Full suite runs 3 times in a row with nothing else on port 5000 (a reviewer's 1-of-3 failure happened while two reviewers ran tests at once; INFERRED cause, so it gets rechecked).
- Git diffs moved to the full repo (a one-commit copy has no history).
- Stephen's paste: switch to the branch first; push names the branch; Claude checks the bundle checksum on the PC.
- Planned skip and flaky test named; Node version and overlay-guard gap written down.
- Plan file added explicitly.
