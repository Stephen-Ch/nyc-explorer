NYC Explorer — Historical Data Seeds & Copilot Guide
Scope: Manhattan (MN01–MN12).
Focus: “What was here?” (landmarks/venues/lots) and “What happened here?” (events with dates/people/provenance).
This folder: docs/historical-data/ contains the seed data drops and manifests from our last working session.

0) TL;DR for humans (and Copilot)


Use the seed files in this folder to populate SQL Server and a researcher/editor UI.


Keep our quality bar: primary sources > secondary; no invented BBLs; ≤3 attractions per block per era.


Every commit: update docs/dev-history.md with what changed, why, evidence, and next step.



1) Folder contents (expected)

If a file is missing, it’s because we haven’t committed it yet. Keep names stable so Copilot can find them.



NYC-Explorer_Seed_Manhattan_v0.3.zip


nycx_seed_landmarks_bbl.sql – BBL-verified landmark inserts (idempotent).


nycx_events_seed.csv – 60+ events (people/tags/sources).


PROVENANCE.md – notes & links.


nycx_landmarks_backlog.csv – “needs_verification” list for more BBLs.




UnionSquare_Flatiron_Tranche2_YYYY-MM-DD.zip


nycx_seed_landmarks_bbl.sql – tranche 2 appends (Bitter End, etc.).


nycx_events_tranche2.csv – 30+ more events with source_primary/secondary.


MANIFEST_nycx_tranche2.txt.




Canonical snapshot years (v0.3): 1852, 1877, 1902, 1927, 1952, 1977, 2002.
(We can widen later; keep storage & UI keyed to specific years, not “bins.”)

2) Glossary & data rules (teach Copilot our language)


Attraction = place at a lot/building scale (landmark, venue, institution).


Event = something that happened at a place on a date (or range), with people and sources.


BBL = Borough (1=Manhattan) + Block + Lot → 10 digits (1007810001). Must derive from a primary source (LPC, DOF/ACRIS/PIP, official open data).


Era = snapshot year label (string), e.g., "1902".


Interest tags = music, cinema, lgbtq, politics, crime, art, architecture, transport, labor, disaster, sports, literature, media.


Power (1–3) = editorial importance (temp manual assignment).


Density cap = ≤3 attractions per block per era; overflow flagged as “more available” in UI.


Provenance = source_primary (institutional/archival) + source_secondary (press/wiki/etc.). Primary is required for critical facts (BBL, dates, identities).



3) Minimal canonical schema (SQL Server)

If these tables already exist, keep names/columns compatible. Keys are designed for idempotent merges.

-- dbo.landmarks
CREATE TABLE IF NOT EXISTS dbo.landmarks (
  id            varchar(64)  NOT NULL PRIMARY KEY,   -- slug (e.g., 'blue_note')
  name          nvarchar(200) NOT NULL,
  address       nvarchar(200) NOT NULL,
  boro          tinyint       NOT NULL DEFAULT 1,     -- 1=Manhattan
  block         int           NULL,
  lot           int           NULL,
  bbl10         char(10)      NULL UNIQUE,
  neighborhood  nvarchar(120) NULL,
  notes         nvarchar(1000) NULL,
  source_url    nvarchar(512) NULL,                   -- OR split to sources table
  created_at    datetime2     NOT NULL DEFAULT sysutcdatetime(),
  updated_at    datetime2     NOT NULL DEFAULT sysutcdatetime()
);

-- dbo.events
CREATE TABLE IF NOT EXISTS dbo.events (
  id             varchar(64)  NOT NULL PRIMARY KEY,   -- slug (e.g., 'stonewall_1969_06_28')
  title          nvarchar(240) NOT NULL,
  date_start     date          NOT NULL,
  date_end       date          NULL,
  era            varchar(8)    NULL,                  -- one of the snapshot years
  address        nvarchar(200) NULL,
  bbl10          char(10)      NULL,
  lat            decimal(9,6)  NULL,
  lon            decimal(9,6)  NULL,
  category_tags  nvarchar(240) NOT NULL,              -- comma-delimited
  people         nvarchar(400) NULL,                  -- comma-delimited names
  blurb          nvarchar(1000) NULL,                 -- 1–3 sentences
  power          tinyint       NOT NULL DEFAULT 1,    -- 1..3
  interest       nvarchar(120) NULL,                  -- short category label(s)
  source_primary nvarchar(512) NULL,
  source_secondary nvarchar(512) NULL,
  needs_verification bit       NOT NULL DEFAULT 1,
  created_at     datetime2     NOT NULL DEFAULT sysutcdatetime(),
  updated_at     datetime2     NOT NULL DEFAULT sysutcdatetime()
);

-- Optional helpers
CREATE TABLE IF NOT EXISTS dbo.blocks (boro tinyint, block int, PRIMARY KEY (boro, block));
CREATE TABLE IF NOT EXISTS dbo.event_sources (
  event_id varchar(64) NOT NULL,
  url nvarchar(512) NOT NULL,
  kind varchar(24) NOT NULL CHECK (kind IN ('primary','secondary')),
  CONSTRAINT PK_event_sources PRIMARY KEY (event_id, url)
);

Constraint (business rule): “≤3 attractions per block per era.”
-- Enforce via post-import check (or trigger). Copilot: write a proc that returns violators.
-- SELECT era, boro, block, COUNT(*) AS attractions FROM dbo.landmarks_by_era
-- GROUP BY era, boro, block HAVING COUNT(*) > 3;


4) Import & merge pipeline (how Copilot should operate)


Unzip seed bundles into docs/historical-data/_inbox/ (kept in repo or Git LFS as needed).


Run SQL files idempotently (they use MERGE/ON CONFLICT patterns).


CSV ingest (events) → load into a staging table (stg_events) with strict headers.


Normalize fields (dates to YYYY-MM-DD, trim people/tag lists, de-dupe slugs).


Merge into dbo.events with upsert logic.


Validation pass (see §6): fail build if required fields missing or cap exceeded.


Log to docs/dev-history.md (what/why/evidence/next).


Never:


Fill BBLs without a cited primary source.


Infer precise coordinates from vague addresses; leave lat/lon NULL and open a verification task.


Delete files under docs/historical-data/ unless asked.



5) BBL verification workflow (what Copilot should propose/do)
Sources hierarchy: LPC reports (designation PDFs) → DOF/ACRIS/PIP → NYC Open Data (PLUTO/MapPLUTO) → official agency PDFs → (last) trusted property indices.
Steps:


Find Block/Lot in a primary doc (e.g., LPC designation page).


Compute BBL10: boro=1 + 5-digit block (left-padded) + 4-digit lot (left-padded).


Append as an upsert row to nycx_seed_landmarks_bbl.sql with the citation in comment.


If unresolved (e.g., condo lot), leave TODO with next source to consult and skip merge.


Update nycx_landmarks_backlog.csv status for that row: needs_verification → verified.



6) Tests & validations (prompt Copilot to scaffold)


CSV/Schema compliance:


Columns exactly match headers in the seed CSVs.


date_start valid ISO; date_end ≥ date_start or NULL.


category_tags only from our controlled list (see §2).




BBL integrity:


bbl10 must start with 1 and be length 10; if present, block/lot numbers must match.


If bbl10 present and address present, join to PLUTO (when added) to cross-check.




Density rule:


For each (era, boro, block), COUNT(attractions) ≤ 3.


Report violators and suggest least-power items for overflow bucket.




Provenance rule:


For any new BBL or event date, source_primary is required.


If missing, fail with a clear message and suggested authoritative sources class.





Copilot Task: “Create tests/SeedValidationTests.cs (xUnit) that loads sample CSVs from docs/historical-data/ and runs the rules above. Print useful failure messages.”


7) Editor UX contract (for the future UI)


Lot timelines: attraction has a timeline with the 3 content layers → blurb (1–3 sentences), 3-paragraph essay, in-depth.


Events: date (or range), people (CSV), tags, power; attach to a BBL when verified.


Save for later: store external_url bookmarks with a normalized host and title.


Overflow per block: show top 3 by power, with “+ more” drawer fed by the overflow list.



8) Prompts for Copilot (paste these in Visual Studio)
A. Importer (events CSV → staging → dbo.events)

You are Copilot working in a .NET solution with SQL Server.
Goal: Import docs/historical-data/nycx_events_tranche2.csv into a staging table and MERGE into dbo.events.
Constraints: do not add columns; validate dates and allowed category_tags; set needs_verification=1 if source_primary is empty.
Artifacts:


Data/Seed/ImportEvents.cs (streaming CSV reader, resilient to quotes/commas).


Sql/merge_events.sql (parameterized MERGE).


Update docs/dev-history.md with row counts and any rejects.



B. BBL appender (landmarks SQL)

Append upsert statements to docs/historical-data/nycx_seed_landmarks_bbl.sql for the following verified landmarks with BBL10 and comments citing the primary source. Keep idempotent pattern and do not touch unrelated rows.

C. Validation tests

Create xUnit tests under tests/SeedValidationTests.cs that:


Load events CSVs from docs/historical-data/ and assert date + tag validity.


Run a T-SQL proc that returns any (era, boro, block) with >3 attractions and fail if any found.


Print a “fix-it” suggestion per failure.




9) Commit hygiene & dev-history
Commit message template:
seed: import tranche2 events + BBL upserts

- merge 34 events from tranche2 csv (MN01–MN12), set needs_verification where primary source missing
- upsert BBLs (Bitter End, Katz’s, Bowery Ballroom, St. Patrick’s Old Cathedral, Police HQ)
- add density check proc; tests asserting ≤3 attractions/block/era

docs/dev-history.md entry template:
## YYYY-MM-DD — Seed tranche import & BBL verification
- Added: 34 events (tranche2), 5 BBL upserts
- Evidence: row counts (pre/post), failed rows (0), density violations (0)
- Sources: primary (list), secondary (list)
- Next: verify University Settlement BBL via ACRIS; geocode missing lat/lon; queue 25 new events in MN04–MN08


10) Guardrails (what Copilot must not do)


Don’t fabricate BBLs, dates, or people.


Don’t exceed density caps; if a 4th item appears, route to overflow.


Don’t “normalize away” names (keep people strings human-readable; dedupe later with a people table).


Don’t remove or rename seed files in docs/historical-data/ without updating this README and the manifests.



11) Next actions (for Copilot to propose PRs)


University Settlement (184 Eldridge): confirm block/lot from primary (ACRIS/PIP) and append a MERGE row.


Geocode events with missing lat/lon using a reproducible pipeline (don’t hard-code API keys).


Overflow UI spec: draft a small JSON contract for “more on this block” responses (top 3 by power + overflow list).


People normalization: propose dbo.people and dbo.event_people link table, with a non-destructive matcher.



Appendix: Allowed-Edits Fence (use in PR descriptions)

Allowed-Edits: planned=3 files ≤300 LOC total
Files:


Data/Seed/ImportEvents.cs


Sql/merge_events.sql


tests/SeedValidationTests.cs


Out-of-scope: UI, auth, or non-seed DB objects.


Definition of Done (seeds):


SQL/CSV imported with 0 schema errors, 0 density violations, and primary sources present for all new BBLs/dates;


docs/dev-history.md updated;


CI runs seed validation tests green.



Save this file at docs/historical-data/README_for_Copilot.md. Ping me when you want DDL refined for your exact DB naming or if you’d like me to generate a first pass of the xUnit seed validation tests.
