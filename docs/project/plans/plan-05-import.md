# Plan 05 (draft 3, rev 1): import research into Neon

Nov 9 2026. Replaces PLAN-05-DRAFT-n2 (Oct 22, sent back Oct 30). Status: hostile review 1 SEND BACK (17 findings), review 2 PASS WITH FIXES (11 new), all folded in. Waiting: Stephen's yes. Nothing run.

## Goal
Copy the launch-area research (places and stories) into Neon's `research` area, exactly as researched, so it is safe, searchable and repeatable. No place, story or source goes into `core`; the only `core` change is the interest list. Nothing reaches the app.

## Stephen's choices (Nov 9)
- Import only. Approval, promotion to `core`, the phone approval flow and the PC backup move to a later plan, written when the app build starts.
- Union Square first. The 38 finished Manhattan units (MN01 to MN06) come second, with the same steps, after Stephen's yes on the trial report.

## Why this is smaller than draft 2
Draft 2 wrote into `core` and needed version-year rules and promotion functions; it was sent back for changing existing rules. This draft adds research tables and copies. It widens two existing research rules (run_file kinds, new columns) and says so.

## Facts (CHECKED Nov 9 unless marked)
- Neon `production` has 0001 and 0002 (CURRENT-STATE). Local repo `main` has only 0001; 0002 is on branch `chore/db-0002`. GUESS: PR #12 never merged, or local `main` is stale.
- Packet `candidate_id` carries unit and year (e.g. `us-1852-george-templeton-strong-house`), so the existing one-live-copy rule works per unit-year as is. `place_id` has no `nyc-` prefix yet.
- `-retry` files are skeptic files (e.g. `__skeptic-1-retry.md`); packet `.jsonl` files have no retry copies.
- Places: US-1852 is `done` (27 kept: A4 B17 C6, plus dropped rows). Each run left `.jsonl` (packets), `.md` (notes), `__sources.md`, `__skeptic-N.md`. US-1877, 1902, 1927 have no runs yet (plan 27 runs them Wed Nov 11).
- Stories: STORIES has 144 rows (ST001 to ST144, columns A to V). Story runs leave `story-claims`, `story-fragments`, `story-skeptic-N`, `story-notes` files, listed in FILES under the story unit (e.g. `ST-SQ-1902`) with a run id. DELIGHTS has 68 rows (D001 to D069; D049 missing).
- INDEX column J is `zone`, but some MN06-1877 rows hold a run id there. Import reads packets, not INDEX, so this does not block; it is reported.
- Drive's text reader escapes characters (`\_`, `\[`). Files are fetched as raw bytes only.
- The 22 interests are in RESEARCH-PLAN-v6-hf8 (line 189). The database has 14: 13 of the 22 plus `19th-century-history`.
- Neon connector rule: NYC only, attended, under an approved plan; no scheduled task may use it (Central Admin AUTHORITY.md). UNCHECKED: the connector's size limit per statement and whether `run_sql_transaction` takes many statements.

## 1. Migration 0003
Additive except where marked WIDENS. Written, smoke-tested, hostile-reviewed, then applied the way 0001 and 0002 were.
- `research.import_batch`: id, state (`open`, `applied`, `undone`, `failed`), started and finished time, sheet read time, what was read (tab row counts, Drive ids with md5, revision id, modified time, size), counts written, note.
- `import_batch_id` on `research.run_file`, `research.packet` and the new tables; `superseded_by_batch_id` on every row that can be superseded, so undo knows exactly which older rows a batch changed.
- `research.run_file` WIDENS: kind check adds `story-claims`, `story-fragments`, `story-skeptic`, `story-notes`; new columns `sha256`, `drive_md5`, `drive_revision`, `drive_modified_utc`, `file_name`, `retry`. No rows exist yet, so nothing old breaks.
- `research.packet`: new columns `run_file_id` (FK), `line_no` and `place_id_db` (the `nyc-` id). The `packet` JSON stays untouched. New rows must fill `disposition_final` (A, B, C) or have `skeptic_changed = 'dropped'`; a rule refuses `pending` rows with neither.
- View `research.v_promotable`: live packets with grade A or B, not dropped. The later approval plan must read only this view.
- `research.story` and `research.delight_1852`: one row per tab row, fields keyed by header name (not position), full row width as `row_raw` jsonb, `row_sha256`, `live` flag, `removed_from_tab` flag. One live row per id (partial unique index); the old row is retired before the new one is inserted. A row gone from the tab gets `removed_from_tab` and `live = false` together. A tab with duplicate or blank headers is refused.
- Interests: add `chinese-history` (Chinese History), `womens-history` (Women's History), `religion` (Religion & Faith), `native-american-history` (Native American History), `jewish-history` (Jewish History), `italian-history` (Italian History & Immigration), `food-drink` (Food & Drink), `theater-entertainment` (Theater & Entertainment), `waterfront-maritime` (Waterfront & Maritime); delete `19th-century-history` (refuses if used). Result: exactly the 22.
- Each batch has a unit: a place unit (`US-1852`), a story unit (`ST-SQ-1902`), or `TAB-STORIES` / `TAB-DELIGHTS` for whole-tab imports.
- `research.undo_import(batch_id)`: works on an `open` batch, or on the newest `applied` batch for its unit; refuses if any row is linked from `research.promotion`. Deletes the batch's rows (children first), restores what it superseded or marked removed (`live` and `removed_from_tab` both), marks it `undone` (or `failed` if it was `open`), returns counts.
- While any batch is `open`, a new import refuses to start; the open batch is undone first.
- Each check in section 4 is a function that raises an error on failure.

## 2. Before the first import
1. Repo: confirm 0002 is on `main`; if not, merge it first. Claude commits 0003, its smoke test and this plan; Stephen double-clicks `tools\push.cmd`; PR, CI green, Stephen's yes, merge.
2. Neon: throwaway branch `try-0003`; run 0003 and its smoke test (ALL PASS), including a forced failed check that must leave zero rows; then a full trial import of US-1852 on that branch, and `undo_import`; delete the branch.
3. Restore branch `pre-0003`; run 0003 on `production`; check the `0003` row and the 22 interests by name.

## 3. The import (Claude, daytime session Stephen starts)
1. Timing: no `claimed` row in QUEUE or STORY_QUEUE, no FILES row younger than 15 minutes. Never on a Wednesday before noon ET (overnight runs and plan 27 edits).
2. Restore branch `pre-import-<date>` from `production` before each import session; keep the newest, delete ones older than 7 days.
3. Read: FILES rows for the unit; also list the unit's files in the Drive overnight folder and report any FILES does not list. Fetch each file's raw bytes with md5, revision and modified time. Read STORIES and DELIGHTS whole width, unformatted values. Parse in Python.
4. Refuse before writing: md5 differs from Drive; not valid UTF-8 or contains a NUL byte; a jsonl line fails to parse; text shaped like a password, key or connection string (stop; Claude tells Stephen the file name in chat, never the text; RUNLOG gets only "secret-like text in 1 file").
5. Packet rules: the `nyc-` id goes in `place_id_db`, the JSON is unchanged; `run_id` from each file's own name; "newest" = latest timestamp inside the run_id (two copies with the same timestamp: refuse); skeptic `-retry` files stored with `retry = true`; a candidate seen in several runs: newest copy live, older copies `superseded` with `superseded_by_batch_id`; each packet linked to its file and line.
6. Sending: file content goes as base64 and is decoded in SQL; sha256 is recomputed in SQL and compared with Python's. The trial branch measures the largest statement the connector accepts, base64 included.
7. Whole unit in one `run_sql_transaction` if the connector allows it. If not (found on the trial branch): split mode. The batch stays `open` across calls, checks run on committed rows at the end, and any error runs `undo_import` and marks the batch `failed`.
8. Just before the final step, re-read each STORIES and DELIGHTS row's sha256, FILES rows, and Drive modified times; if anything changed since step 3, undo and stop.
9. Same file id with the same sha256: skipped. Same id with new content: stop and tell Stephen. Recovery, only with his yes: undo that unit's batches newest first, then import again.
10. Order: US-1852 places (trial; measure minutes, calls, Stephen's usage meter), then STORIES and DELIGHTS, then later units as they finish.

## 4. Checks (raise an error, so the batch rolls back or is undone)
1. sha256 recomputed in SQL equals Python's for every file.
2. Packets stored equal jsonl lines for each file; one live copy per candidate.
3. Live story and delight rows equal the tab's rows by id; ids gone from the tab are marked `removed_from_tab`, not deleted.
4. `core` row counts unchanged except `core.interest` (22).
5. Every new packet passes the disposition rule in section 1.

Reports (listed, never block): kept places versus QUEUE (US-1852: 27, A4 B17 C6); slugs outside the 22; INDEX column slips; Drive files missing from FILES.

One short line per unit goes to RUNLOG and CURRENT-STATE.

## 5. Way back
- One import: `research.undo_import(batch_id)` (newest first).
- Everything: restore `production` from the latest `pre-import-<date>` or `pre-0003`.
- Repo: revert the PR.

## Security
Connector only. Never `get_connection_string`, never a direct database connection from the workspace, never a password in a file.

## Not in this plan
Approval and promotion to `core`; the phone approval rows; the PC backup (needed before the first promotion); pre-October data (10 app places, July drafts, R-034 CSV); images; walk routes; the MN units (second pass, same steps, after Stephen's yes on the trial report).

## Stephen's yes needed
This plan, including Claude running SQL in Neon through the connector.
