# Nightly export and alarm (plan 47)

Every night the research tabs of the tracker are copied into the Neon database through "the door" (schema `api`,
migration 0006). Two standalone Apps Script projects, both owned by schurchville@gmail.com, time zone America/New_York.

| File | Project | What it does |
|---|---|---|
| `export.gs` + `appsscript.json` | NYC nightly export | 1-5am: copy the tracker, send each tab to `api.put_tab`, write one status row per run |
| `alarm.gs` + `alarm.appsscript.json` (paste as `appsscript.json`) | NYC nightly alarm | 7:00am: email if the newest status row is not all good; Mondays a still-alive email. No key, no database |
| `verify.sql` | (attended SQL) | Done-proof: row hashes from the database, to compare with `verifyNow()` |
| `../keys/keygen.mjs` | (Stephen's PC) | Makes the one signing key; writes `db/jwks/nyc-nightly.json`, prints the private key once |

## Install (plan 47 step 4 with amendment A3, attended, about 10 minutes)
1. Status spreadsheet "NYC nightly status" with tabs `status`, `verify`, `alarm`, `selftest` (made by Claude Nov 18 2026).
2. Export project: paste `export.gs` and `appsscript.json`; set `CLIENT_VERSION` to the commit. Script Properties:
   `DB_URL` (Data API URL ending `/rest/v1`), `PRIVATE_KEY` (from keygen), `TRACKER_ID`, `STATUS_SHEET_ID`. Authorize.
   NO triggers yet: nothing may run on its own before test 13g passes.
3. Verify tab columns: run, tab, key, sha256; a run counts only once its `#complete` row is written.
4. Alarm project: paste `alarm.gs` and `alarm.appsscript.json` (as `appsscript.json`). Script Properties:
   `STATUS_SHEET_ID`, `EXPECTED_TABS` = `STORIES,DELIGHTS,INDEX,STORY_TEXT,PLACE_HOOKS,PEOPLE,NAME_LINKS,NUMBER_MAP`.
   Authorize. NO triggers yet.
5. Test 13g (A3): run `selfTest()` from the editor. It calls `tonight()`, `put_tab` for tab `SELFTEST_13G` (must come back
   STOPPED "not on the list"), `record_result` (one WAIT for NUMBER_MAP), and measures STORIES (must be under 1 MB).
   Results land in the `selftest` tab; red in the editor means a check failed. A 404 on `tonight()` = stale schema cache
   (change one Data API setting); a 404 on the others = wrong argument names (code bug).
6. Check no NYC research task is running, then run `verifyNow()` once. Claude runs `verify.sql` (read only) and compares.
7. Only if 5 and 6 pass: export triggers `nightly` daily at 1, 2, 3, 4 and 5am; alarm triggers `dailyCheck` daily 7:00am,
   `weeklyAlive` daily 7:05am.

Session start (NYC): Claude reads both tabs of the status sheet (`status`, `alarm`) with the Sheets connector and runs `node tools/nightly/session-check.mjs <file.json>` on them. It applies the alarm's own rules to `status`, and reports an alarm with no `checked` row in 26 hours or a `mail error` in 7 days. Wired into the session start and the 7:30am outside check in step 4, when the sheet exists.

To pause: Script Property `paused` = yes in the export project (stops `nightly` and `verifyNow`). `verifyNow` writes verify rows only after a fresh copy came back good for every tab. To shut the door at once: `REVOKE nyc_loader FROM authenticator` (attended).

## Tests
- `npm test` here: export, alarm and keygen under fake Apps Script services and a fake clock (no database).
- `DB_TEST_ISOLATED=1 npm run test:db`: the exported payload through the real door and the verify hashes (needs the
  throwaway local PostgreSQL 16 server that `db/test` uses, with `cd db/test && npm ci` done first).

Not proven by these tests (checked live in step 4 and the done-proof): Google's real `getRuns()` / Sheets API link
fields, `computeRsaSha256Signature` with the pasted key, and the Data API's handling of the request.
