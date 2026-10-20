# Plan 04: database changes before the first research import (v3, after hostile review round 2)

October 20 2026. Claude is product owner and builder. Migration: `db/migrations/0002_before_import.sql`; smoke test `db/smoke/0002_smoke.sql`.

**Done =** 0002 is merged, rehearsed on a throwaway Neon branch with ALL PASS, applied to `production` with a restore branch made first, and CURRENT-STATE.md updated.

## Why now
The import plan (plan 05) moves overnight research packets into `research.packet`, then Stephen approves which become real places. Before any data exists, these changes are cheap. After, they need data fixes.

## What changes, in plain words
1. **Whole run files are kept.** New table `research.run_file` stores each night's 4 files (packets, notes, quote fragments, skeptic verdicts) exactly as written, including a `-retry` re-upload beside the first, so the import never needs another table for them.
2. **One live copy per candidate.** A resumed run copies candidates forward; only one copy can be pending or promoted at a time. Packets record the grade after the skeptic and whether the skeptic changed it.
3. **New table: what each packet produced** (`research.promotion`). One place version can be backed by several packets (a building seen in 1877 and 1902). One packet produces at most one place version. Re-running a promotion finds what it already did. A packet, place version, event, source or quote linked here can't be deleted (to merge duplicates, move the links first). "Promoted" needs a time; a promoted packet can later be superseded.
4. **Created and updated times** on place versions, events and sources, set automatically; the created time can't be rewritten.
5. **No duplicates:** sources (web addresses compared with the host in lower case and without www, default port, `#...` or trailing slash, while the path keeps its letter case; catalog numbers per publisher, ignoring case and spaces), quotes per source and page, claims, atlases (city, name, year) and atlas references. Sources can be shared across cities and get a language.
6. **Atlases can cite their source** and carry an edition note ("published 1852-54"). An atlas reference can point at a known plate, and the plate must belong to that atlas.
7. **New table: lot found by address.** Research finds today's lot number (BBL) by exact address match long before shapes are traced. This records that evidence. The approved lot rule is unchanged: once a shape is traced, overlap is the anchor.
8. **Event end dates** get their own precision, with the same day-1/Jan-1 rules.
9. **City checks:** a lot or overlap link can't cross cities; a place version can move only to a place in the same city (for merging duplicates), and a footprint can't move to another version, which keeps the city checks true on both sides; a parcel ID must be exactly 4 parts matching its own columns.
10. The migration refuses to run twice or before 0001.

## Facts
- Tested locally (PostgreSQL 16 + PostGIS 3) on top of 0001: loads cleanly, 23 tables, the 0002 smoke test ends ALL PASS and leaves nothing behind, and a second run is refused.
- Neon's SQL editor keeps one session across statements (seen on try-0001), so the all-or-nothing run works there.
- Packet fields matched against research plan v5's format: `modern_lots`, `events` dates, `sources.supports`, the 4 run files. `images` is always null today.

## Steps
1. Claude commits the migration, smoke test and this plan on a branch and bundles it. Stephen runs a Copilot prompt to push and open the pull request. CI green, Stephen's yes, merge.
2. Neon: create `try-0002` from `production` (auto-delete 1 day), run 0002 then the 0002 smoke test; must end ALL PASS.
3. Create `pre-0002` from `production` (auto-delete 7 days). Run 0002 on `production`. Check by name: the 3 new tables and the `0002` row.
4. Update CURRENT-STATE.md and `db/README.md` (0001's smoke test is for 0001 only; each smoke test runs right after its own migration).

## Stephen's yes needed
This plan, including running SQL in Neon through his Chrome.

## Not in this plan
The import itself (plan 05). Rules plan 05 must carry, found in review: prefix packet place IDs with `nyc-`; null opening year = snapshot year with `start_unknown`; set `last_year` when the closing year is unknown; map `bbl` to claim fact `parcel`; checked quotes take the skeptic's run time; skip atlas refs with no year; a resumed run's copy of a promoted candidate goes in as `superseded`, and of a rejected one as `rejected`; pick the `-retry` file when both exist; keep a packet's review state and city in step with its promotion rows; clean web addresses (query order, tracking codes) before insert; find likely duplicate places with pg_trgm. Also not here: images table (packets send `images: null` today); circa/decade dates and calendar notes (no packet produces them yet); walk routes; translations (Paris language is Stephen's decision, later); backups to Stephen's PC (before the first promotion).

## Way back
Restore `production` from branch `pre-0002` (the database holds no data yet). Repo: revert the pull request.

## Changes from round 1 review
1. Added `research.run_file` (quote and skeptic files had nowhere to land).
2. One live packet per candidate (resumed runs could be promoted twice).
3. Replaced single packet columns on core tables with `research.promotion` (many packets to one version; idempotent reruns).
4. Duplicate guards for quotes, claims and atlases; web address key; catalog number ignores publisher case.
5. Promoted check made one-way so superseding works.
6. City checks now hold on updates too (no reparenting).
7. Exact parcel ID check (no wildcard tricks); end-date precision rules.
8. Dropped as premature: circa/decade, calendar note, images table, checksum column. Reverse-script claim removed.

## Changes from round 2 review
1. One packet can promote to only one place version.
2. Web address key keeps the path's letter case; also drops default ports and `#...`.
3. Place versions can be merged inside a city; promotion links now block deletes instead of vanishing.
4. Parcel ID must be exactly 4 parts; quotes unique per page; catalog numbers ignore case and spaces; atlas refs can't be duplicated; retry run files allowed.
