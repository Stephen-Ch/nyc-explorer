# ExplorerWalks database

PostgreSQL + PostGIS on Neon (project `explorerwalks`, branch `production`, database `neondb`). Plan: `docs/project/plans/plan-03-database.md`.

## Areas
- `core`: reviewed data the app reads. Nothing reaches the app until a place version is `approved`.
- `research`: raw overnight research packets waiting for review.

## Main tables
- `city`, `snapshot_year`: one row per city and per year shown. Add a year by adding a row.
- `place` (stable identity, ID starts with the city: `nyc-...`) and `place_version` (what it was from `first_year` to `last_year`, both included; empty `last_year` = still standing).
- `source`, `quote`, `claim`: the evidence behind each fact.
- `atlas`, `atlas_plate`, `place_version_atlas_ref`, `footprint`, `place_point`, `parcel`, `footprint_parcel`: where it stood. Places anchor to shapes from dated atlases; today's lots link by overlap.
- `event`, `interest` and their link tables.
- View `v_place_in_year`: approved places with a point, by city and snapshot year.
- `schema_migrations`: one row per applied migration.
- Added in 0002: `research.run_file` (each night's research files as written), `research.promotion` (which core rows each research packet produced), `place_version_lot_ref` (today's lot found by address, before shapes are traced).

## Applying a migration
1. Rehearse on a throwaway Neon branch: run the migration, then its own smoke test in `db/smoke/` right after it (each smoke test checks only its own migration). It must end with `ALL PASS`. Let the branch expire.
2. Create a restore branch (`pre-NNNN`) from `production`.
3. Run the migration on `production`. Never run smoke tests there.
4. Each migration file is all-or-nothing (BEGIN/COMMIT) and adds its row to `schema_migrations`.

Never put passwords or connection strings in files. The app's connection string lives in hosting app settings.
