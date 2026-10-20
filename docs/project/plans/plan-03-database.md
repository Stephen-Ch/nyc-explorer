# Plan 03: ExplorerWalks database, first tables on Neon (v3, after hostile review round 2)

October 20 2026. Claude is product owner and builder. Draft migration: `db/migrations/0001_init.sql` (attached).

**Done =** the migration is applied to Neon branch `production`, the smoke test passes on the rehearsal branch, restore branch `pre-0001` exists from before it, the SQL file is in the repo through a merged pull request, and CURRENT-STATE.md says how to use it.

## Facts (checked Oct 20)
- Neon project `explorerwalks` (broad-mode-10866437), branch `production`, database `neondb`: PostgreSQL 18.6; PostGIS 3.6.4, btree_gist, pg_trgm available. Free plan: 1 GB per project (Neon pricing page), sleeps after 5 idle minutes.
- Stephen's decisions: Neon free plan now; PostGIS; city is a top-level field (explorerwalks.com subdomain per city); parcel IDs are generic; places anchor to shapes from dated atlases and modern lots link by overlap; events have their own table; demolished buildings are valid places; suggested importance 1-3 that Stephen confirms; 7 snapshot years, expandable.
- v3 of the migration loads cleanly on local PostgreSQL 16 + PostGIS 3, and the v3 smoke test (`smoke.sql`) passes there: objects, year view, overlap rules, overlap % in feet, delete rules. It leaves no rows behind.
- Overnight research writes unreviewed candidate JSON to Google Drive (plan v5).
- The app does not use a database yet. Passwords never go in files.

## Design in plain words
- **Two areas:** `core` = reviewed data the app reads. `research` = raw overnight candidates waiting for review.
- **city** (NYC: map grid 2263, time zone, parcel scheme) and **snapshot_year** (7 rows; add a row to add a year).
- **place** = a stable identity; its ID starts with the city (`nyc-trinity-church`), so two cities never collide.
- **place_version** = what it was in a span of years: kind (building, venue, institution, park, monument, event-site, other), name, address, block, neighborhood, district, summary, importance (suggested, reason, confirmed), grade, status.
  - **Years rule:** stored as plain `first_year` and `last_year`, both counted ("1846 to 1890" includes 1890). Empty last year = still standing. The database builds the range itself, so import code can't get it wrong.
  - **Unsure dates:** `start_unknown` = it may be older than first_year. `closed_unknown` = it may have lasted past last_year. A shop seen only in 1877 is stored 1877 to 1877 with both flags on, so it never shows in 1852.
  - The database refuses two versions of one place covering the same year. Rejected versions don't count.
  - **Rebuild rule:** a rebuilt structure on the same spot with the same name is a new version of the same place. A different use or name is a new place.
- **Evidence:** `source` (URL or catalog number, tier, rights), `quote` (saved fragment, check status), `claim` (which quote proves which fact of which version or event).
- **Geography:** `atlas`, `atlas_plate`, `place_version_atlas_ref` (which plate shows it, even before a shape is traced), `footprint` (traced shape, atlas's own lot label; a traced shape must name its plate), `place_point` (display point and how obtained), `parcel` (today's lots, versioned by release), `footprint_parcel` (overlap % both ways). This is the approved lot rule.
- **event** belongs to a place, with date precision (day, month, year).
- **interest:** 14 slugs, linked to versions and events.
- **App view** `v_place_in_year`: approved versions with a point, active in a given year. The 3-per-block cap is applied by the app.
- **Statuses:** draft → fact_checked → approved (or rejected). An approved row must have at least one checked quote; the promotion step (later plan) enforces this.
- **Delete rules:** a place, source or quote that something depends on cannot be deleted (RESTRICT). Child rows of a version (points, shapes, claims) go with it.
- **Migration log:** `core.schema_migrations` records each applied file. The whole file runs as one transaction: all or nothing.

## Steps
1. **Merge first.** Commit `db/migrations/0001_init.sql`, `db/smoke/0001_smoke.sql` and `db/README.md` on a branch, bundle, Stephen pushes, PR, CI green, merge. The file applied to Neon is the merged one.
2. **Rehearse on a throwaway branch.** In the Neon console (Chrome), create branch `try-0001` from `production`. Run the migration there, then the smoke test. Every check must print PASS. This also shows how Neon's SQL editor handles an all-or-nothing run. Delete `try-0001`.
3. **Restore point.** Create branch `pre-0001` from `production`.
4. **Apply.** Run the migration on `production`. Check with one query: the 20 named tables, the view and the `0001` row exist. No test data on `production`.
5. **Record.** CURRENT-STATE.md: database live, migration list, next plans.

**In parallel (needs Stephen, doesn't block the tables):** test that SmarterASP can reach Neon on port 5432 with a tiny test page. If it can't, the app plan uses Neon's HTTPS SQL or the database moves. Creating tables now costs nothing either way.

## Stephen's yes needed
- This plan, including running SQL in the Neon console through his signed-in Chrome.

## Not in this plan
Research import into `research.packet` and the promotion step (migration 0002 adds links from core rows back to their packet first); backups to Stephen's PC (must come before the first promoted data); MapPLUTO parcels (size check against 1 GB first); the app connecting (connection string in SmarterASP app settings; **first test that SmarterASP can reach Neon on port 5432**, Neon's HTTPS SQL as fallback); roles and a read-only app user; pgRouting.

## Way back
- Database: `DROP SCHEMA core, research CASCADE;` (the database is otherwise empty). Backup option: restore `production` from branch `pre-0001`.
- Repo: revert the one pull request.

## Changes from round 1 review
1. Inclusive last year; unknown start allowed only with "attested in year"; `closed_unknown` cannot have an open end.
2. Place IDs carry the city prefix.
3. Kind moved from place to version (a church can become a store).
4. Added `place_version_atlas_ref`, block, neighborhood and district columns.
5. Rebuild rule and RESTRICT delete rules written down.
6. Added `schema_migrations` and an all-or-nothing transaction.
7. Parcel shape validity check; day/month date precision checks.
8. Merge before applying; way back reworded; SmarterASP-to-Neon test listed.

## Changes from round 2 review
1. Blocker fixed: unknown start no longer means "forever". Plain first/last years plus `start_unknown`; verified the 1877-only shop is absent from 1852.
2. Blocker fixed: rejected versions no longer block corrected ones (verified).
3. Range built automatically from first/last year; year limits 1600 to 2100.
4. Rehearsal on throwaway branch `try-0001` instead of trusting the editor's transaction handling; no test data on `production`.
5. The `production` check is by name, not by count. Way back is DROP SCHEMA, branch restore as backup.
6. A traced shape must name its plate. More point methods (geocoded, atlas-georef, manual) for other cities.
7. Smoke test rewritten for v3 and passing locally.
8. SmarterASP connection test moved alongside this plan.

## Saved for migration 0002 (before the first import)
Links from core rows to research packets; atlas and plate links to sources; sources shared across cities, plus language; circa/decade dates and calendar note; footprint and parcel in the same city; event dates inside the place's years (checked in the promotion step); media, walk routes and edit history tables. Decision for Stephen later: Paris content in English only, or French too.
