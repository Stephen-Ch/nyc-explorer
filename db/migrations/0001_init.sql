-- ExplorerWalks database, migration 0001 (v3, after hostile review round 2)
BEGIN;
-- Target: Neon PostgreSQL 18 + PostGIS 3.6. Tested locally on PostgreSQL 16 + PostGIS 3.
-- Storage SRID 4326 (lat/lng). Area and overlap maths in each city's local SRID (NYC: 2263, feet).

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS core;      -- reviewed, app-facing data
CREATE SCHEMA IF NOT EXISTS research;  -- raw overnight research, waiting for review

CREATE TABLE core.schema_migrations (
  version    text PRIMARY KEY,
  applied_utc timestamptz NOT NULL DEFAULT now(),
  note       text
);

-- ---------- reference ----------
CREATE TABLE core.city (
  city_id      text PRIMARY KEY CHECK (city_id ~ '^[a-z]{2,20}$'),   -- 'nyc', 'chicago'
  name         text NOT NULL,
  local_srid   integer NOT NULL,                                     -- NYC 2263
  timezone     text NOT NULL,
  parcel_scheme text NOT NULL                                        -- NYC 'nyc-bbl'
);

CREATE TABLE core.snapshot_year (
  city_id text NOT NULL REFERENCES core.city,
  year    smallint NOT NULL CHECK (year BETWEEN 1600 AND 2100),
  PRIMARY KEY (city_id, year)
);

CREATE TABLE core.interest (
  slug        text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label       text NOT NULL,
  parent_slug text REFERENCES core.interest
);

CREATE TYPE core.review_status AS ENUM ('draft', 'fact_checked', 'approved', 'rejected');
CREATE TYPE core.grade AS ENUM ('A', 'B', 'C');
CREATE TYPE core.place_kind AS ENUM ('building', 'venue', 'institution', 'park', 'monument', 'event-site', 'other');
CREATE TYPE core.source_tier AS ENUM ('primary', 'secondary', 'lead');
CREATE TYPE core.date_precision AS ENUM ('day', 'month', 'year');

-- ---------- evidence ----------
CREATE TABLE core.source (
  source_id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id      text NOT NULL REFERENCES core.city,
  title        text NOT NULL,
  publisher    text NOT NULL,
  url          text CHECK (url ~ '^https?://'),
  tier         core.source_tier NOT NULL,
  source_date  text,             -- as the source states it ('1854', 'May 1902')
  catalog_no   text,             -- accession or catalog number, when the source is a held item
  rights       text,             -- for images: 'PD', 'CC0', 'CC-BY-4.0', 'link-only'
  CHECK (url IS NOT NULL OR catalog_no IS NOT NULL),
  UNIQUE (city_id, url)
);

CREATE TABLE core.quote (
  quote_id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id    bigint NOT NULL REFERENCES core.source ON DELETE RESTRICT,
  fragment     text NOT NULL CHECK (length(fragment) BETWEEN 3 AND 240),
  page_or_plate text,
  accessed_utc timestamptz NOT NULL,
  check_status text NOT NULL CHECK (check_status IN ('checked', 'unverified', 'failed', 'ocr-match')),
  checked_utc  timestamptz,
  CHECK (check_status = 'unverified' OR checked_utc IS NOT NULL)
);
CREATE INDEX quote_source_ix ON core.quote (source_id);

-- ---------- places ----------
-- A place is a stable identity for a site and what stands or happens there (e.g. Trinity Church at Broadway and Wall).
-- Each structure or use over time is a version: a rebuilt church is a new version of the same place
-- (same_structure_today tells whether today's building is that version's building).
-- place_id always starts with the city id: 'nyc-trinity-church-75-broadway'.
CREATE TABLE core.place (
  place_id       text PRIMARY KEY CHECK (place_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  city_id        text NOT NULL REFERENCES core.city,
  canonical_name text NOT NULL,
  created_utc    timestamptz NOT NULL DEFAULT now(),
  CHECK (place_id LIKE city_id || '-%')
);

CREATE TABLE core.place_version (
  place_version_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_id        text NOT NULL REFERENCES core.place ON DELETE RESTRICT,
  name_in_period  text NOT NULL,
  kind            core.place_kind NOT NULL,
  other_names     text[] NOT NULL DEFAULT '{}',
  -- Years. Both first_year and last_year are INCLUDED ("1846 to 1890" counts 1890).
  -- last_year NULL = still standing today. period is built from them automatically.
  -- start_unknown: first_year is the earliest year it is known to have stood; it may be older.
  -- closed_unknown: last_year is the last year it is known to have stood; it may have lasted longer.
  first_year      int NOT NULL CHECK (first_year BETWEEN 1600 AND 2100),
  last_year       int CHECK (last_year BETWEEN 1600 AND 2100),
  CHECK (last_year IS NULL OR last_year >= first_year),
  period          int4range GENERATED ALWAYS AS (int4range(first_year, last_year + 1)) STORED,
  start_unknown   boolean NOT NULL DEFAULT false,
  closed_unknown  boolean NOT NULL DEFAULT false,
  CHECK (NOT (closed_unknown AND last_year IS NULL)),
  address_text    text,
  address_from_modern_source boolean NOT NULL DEFAULT false,
  block_text      text,            -- cross streets, e.g. 'Broadway (Rector St-Wall St)'; used for the per-block cap
  neighborhood    text,
  district        text,            -- NYC community district, e.g. 'MN01'
  same_structure_today text NOT NULL DEFAULT 'unknown' CHECK (same_structure_today IN ('true','false','unknown')),
  summary         text,
  description     text,
  importance_suggested smallint CHECK (importance_suggested BETWEEN 1 AND 3),
  importance_reason    text,
  importance_confirmed smallint CHECK (importance_confirmed BETWEEN 1 AND 3),
  grade           core.grade,
  status          core.review_status NOT NULL DEFAULT 'draft',
  -- one version per place per moment in time
  EXCLUDE USING gist (place_id WITH =, period WITH &&) WHERE (status <> 'rejected')
);
CREATE INDEX place_version_place_ix ON core.place_version (place_id);
CREATE INDEX place_version_block_ix ON core.place_version (district, block_text);

CREATE TABLE core.place_version_interest (
  place_version_id bigint NOT NULL REFERENCES core.place_version ON DELETE CASCADE,
  slug             text NOT NULL REFERENCES core.interest,
  PRIMARY KEY (place_version_id, slug)
);

-- What each source proves, per fact.
CREATE TABLE core.claim (
  claim_id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_version_id bigint REFERENCES core.place_version ON DELETE CASCADE,
  event_id   bigint,               -- FK added after core.event exists
  fact       text NOT NULL CHECK (fact IN ('existed-in-year','name','address','dates','significance','parcel','coords','event-date')),
  quote_id   bigint NOT NULL REFERENCES core.quote ON DELETE RESTRICT,
  CHECK (num_nonnulls(place_version_id, event_id) = 1)
);
CREATE INDEX claim_pv_ix ON core.claim (place_version_id);
CREATE INDEX claim_event_ix ON core.claim (event_id);
CREATE INDEX claim_quote_ix ON core.claim (quote_id);

-- ---------- geography ----------
CREATE TABLE core.atlas (
  atlas_id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id    text NOT NULL REFERENCES core.city,
  name       text NOT NULL,           -- 'Bromley, Atlas of the City of New York, Manhattan'
  edition_year smallint NOT NULL,
  url        text
);

CREATE TABLE core.atlas_plate (
  plate_id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  atlas_id   bigint NOT NULL REFERENCES core.atlas,
  plate_label text NOT NULL,
  url        text,
  georeferenced boolean NOT NULL DEFAULT false,
  UNIQUE (atlas_id, plate_label)
);

-- The anchor: a shape traced from a dated plate (or a modern dataset for present-day years).
CREATE TABLE core.footprint (
  footprint_id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_version_id bigint NOT NULL REFERENCES core.place_version ON DELETE CASCADE,
  plate_id         bigint REFERENCES core.atlas_plate,
  historic_block_lot_label text,       -- the atlas's own label, as text
  geom             geometry(MultiPolygon, 4326) NOT NULL CHECK (ST_IsValid(geom)),
  method           text NOT NULL CHECK (method IN ('traced-from-plate','modern-dataset','other')),
  confidence       smallint NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  traced_utc       timestamptz NOT NULL DEFAULT now(),
  CHECK (method <> 'traced-from-plate' OR plate_id IS NOT NULL)
);
CREATE INDEX footprint_geom_gix ON core.footprint USING gist (geom);
CREATE INDEX footprint_pv_ix ON core.footprint (place_version_id);

-- Atlas references found by research before any shape is traced.
CREATE TABLE core.place_version_atlas_ref (
  ref_id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_version_id bigint NOT NULL REFERENCES core.place_version ON DELETE CASCADE,
  atlas_id         bigint NOT NULL REFERENCES core.atlas,
  plate_label      text,
  url              text,
  historic_block_lot_label text
);
CREATE INDEX atlas_ref_pv_ix ON core.place_version_atlas_ref (place_version_id);

-- A display point, with how it was obtained.
CREATE TABLE core.place_point (
  place_version_id bigint PRIMARY KEY REFERENCES core.place_version ON DELETE CASCADE,
  geom    geometry(Point, 4326) NOT NULL,
  method  text NOT NULL CHECK (method IN ('pluto','lpc','nps','parks-property','footprint-centroid','geocoded','atlas-georef','manual')),
  source_id bigint REFERENCES core.source
);
CREATE INDEX place_point_gix ON core.place_point USING gist (geom);

-- Generic parcels (NYC: BBL from MapPLUTO), versioned by dataset release.
CREATE TABLE core.parcel (
  parcel_id   text PRIMARY KEY,                 -- '<city>:<scheme>:<native>:<release>', e.g. 'nyc:bbl:1000430006:25v2'
  city_id     text NOT NULL REFERENCES core.city,
  native_id   text NOT NULL,                    -- '1000430006'
  release     text NOT NULL,                    -- '25v2'
  geom        geometry(MultiPolygon, 4326) NOT NULL CHECK (ST_IsValid(geom)),
  UNIQUE (city_id, native_id, release)
);
CREATE INDEX parcel_geom_gix ON core.parcel USING gist (geom);

-- Lot links by overlap, never by number.
CREATE TABLE core.footprint_parcel (
  footprint_id bigint NOT NULL REFERENCES core.footprint ON DELETE CASCADE,
  parcel_id    text NOT NULL REFERENCES core.parcel,
  overlap_pct_of_footprint numeric(5,2) NOT NULL CHECK (overlap_pct_of_footprint BETWEEN 0 AND 100),
  overlap_pct_of_parcel    numeric(5,2) NOT NULL CHECK (overlap_pct_of_parcel BETWEEN 0 AND 100),
  computed_utc timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (footprint_id, parcel_id)
);
CREATE INDEX footprint_parcel_parcel_ix ON core.footprint_parcel (parcel_id);

-- ---------- events ----------
CREATE TABLE core.event (
  event_id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_id    text NOT NULL REFERENCES core.place ON DELETE RESTRICT,     -- events always belong to a place
  title       text NOT NULL,
  date_start  date NOT NULL,
  date_precision core.date_precision NOT NULL,         -- 'year' stores Jan 1 of that year
  date_end    date CHECK (date_end IS NULL OR date_end >= date_start),
  summary     text,
  importance_suggested smallint CHECK (importance_suggested BETWEEN 1 AND 3),
  importance_reason    text,
  importance_confirmed smallint CHECK (importance_confirmed BETWEEN 1 AND 3),
  grade       core.grade,
  status      core.review_status NOT NULL DEFAULT 'draft',
  CHECK (date_precision <> 'year'  OR (extract(month FROM date_start) = 1 AND extract(day FROM date_start) = 1)),
  CHECK (date_precision <> 'month' OR extract(day FROM date_start) = 1)
);
CREATE INDEX event_place_ix ON core.event (place_id);
ALTER TABLE core.claim ADD CONSTRAINT claim_event_fk FOREIGN KEY (event_id) REFERENCES core.event ON DELETE CASCADE;

CREATE TABLE core.event_interest (
  event_id bigint NOT NULL REFERENCES core.event ON DELETE CASCADE,
  slug     text NOT NULL REFERENCES core.interest,
  PRIMARY KEY (event_id, slug)
);

-- ---------- research staging ----------
CREATE TABLE research.packet (
  packet_row_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id       text NOT NULL REFERENCES core.city,
  candidate_id  text NOT NULL,
  unit_id       text NOT NULL,
  run_id        text NOT NULL,
  drive_file_id text NOT NULL,
  packet        jsonb NOT NULL,                 -- the candidate object exactly as researched
  imported_utc  timestamptz NOT NULL DEFAULT now(),
  review_state  text NOT NULL DEFAULT 'pending' CHECK (review_state IN ('pending','promoted','rejected','superseded')),
  review_note   text,
  UNIQUE (candidate_id, run_id)
);

-- ---------- what the app reads ----------
-- Approved place versions active in a snapshot year (the 3-per-block cap is applied at query time).
CREATE VIEW core.v_place_in_year AS
SELECT sy.city_id, sy.year, pv.place_version_id, p.place_id, pv.name_in_period, pv.kind,
       pv.summary, pv.importance_confirmed, pv.district, pv.block_text, pt.geom
FROM core.snapshot_year sy
JOIN core.place p ON p.city_id = sy.city_id
JOIN core.place_version pv ON pv.place_id = p.place_id AND pv.period @> sy.year::int
JOIN core.place_point pt ON pt.place_version_id = pv.place_version_id
WHERE pv.status = 'approved';

-- ---------- seed ----------
INSERT INTO core.city VALUES ('nyc', 'New York City', 2263, 'America/New_York', 'nyc-bbl');
INSERT INTO core.snapshot_year (city_id, year)
SELECT 'nyc', y FROM unnest(ARRAY[1852,1877,1902,1927,1952,1977,2002]) AS y;
INSERT INTO core.interest (slug, label) VALUES
 ('lgbtq-history','LGBTQ History'), ('labor-history','Labor & Workers'' Rights'),
 ('politics-civic','Politics & Civic History'), ('public-art','Public Art & Monuments'),
 ('architecture','Architecture & Landmarks'), ('music-nightlife','Music & Nightlife'),
 ('arts-bohemia','Arts & Bohemian Culture'), ('crime-scandal','Crime & Scandal'),
 ('commerce-industry','Commerce & Industry'), ('protest-activism','Protest & Free Expression'),
 ('african-american-history','African American History'), ('irish-history','Irish History & Immigration'),
 ('immigration','Immigration & Ethnic Communities'), ('19th-century-history','19th Century');

INSERT INTO core.schema_migrations (version, note) VALUES ('0001', 'initial tables');
COMMIT;
