-- ExplorerWalks database, migration 0002 (v3, after hostile review round 2): changes needed before the first research import.
-- Target: Neon PostgreSQL 18 + PostGIS 3.6. All or nothing.
BEGIN;

-- Refuse to run twice or out of order.
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0001') THEN RAISE EXCEPTION '0001 not applied'; END IF;
  IF EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0002') THEN RAISE EXCEPTION '0002 already applied'; END IF;
END$$;

-- ---------- 1. research staging: whole run files, and one live packet per candidate ----------
-- Each overnight run writes 4 files (packets, notes, sources with quote fragments, skeptic verdicts).
CREATE TABLE research.run_file (
  run_file_id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id       text NOT NULL REFERENCES core.city,
  run_id        text NOT NULL,
  unit_id       text NOT NULL,
  kind          text NOT NULL CHECK (kind IN ('packets','notes','sources','skeptic')),
  drive_file_id text NOT NULL UNIQUE,
  content       text NOT NULL,                  -- the file exactly as written
  imported_utc  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX run_file_run_ix ON research.run_file (city_id, run_id, kind);   -- a '-retry' re-upload can sit beside the first file

ALTER TABLE research.packet DROP CONSTRAINT packet_candidate_id_run_id_key;
ALTER TABLE research.packet ADD CONSTRAINT packet_city_candidate_run_key UNIQUE (city_id, candidate_id, run_id);
-- A resumed run copies earlier candidates forward: only one copy of a candidate may be pending or promoted.
CREATE UNIQUE INDEX packet_one_live_uq ON research.packet (city_id, candidate_id) WHERE review_state IN ('pending','promoted');
ALTER TABLE research.packet ADD COLUMN disposition_final core.grade;          -- grade after the skeptic
ALTER TABLE research.packet ADD COLUMN skeptic_changed text CHECK (skeptic_changed IN ('none','downgraded','dropped'));
ALTER TABLE research.packet ADD COLUMN promoted_utc timestamptz;
ALTER TABLE research.packet ADD CONSTRAINT packet_promoted_check CHECK (review_state <> 'promoted' OR promoted_utc IS NOT NULL);

-- Which core rows each packet produced or supported. Many packets can support one place version
-- (one building seen in 1877 and 1902), and re-running a promotion finds what it already did.
CREATE TABLE research.promotion (
  promotion_id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  packet_row_id    bigint NOT NULL REFERENCES research.packet ON DELETE RESTRICT,
  place_version_id bigint REFERENCES core.place_version ON DELETE RESTRICT,   -- merge: move these rows first
  event_id         bigint REFERENCES core.event ON DELETE RESTRICT,
  source_id        bigint REFERENCES core.source ON DELETE RESTRICT,
  quote_id         bigint REFERENCES core.quote ON DELETE RESTRICT,
  promoted_utc     timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(place_version_id, event_id, source_id, quote_id) = 1)
);
CREATE UNIQUE INDEX promotion_pv_uq     ON research.promotion (packet_row_id) WHERE place_version_id IS NOT NULL;   -- one packet, one place version
CREATE UNIQUE INDEX promotion_event_uq  ON research.promotion (packet_row_id, event_id)         WHERE event_id IS NOT NULL;
CREATE UNIQUE INDEX promotion_source_uq ON research.promotion (packet_row_id, source_id)        WHERE source_id IS NOT NULL;
CREATE UNIQUE INDEX promotion_quote_uq  ON research.promotion (packet_row_id, quote_id)         WHERE quote_id IS NOT NULL;
CREATE INDEX promotion_pv_ix     ON research.promotion (place_version_id);
CREATE INDEX promotion_event_ix  ON research.promotion (event_id);
CREATE INDEX promotion_source_ix ON research.promotion (source_id);
CREATE INDEX promotion_quote_ix  ON research.promotion (quote_id);

-- ---------- 2. when rows were made and last changed ----------
CREATE FUNCTION core.touch_updated_utc() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_utc := now(); NEW.created_utc := OLD.created_utc; RETURN NEW; END $$;

ALTER TABLE core.place_version ADD COLUMN created_utc timestamptz NOT NULL DEFAULT now(), ADD COLUMN updated_utc timestamptz NOT NULL DEFAULT now();
ALTER TABLE core.event         ADD COLUMN created_utc timestamptz NOT NULL DEFAULT now(), ADD COLUMN updated_utc timestamptz NOT NULL DEFAULT now();
ALTER TABLE core.source        ADD COLUMN created_utc timestamptz NOT NULL DEFAULT now(), ADD COLUMN updated_utc timestamptz NOT NULL DEFAULT now();
CREATE TRIGGER place_version_touch BEFORE UPDATE ON core.place_version FOR EACH ROW EXECUTE FUNCTION core.touch_updated_utc();
CREATE TRIGGER event_touch         BEFORE UPDATE ON core.event         FOR EACH ROW EXECUTE FUNCTION core.touch_updated_utc();
CREATE TRIGGER source_touch        BEFORE UPDATE ON core.source        FOR EACH ROW EXECUTE FUNCTION core.touch_updated_utc();

-- ---------- 3. no duplicate sources, quotes, claims or atlases ----------
-- Sources: shared across cities (NULL city = not tied to one). Web addresses compared after
-- lowercasing and dropping http(s)://, www. and a trailing slash, so small spelling differences can't duplicate.
ALTER TABLE core.source ALTER COLUMN city_id DROP NOT NULL;
ALTER TABLE core.source DROP CONSTRAINT source_city_id_url_key;
-- Only the host is lowercased (paths can be case-sensitive); default ports, '#...' and a trailing slash are dropped.
ALTER TABLE core.source ADD COLUMN url_key text GENERATED ALWAYS AS (
  regexp_replace(lower(substring(url FROM '^https?://([^/?#]+)')), '^www\.|:(80|443)$', '', 'g')
  || rtrim(coalesce(substring(url FROM '^https?://[^/?#]+([^#]*)'), ''), '/')) STORED;
CREATE UNIQUE INDEX source_url_key_uq ON core.source (url_key) WHERE url_key IS NOT NULL;
CREATE UNIQUE INDEX source_catalog_uq ON core.source (lower(btrim(publisher)), lower(btrim(catalog_no))) WHERE catalog_no IS NOT NULL;
ALTER TABLE core.source ADD COLUMN language text NOT NULL DEFAULT 'en' CHECK (language ~ '^[a-z]{2,3}(-[A-Z]{2})?$');

ALTER TABLE core.quote ADD CONSTRAINT quote_source_fragment_page_key UNIQUE NULLS NOT DISTINCT (source_id, fragment, page_or_plate);
CREATE UNIQUE INDEX claim_pv_uq    ON core.claim (place_version_id, fact, quote_id) WHERE place_version_id IS NOT NULL;
CREATE UNIQUE INDEX claim_event_uq ON core.claim (event_id, fact, quote_id)         WHERE event_id IS NOT NULL;

ALTER TABLE core.atlas ADD CONSTRAINT atlas_city_name_year_key UNIQUE (city_id, name, edition_year);
ALTER TABLE core.atlas ADD COLUMN edition_note text;              -- e.g. 'published 1852-54'
ALTER TABLE core.atlas ADD COLUMN source_id bigint REFERENCES core.source;
-- An atlas reference may point at a known plate, and that plate must belong to the same atlas.
ALTER TABLE core.atlas_plate ADD CONSTRAINT atlas_plate_id_atlas_key UNIQUE (plate_id, atlas_id);
ALTER TABLE core.place_version_atlas_ref ADD COLUMN plate_id bigint;
ALTER TABLE core.place_version_atlas_ref ADD CONSTRAINT atlas_ref_plate_same_atlas_fk
  FOREIGN KEY (plate_id, atlas_id) REFERENCES core.atlas_plate (plate_id, atlas_id);
CREATE UNIQUE INDEX atlas_ref_uq ON core.place_version_atlas_ref (place_version_id, atlas_id, coalesce(plate_id::text, lower(plate_label), ''));

-- ---------- 4. today's lot found by address, before any shape is traced ----------
-- Research finds a BBL by exact PLUTO address match long before footprints exist.
-- The approved lot rule is unchanged: once a shape is traced, overlap (footprint_parcel) is the anchor.
CREATE TABLE core.place_version_lot_ref (
  lot_ref_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_version_id bigint NOT NULL REFERENCES core.place_version ON DELETE CASCADE,
  city_id          text NOT NULL REFERENCES core.city,
  native_id        text NOT NULL,                  -- NYC: 10-digit BBL
  method           text NOT NULL CHECK (method IN ('pluto-exact-address','pluto-bbl-check','park-lot','other')),
  matched_address  text,
  checked_utc      timestamptz,                    -- NULL when the research did not record it
  CHECK (city_id <> 'nyc' OR native_id ~ '^[1-5][0-9]{9}$'),
  UNIQUE (place_version_id, native_id, method)
);
CREATE INDEX lot_ref_native_ix ON core.place_version_lot_ref (city_id, native_id);

-- ---------- 5. event end dates get their own precision ----------
ALTER TABLE core.event ADD COLUMN date_end_precision core.date_precision;
ALTER TABLE core.event ADD CONSTRAINT event_end_precision_check CHECK ((date_end IS NULL) = (date_end_precision IS NULL));
ALTER TABLE core.event ADD CONSTRAINT event_end_year_check
  CHECK (date_end_precision IS DISTINCT FROM 'year' OR (extract(month FROM date_end) = 1 AND extract(day FROM date_end) = 1));
ALTER TABLE core.event ADD CONSTRAINT event_end_month_check
  CHECK (date_end_precision IS DISTINCT FROM 'month' OR extract(day FROM date_end) = 1);

-- ---------- 6. links stay inside one city ----------
-- A place version can move only to another place in the same city (merging duplicates);
-- a footprint can't move to another place version. That keeps the city checks below true on both sides.
CREATE FUNCTION core.forbid_version_reparent() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT city_id FROM core.place WHERE place_id = NEW.place_id)
     IS DISTINCT FROM (SELECT city_id FROM core.place WHERE place_id = OLD.place_id) THEN
    RAISE EXCEPTION 'a place version cannot move to a place in another city' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION core.forbid_footprint_reparent() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.place_version_id IS DISTINCT FROM OLD.place_version_id THEN
    RAISE EXCEPTION 'a footprint cannot move to another place version' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER place_version_no_reparent BEFORE UPDATE OF place_id ON core.place_version
  FOR EACH ROW EXECUTE FUNCTION core.forbid_version_reparent();
CREATE TRIGGER footprint_no_reparent BEFORE UPDATE OF place_version_id ON core.footprint
  FOR EACH ROW EXECUTE FUNCTION core.forbid_footprint_reparent();
-- (place.city_id can't change usefully either: place_id must start with city_id.)

CREATE FUNCTION core.check_footprint_parcel_city() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE fp_city text; pc_city text;
BEGIN
  SELECT p.city_id INTO fp_city FROM core.footprint f
    JOIN core.place_version pv ON pv.place_version_id = f.place_version_id
    JOIN core.place p ON p.place_id = pv.place_id WHERE f.footprint_id = NEW.footprint_id;
  SELECT city_id INTO pc_city FROM core.parcel WHERE parcel_id = NEW.parcel_id;
  IF fp_city IS DISTINCT FROM pc_city THEN
    RAISE EXCEPTION 'footprint city % does not match parcel city %', fp_city, pc_city USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER footprint_parcel_city BEFORE INSERT OR UPDATE ON core.footprint_parcel
  FOR EACH ROW EXECUTE FUNCTION core.check_footprint_parcel_city();

CREATE FUNCTION core.check_lot_ref_city() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.place_version pv JOIN core.place p ON p.place_id = pv.place_id
                 WHERE pv.place_version_id = NEW.place_version_id AND p.city_id = NEW.city_id) THEN
    RAISE EXCEPTION 'lot ref city % does not match the place', NEW.city_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER lot_ref_city BEFORE INSERT OR UPDATE ON core.place_version_lot_ref
  FOR EACH ROW EXECUTE FUNCTION core.check_lot_ref_city();

-- parcel_id must be exactly '<city>:<scheme>:<native>:<release>' matching its own columns.
ALTER TABLE core.parcel ADD CONSTRAINT parcel_id_parts_check CHECK (
  parcel_id ~ '^[^:]+:[^:]+:[^:]+:[^:]+$'
  AND split_part(parcel_id, ':', 1) = city_id
  AND split_part(parcel_id, ':', 3) = native_id AND split_part(parcel_id, ':', 4) = release);

INSERT INTO core.schema_migrations (version, note) VALUES ('0002', 'before first import');
COMMIT;
