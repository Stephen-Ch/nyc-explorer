-- ExplorerWalks database, migration 0003 v6 (after code review 3 and three ChatGPT reviews): research import (plan 05, draft 3 rev 1).
-- Research area only. The only core change is the interest list (22 slugs).
-- Target: Neon PostgreSQL 18 + PostGIS 3.6. All or nothing.
BEGIN;

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0002') THEN RAISE EXCEPTION '0002 not applied'; END IF;
  IF EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0003') THEN RAISE EXCEPTION '0003 already applied'; END IF;
  -- New NOT NULL columns below assume no research rows yet.
  IF EXISTS (SELECT 1 FROM research.run_file) OR EXISTS (SELECT 1 FROM research.packet) THEN
    RAISE EXCEPTION 'research tables are not empty; 0003 expects no imported rows';
  END IF;
  IF current_setting('server_encoding') <> 'UTF8' THEN RAISE EXCEPTION 'database must be UTF8'; END IF;
END$$;

-- sha256 of text as UTF-8 bytes, in hex. Marked IMMUTABLE so it can be used in a generated column;
-- safe because the database encoding is UTF8 (checked above) and never changes.
CREATE FUNCTION research.utf8_sha256(t text) RETURNS text LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS
$$ SELECT encode(sha256(convert_to(t, 'UTF8')), 'hex') $$;

-- true if any top-level key of a JSON object is empty or only whitespace (incl. no-break space, zero-width space, BOM)
CREATE FUNCTION research.has_blank_key(j jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS
$$ SELECT EXISTS (SELECT 1 FROM jsonb_object_keys(j) k
           WHERE k ~ ('^[[:space:]' || chr(160) || chr(8203) || chr(65279) || ']*$')) $$;

-- ---------- 1. import batches ----------
-- One batch = one import of one unit (US-1852, MN01-1852, ST-SQ-1902) or one whole tab (TAB-STORIES, TAB-DELIGHTS).
CREATE TABLE research.import_batch (
  batch_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id        text NOT NULL REFERENCES core.city,
  unit_id        text NOT NULL CHECK (unit_id ~ '^(MN[0-9]{2}-[0-9]{4}|US-[0-9]{4}|ST-(SQ|N|S|E|W)-[0-9]{4}|TAB-(STORIES|DELIGHTS))$'),
  state          text NOT NULL DEFAULT 'open' CHECK (state IN ('open','applied','undone','failed')),
  started_utc    timestamptz NOT NULL DEFAULT now(),
  finished_utc   timestamptz,
  sheet_read_utc timestamptz,
  -- what was read: {"files": {"<drive id>": {"sha256": .., "md5": .., "lines": n (packets files)}},
  --                 "tabs": {"STORIES": ["ST001", ..]}, "headers": {"STORIES": [..]}, ...}
  inputs         jsonb NOT NULL CHECK (jsonb_typeof(inputs) = 'object'),
  core_print     jsonb NOT NULL,          -- fingerprint of every core table when the batch opened
  counts         jsonb,                   -- rows written, set when applied or undone
  note           text,
  CHECK ((state = 'open') = (finished_utc IS NULL))
);
-- Only one batch may be open at a time; an open batch must be undone before the next import.
CREATE UNIQUE INDEX import_batch_one_open_uq ON research.import_batch ((true)) WHERE state = 'open';
CREATE INDEX import_batch_unit_ix ON research.import_batch (city_id, unit_id, batch_id);

-- ---------- 2. run files: story kinds, hashes, provenance ----------
ALTER TABLE research.run_file DROP CONSTRAINT run_file_kind_check;
ALTER TABLE research.run_file ADD CONSTRAINT run_file_kind_check CHECK (kind IN
  ('packets','notes','sources','skeptic','story-claims','story-fragments','story-skeptic','story-notes'));
ALTER TABLE research.run_file
  ADD COLUMN import_batch_id bigint NOT NULL REFERENCES research.import_batch ON DELETE RESTRICT,
  ADD COLUMN file_name text NOT NULL,
  ADD COLUMN retry boolean NOT NULL DEFAULT false,
  ADD COLUMN drive_md5 text NOT NULL CHECK (drive_md5 ~ '^[0-9a-f]{32}$'),
  ADD COLUMN drive_revision text,
  ADD COLUMN drive_modified_utc timestamptz NOT NULL,
  ADD COLUMN sha256 text NOT NULL;
-- The database recomputes the hash itself, so stored content can't silently differ from what was fetched.
ALTER TABLE research.run_file ADD CONSTRAINT run_file_sha256_check CHECK (sha256 = research.utf8_sha256(content));
ALTER TABLE research.run_file ADD CONSTRAINT run_file_retry_check
  CHECK (retry = (file_name LIKE '%-retry.md') AND (NOT retry OR kind IN ('skeptic','story-skeptic')));
CREATE INDEX run_file_batch_ix ON research.run_file (import_batch_id);

-- ---------- 3. packets: provenance, supersede tracking, disposition rule ----------
ALTER TABLE research.packet
  ADD COLUMN import_batch_id bigint NOT NULL REFERENCES research.import_batch ON DELETE RESTRICT,
  ADD COLUMN run_file_id bigint NOT NULL REFERENCES research.run_file ON DELETE RESTRICT,
  ADD COLUMN line_no integer NOT NULL CHECK (line_no >= 1),
  ADD COLUMN place_id_db text CHECK (place_id_db ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD COLUMN superseded_by_batch_id bigint REFERENCES research.import_batch ON DELETE RESTRICT;
ALTER TABLE research.packet ADD CONSTRAINT packet_file_line_key UNIQUE (run_file_id, line_no);
ALTER TABLE research.packet ADD CONSTRAINT packet_place_id_city_check
  CHECK (place_id_db IS NULL OR place_id_db LIKE city_id || '-%');
-- A pending packet must have a final grade, or be marked dropped by the skeptic (IS NOT DISTINCT FROM: NULL must not pass).
ALTER TABLE research.packet ADD CONSTRAINT packet_disposition_check
  CHECK (review_state <> 'pending' OR disposition_final IS NOT NULL OR skeptic_changed IS NOT DISTINCT FROM 'dropped');
ALTER TABLE research.packet ADD CONSTRAINT packet_candidate_matches_json
  CHECK (packet->>'candidate_id' IS NOT NULL AND candidate_id = packet->>'candidate_id');
ALTER TABLE research.packet ADD CONSTRAINT packet_superseded_check
  CHECK ((review_state = 'superseded') = (superseded_by_batch_id IS NOT NULL));
CREATE INDEX packet_batch_ix ON research.packet (import_batch_id);
CREATE INDEX packet_superseded_ix ON research.packet (superseded_by_batch_id);

-- ---------- 4. tracker tab rows (STORIES, DELIGHTS) ----------
-- The whole row as read, keyed by header name. A changed row is a new row; the old one stops being live.
CREATE TABLE research.tab_row (
  tab_row_id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id         text NOT NULL REFERENCES core.city,
  import_batch_id bigint NOT NULL REFERENCES research.import_batch ON DELETE RESTRICT,
  tab             text NOT NULL CHECK (tab IN ('STORIES','DELIGHTS')),
  row_key         text NOT NULL,
  sheet_row       integer NOT NULL CHECK (sheet_row >= 2),
  row_raw         jsonb NOT NULL CHECK (jsonb_typeof(row_raw) = 'object' AND NOT research.has_blank_key(row_raw)),
  row_sha256      text GENERATED ALWAYS AS (research.utf8_sha256(row_raw::text)) STORED,
  live            boolean NOT NULL DEFAULT true,
  removed_from_tab boolean NOT NULL DEFAULT false,
  superseded_by_batch_id bigint REFERENCES research.import_batch ON DELETE RESTRICT,
  CHECK (NOT (live AND removed_from_tab)),
  CHECK (live = (superseded_by_batch_id IS NULL)),
  -- IS NOT DISTINCT FROM: a row with no id key must fail, not slip through as NULL
  CHECK ((tab = 'STORIES'  AND row_key ~ '^ST[0-9]{3,}$' AND row_key IS NOT DISTINCT FROM row_raw->>'story_id')
      OR (tab = 'DELIGHTS' AND row_key ~ '^D[0-9]{3,}$'  AND row_key IS NOT DISTINCT FROM row_raw->>'delight_id'))
);
CREATE UNIQUE INDEX tab_row_one_live_uq ON research.tab_row (city_id, tab, row_key) WHERE live;
CREATE UNIQUE INDEX tab_row_batch_sheet_row_uq ON research.tab_row (import_batch_id, sheet_row);
CREATE INDEX tab_row_batch_ix ON research.tab_row (import_batch_id);
CREATE INDEX tab_row_superseded_ix ON research.tab_row (superseded_by_batch_id);

-- ---------- 5. guards: rows go only into an open batch, and change only by superseding or undo ----------
-- Known limits (tested Nov 9; each needs a second writer at the same time, and PostgreSQL cancels one side cleanly):
--  * Writers must not lock research rows with SELECT ... FOR UPDATE before writing them (can deadlock with undo).
--  * research.import_batch is changed only by begin_import, finish_import and undo_import; never UPDATE it by hand.
--  * The later promotion plan MUST take pg_advisory_xact_lock_shared(hashtext('research.import')) first,
--    before inserting into research.promotion or updating packets, or it can deadlock with undo_import.
-- research.in_undo is set (transaction-local) only inside research.undo_import.
-- Known limit: a user who sets research.in_undo by hand can bypass the delete guard. The database has one
-- owner role (used by the connector); the guard stops mistakes, not a deliberate bypass.
CREATE FUNCTION research.in_undo() RETURNS boolean LANGUAGE sql STABLE AS
$$ SELECT coalesce(current_setting('research.in_undo', true), '') = 'on' $$;

CREATE FUNCTION research.guard_row() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE bs text; bu text; bc text; ok boolean;
BEGIN
  -- Shared import lock first, so a row write and finish/undo (exclusive lock) never deadlock.
  IF NOT research.in_undo() THEN PERFORM pg_advisory_xact_lock_shared(hashtext('research.import')); END IF;
  IF TG_OP = 'DELETE' THEN
    IF NOT research.in_undo() THEN RAISE EXCEPTION 'research rows are removed only by research.undo_import' USING ERRCODE = 'check_violation'; END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- FOR SHARE waits for a running finish_import or undo_import (they lock the batch row FOR UPDATE)
    SELECT state, unit_id, city_id INTO bs, bu, bc FROM research.import_batch WHERE batch_id = NEW.import_batch_id FOR SHARE;
    IF bs IS DISTINCT FROM 'open' THEN
      RAISE EXCEPTION 'batch % is not open', NEW.import_batch_id USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.city_id <> bc THEN
      RAISE EXCEPTION 'row city % is not batch city %', NEW.city_id, bc USING ERRCODE = 'check_violation';
    END IF;
    -- (nested IFs: a record field that the table lacks must never be evaluated)
    IF TG_TABLE_NAME = 'run_file' THEN
      IF NEW.unit_id <> bu THEN
        RAISE EXCEPTION 'file unit % is not batch unit %', NEW.unit_id, bu USING ERRCODE = 'check_violation';
      END IF;
    ELSIF TG_TABLE_NAME = 'tab_row' THEN
      IF bu <> 'TAB-' || NEW.tab THEN
        RAISE EXCEPTION '% rows go only in a TAB-% batch', NEW.tab, NEW.tab USING ERRCODE = 'check_violation';
      END IF;
      IF NOT NEW.live OR NEW.removed_from_tab OR NEW.superseded_by_batch_id IS NOT NULL THEN
        RAISE EXCEPTION 'tab rows are inserted live' USING ERRCODE = 'check_violation';
      END IF;
    ELSE  -- packet
      IF NEW.superseded_by_batch_id IS NOT NULL OR NEW.review_state <> 'pending' OR NEW.promoted_utc IS NOT NULL THEN
        RAISE EXCEPTION 'packets are inserted live and pending; supersede them afterwards' USING ERRCODE = 'check_violation';
      END IF;
      IF bu NOT LIKE 'ST-%' AND NEW.candidate_id NOT LIKE lower(bu) || '-%' THEN
        RAISE EXCEPTION 'candidate % does not belong to unit %', NEW.candidate_id, bu USING ERRCODE = 'check_violation';
      END IF;
      SELECT EXISTS (SELECT 1 FROM research.run_file f WHERE f.run_file_id = NEW.run_file_id
                     AND f.import_batch_id = NEW.import_batch_id AND f.kind = 'packets'
                     AND f.drive_file_id = NEW.drive_file_id AND f.run_id = NEW.run_id
                     AND f.unit_id = NEW.unit_id AND f.city_id = NEW.city_id) INTO ok;
      IF NOT ok THEN
        RAISE EXCEPTION 'packet % line % does not match its packets file in the same batch', NEW.candidate_id, NEW.line_no
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF TG_TABLE_NAME = 'run_file' THEN
    RAISE EXCEPTION 'run files never change; import a new batch' USING ERRCODE = 'check_violation';
  ELSIF TG_TABLE_NAME = 'packet' THEN
    IF (NEW.city_id, NEW.candidate_id, NEW.unit_id, NEW.run_id, NEW.drive_file_id, NEW.packet, NEW.import_batch_id,
        NEW.run_file_id, NEW.line_no, NEW.place_id_db, NEW.disposition_final, NEW.skeptic_changed, NEW.imported_utc)
       IS DISTINCT FROM
       (OLD.city_id, OLD.candidate_id, OLD.unit_id, OLD.run_id, OLD.drive_file_id, OLD.packet, OLD.import_batch_id,
        OLD.run_file_id, OLD.line_no, OLD.place_id_db, OLD.disposition_final, OLD.skeptic_changed, OLD.imported_utc) THEN
      RAISE EXCEPTION 'packet content and provenance never change' USING ERRCODE = 'check_violation';
    END IF;
    -- Until the approval plan adds promotion, the only state changes are pending -> superseded (by an import)
    -- and superseded -> pending (by undo). Promotion and rejection are refused here on purpose.
    IF (NEW.review_state, NEW.promoted_utc, NEW.review_note) IS DISTINCT FROM (OLD.review_state, OLD.promoted_utc, OLD.review_note)
       AND NOT ((OLD.review_state = 'pending' AND NEW.review_state = 'superseded' AND NOT research.in_undo())
             OR (OLD.review_state = 'superseded' AND NEW.review_state = 'pending' AND research.in_undo()))
       OR NEW.promoted_utc IS DISTINCT FROM OLD.promoted_utc OR NEW.review_note IS DISTINCT FROM OLD.review_note THEN
      RAISE EXCEPTION 'packet review state may only go pending -> superseded (import) or back (undo)' USING ERRCODE = 'check_violation';
    END IF;
    bu := NEW.unit_id;
  ELSE  -- tab_row
    IF (NEW.city_id, NEW.import_batch_id, NEW.tab, NEW.row_key, NEW.sheet_row, NEW.row_raw)
       IS DISTINCT FROM (OLD.city_id, OLD.import_batch_id, OLD.tab, OLD.row_key, OLD.sheet_row, OLD.row_raw) THEN
      RAISE EXCEPTION 'tab row content never changes; import a new row' USING ERRCODE = 'check_violation';
    END IF;
    bu := 'TAB-' || NEW.tab;
  END IF;
  -- removed_from_tab changes only while an open batch is retiring the row, or inside undo.
  IF TG_TABLE_NAME = 'tab_row' THEN
    IF NEW.removed_from_tab IS DISTINCT FROM OLD.removed_from_tab AND NOT research.in_undo()
       AND NOT EXISTS (SELECT 1 FROM research.import_batch WHERE batch_id = NEW.superseded_by_batch_id AND state = 'open' FOR SHARE) THEN
      RAISE EXCEPTION 'removed_from_tab changes only while an open batch retires the row' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  -- Superseding: only by an open batch of the same unit. Un-superseding: only inside undo.
  IF NEW.superseded_by_batch_id IS DISTINCT FROM OLD.superseded_by_batch_id THEN
    IF NEW.superseded_by_batch_id IS NULL THEN
      IF NOT research.in_undo() THEN RAISE EXCEPTION 'rows are restored only by research.undo_import' USING ERRCODE = 'check_violation'; END IF;
    ELSE
      IF OLD.superseded_by_batch_id IS NOT NULL THEN RAISE EXCEPTION 'row already superseded' USING ERRCODE = 'check_violation'; END IF;
      -- FOR SHARE: a running finish_import (FOR UPDATE on the batch row) can't slip past this change
      IF NOT EXISTS (SELECT 1 FROM research.import_batch WHERE batch_id = NEW.superseded_by_batch_id
                     AND state = 'open' AND unit_id = bu AND city_id = NEW.city_id FOR SHARE) THEN
        RAISE EXCEPTION 'rows are superseded only by an open batch of unit %', bu USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
-- Statement-level: take the shared import lock BEFORE any row is locked, so a row write can never hold a row
-- while waiting for the lock that a running finish/undo holds (the row-level call above is then a no-op re-grant).
CREATE FUNCTION research.guard_lock() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT research.in_undo() THEN PERFORM pg_advisory_xact_lock_shared(hashtext('research.import')); END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER run_file_lock BEFORE INSERT OR UPDATE OR DELETE ON research.run_file FOR EACH STATEMENT EXECUTE FUNCTION research.guard_lock();
CREATE TRIGGER packet_lock   BEFORE INSERT OR UPDATE OR DELETE ON research.packet   FOR EACH STATEMENT EXECUTE FUNCTION research.guard_lock();
CREATE TRIGGER tab_row_lock  BEFORE INSERT OR UPDATE OR DELETE ON research.tab_row  FOR EACH STATEMENT EXECUTE FUNCTION research.guard_lock();
CREATE TRIGGER run_file_guard BEFORE INSERT OR UPDATE OR DELETE ON research.run_file FOR EACH ROW EXECUTE FUNCTION research.guard_row();
CREATE TRIGGER packet_guard   BEFORE INSERT OR UPDATE OR DELETE ON research.packet   FOR EACH ROW EXECUTE FUNCTION research.guard_row();
CREATE TRIGGER tab_row_guard  BEFORE INSERT OR UPDATE OR DELETE ON research.tab_row  FOR EACH ROW EXECUTE FUNCTION research.guard_row();

-- ---------- 6. views (live rows of applied batches only) ----------
-- The only packets a later approval plan may offer: live, graded A or B, not dropped, from an applied batch.
CREATE VIEW research.v_promotable AS
SELECT p.* FROM research.packet p JOIN research.import_batch b ON b.batch_id = p.import_batch_id AND b.state = 'applied'
WHERE p.review_state = 'pending' AND p.disposition_final IN ('A','B') AND p.skeptic_changed IS DISTINCT FROM 'dropped';

CREATE VIEW research.story AS
SELECT t.tab_row_id, t.import_batch_id, t.row_sha256,
  t.row_key AS story_id,
  t.row_raw->>'tier (delight/record)'                AS tier,
  t.row_raw->>'check_label'                          AS check_label,
  t.row_raw->>'place'                                AS place,
  t.row_raw->>'address'                              AS address,
  t.row_raw->>'zone'                                 AS zone,
  t.row_raw->>'index_place_id'                       AS index_place_id,
  t.row_raw->>'story_date'                           AS story_date,
  t.row_raw->>'map_years (standing confirmed)'       AS map_years,
  t.row_raw->>'notable_name'                         AS notable_name,
  t.row_raw->>'hook (fresh wording)'                 AS hook,
  t.row_raw->>'original_source'                      AS original_source,
  t.row_raw->>'original_link'                        AS original_link,
  t.row_raw->>'original_quote'                       AS original_quote,
  t.row_raw->>'pointer_source (modern, credit only)' AS pointer_source,
  t.row_raw->>'skeptic_verdict'                      AS skeptic_verdict,
  t.row_raw->>'grade'                                AS grade,
  t.row_raw->>'new_vs_index_wiki'                    AS new_vs_index_wiki,
  t.row_raw->>'notes'                                AS notes,
  t.row_raw->>'added'                                AS added,
  t.row_raw->>'run_id'                               AS run_id,
  t.row_raw->>'skeptic_file'                         AS skeptic_file,
  t.row_raw
FROM research.tab_row t JOIN research.import_batch b ON b.batch_id = t.import_batch_id AND b.state = 'applied'
WHERE t.tab = 'STORIES' AND t.live;

CREATE VIEW research.delight_1852 AS
SELECT t.tab_row_id, t.import_batch_id, t.row_sha256,
  t.row_key AS delight_id,
  t.row_raw->>'kind' AS kind, t.row_raw->>'year' AS year, t.row_raw->>'event_date' AS event_date,
  t.row_raw->>'report_date' AS report_date, t.row_raw->>'paper' AS paper, t.row_raw->>'printed_page' AS printed_page,
  t.row_raw->>'image_no' AS image_no, t.row_raw->>'loc_link' AS loc_link, t.row_raw->>'quote' AS quote,
  t.row_raw->>'spot_as_printed' AS spot_as_printed, t.row_raw->>'cross_streets' AS cross_streets,
  t.row_raw->>'zone' AS zone, t.row_raw->>'map_point' AS map_point, t.row_raw->>'interests' AS interests,
  t.row_raw->>'hook' AS hook, t.row_raw->>'grade' AS grade, t.row_raw->>'second_source' AS second_source,
  t.row_raw->>'check_result' AS check_result, t.row_raw->>'notes' AS notes,
  t.row_raw
FROM research.tab_row t JOIN research.import_batch b ON b.batch_id = t.import_batch_id AND b.state = 'applied'
WHERE t.tab = 'DELIGHTS' AND t.live;

-- ---------- 7. interests: exactly the 22 ----------
INSERT INTO core.interest (slug, label) VALUES
 ('chinese-history','Chinese History'), ('womens-history','Women''s History'), ('religion','Religion & Faith'),
 ('native-american-history','Native American History'), ('jewish-history','Jewish History'),
 ('italian-history','Italian History & Immigration'), ('food-drink','Food & Drink'),
 ('theater-entertainment','Theater & Entertainment'), ('waterfront-maritime','Waterfront & Maritime');
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM core.place_version_interest WHERE slug = '19th-century-history')
     OR EXISTS (SELECT 1 FROM core.event_interest WHERE slug = '19th-century-history')
     OR EXISTS (SELECT 1 FROM core.interest WHERE parent_slug = '19th-century-history') THEN
    RAISE EXCEPTION '19th-century-history is in use; not deleted';
  END IF;
  DELETE FROM core.interest WHERE slug = '19th-century-history';
  IF (SELECT count(*) FROM core.interest) <> 22 THEN RAISE EXCEPTION 'expected 22 interests'; END IF;
END$$;

-- ---------- 8. import functions ----------
-- All three take the same advisory lock, so begin, finish and undo never interleave.

-- Fingerprint of every core table (row count and content hash), to prove an import wrote nothing to core.
-- Core is small while nothing is promoted; revisit when footprints and parcels are loaded.
CREATE FUNCTION research.core_print() RETURNS jsonb LANGUAGE plpgsql STABLE
  SET datestyle = 'ISO, YMD' SET timezone = 'UTC' SET intervalstyle = 'postgres' SET extra_float_digits = 1 AS $$
DECLARE t text; n bigint; h text; r jsonb := '{}';
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables
           WHERE table_schema = 'core' AND table_type = 'BASE TABLE' ORDER BY table_name LOOP
    EXECUTE format('SELECT count(*), md5(coalesce(string_agg(x::text, %L ORDER BY x::text), %L)) FROM core.%I x', E'\n', '', t) INTO n, h;
    r := r || jsonb_build_object(t, jsonb_build_object('rows', n, 'md5', h));
  END LOOP;
  RETURN r;
END $$;

-- Open a batch. Refuses while another batch is open.
CREATE FUNCTION research.begin_import(p_city text, p_unit text, p_inputs jsonb, p_sheet_read_utc timestamptz)
RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE b bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('research.import'));
  IF EXISTS (SELECT 1 FROM research.import_batch WHERE state = 'open') THEN
    RAISE EXCEPTION 'another import batch is open; undo it first';
  END IF;
  INSERT INTO research.import_batch (city_id, unit_id, inputs, core_print, sheet_read_utc)
  VALUES (p_city, p_unit, p_inputs, research.core_print(), p_sheet_read_utc)
  RETURNING batch_id INTO b;
  RETURN b;
END $$;

-- Close a batch. Every check raises on failure, so the caller's transaction rolls back
-- (or, in split mode, the caller then runs undo_import).
CREATE FUNCTION research.finish_import(p_batch bigint) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE bt research.import_batch; k text; v jsonb; f research.run_file; n bigint; tabname text;
        want text[]; have text[]; c jsonb; ls text[];
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('research.import'));
  SELECT * INTO bt FROM research.import_batch WHERE batch_id = p_batch FOR UPDATE;
  IF NOT FOUND OR bt.state <> 'open' THEN RAISE EXCEPTION 'batch % is not open', p_batch; END IF;

  -- check 0: a place or story unit batch must store at least one new file (a batch with nothing new is not opened)
  IF bt.unit_id NOT LIKE 'TAB-%' AND NOT EXISTS (SELECT 1 FROM research.run_file WHERE import_batch_id = p_batch) THEN
    RAISE EXCEPTION 'check 0 failed: batch % stores no new files', p_batch;
  END IF;

  -- check 1: every listed file is stored (in this batch, or by an earlier applied batch of the same city and unit) with the listed sha256,
  -- and every file stored in this batch is listed.
  FOR k, v IN SELECT * FROM jsonb_each(coalesce(bt.inputs->'files', '{}')) LOOP
    IF NOT EXISTS (SELECT 1 FROM research.run_file rf JOIN research.import_batch b ON b.batch_id = rf.import_batch_id
                   WHERE rf.drive_file_id = k AND rf.sha256 = v->>'sha256'
                     AND rf.city_id = bt.city_id AND rf.unit_id = bt.unit_id
                     AND (rf.import_batch_id = p_batch OR b.state = 'applied')) THEN
      RAISE EXCEPTION 'check 1 failed: file % not stored with the listed sha256', k;
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM research.run_file WHERE import_batch_id = p_batch
             AND NOT (coalesce(bt.inputs->'files', '{}') ? drive_file_id)) THEN
    RAISE EXCEPTION 'check 1 failed: a stored file is not in the batch inputs';
  END IF;

  -- check 2: for each packets file of this batch, packets match the file's lines one to one, JSON equal.
  FOR f IN SELECT * FROM research.run_file WHERE import_batch_id = p_batch AND kind = 'packets' LOOP
    IF NOT (bt.inputs->'files'->f.drive_file_id ? 'lines') THEN
      RAISE EXCEPTION 'check 2 failed: packets file % has no line count in inputs', f.file_name;
    END IF;
    ls := ARRAY(SELECT rtrim(x, E'\r') FROM unnest(string_to_array(regexp_replace(f.content, E'\n$', ''), E'\n')) AS x);
    n := cardinality(ls);
    IF n <> (bt.inputs->'files'->f.drive_file_id->>'lines')::bigint THEN
      RAISE EXCEPTION 'check 2 failed: % has % lines, inputs say %', f.file_name, n, bt.inputs->'files'->f.drive_file_id->>'lines';
    END IF;
    IF EXISTS (SELECT 1 FROM unnest(ls) AS x WHERE btrim(x) = '') THEN
      RAISE EXCEPTION 'check 2 failed: % has a blank line', f.file_name;
    END IF;
    IF (SELECT count(*) FROM research.packet WHERE run_file_id = f.run_file_id) <> n
       OR EXISTS (SELECT 1 FROM research.packet p WHERE p.run_file_id = f.run_file_id
                  AND (p.line_no > n OR ls[p.line_no]::jsonb <> p.packet)) THEN
      RAISE EXCEPTION 'check 2 failed: packets of % do not match its lines', f.file_name;
    END IF;
  END LOOP;
  -- check 2b: every packet this batch superseded has a live copy in this batch
  IF EXISTS (SELECT 1 FROM research.packet o WHERE o.superseded_by_batch_id = p_batch
             AND NOT EXISTS (SELECT 1 FROM research.packet nw WHERE nw.import_batch_id = p_batch
                             AND nw.city_id = o.city_id AND nw.candidate_id = o.candidate_id
                             AND nw.review_state IN ('pending','promoted'))) THEN
    RAISE EXCEPTION 'check 2b failed: a superseded packet has no live replacement in this batch';
  END IF;

  -- check 3: a TAB batch leaves exactly the tab's ids live, and marks removed rows correctly.
  IF bt.unit_id LIKE 'TAB-%' THEN
    tabname := substr(bt.unit_id, 5);
    IF NOT (coalesce(bt.inputs->'tabs', '{}') ? tabname) THEN
      RAISE EXCEPTION 'check 3 failed: inputs have no % id list', tabname;
    END IF;
    SELECT coalesce(array_agg(x ORDER BY x), '{}') INTO want FROM jsonb_array_elements_text(bt.inputs->'tabs'->tabname) x;
    SELECT coalesce(array_agg(t.row_key ORDER BY t.row_key), '{}') INTO have
      FROM research.tab_row t JOIN research.import_batch b ON b.batch_id = t.import_batch_id
     WHERE t.city_id = bt.city_id AND t.tab = tabname AND t.live AND (b.state = 'applied' OR b.batch_id = p_batch);
    IF want <> have THEN RAISE EXCEPTION 'check 3 failed: live % rows differ from the tab', tabname; END IF;
    -- every row written by this batch has exactly the tab's header set
    IF jsonb_typeof(bt.inputs->'headers'->tabname) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'check 3 failed: inputs have no % header list', tabname;
    END IF;
    IF EXISTS (SELECT 1 FROM research.tab_row t WHERE t.import_batch_id = p_batch
               AND ARRAY(SELECT rk.key FROM jsonb_object_keys(t.row_raw) AS rk(key) ORDER BY rk.key)
                   <> ARRAY(SELECT hd.h FROM jsonb_array_elements_text(bt.inputs->'headers'->tabname) AS hd(h) ORDER BY hd.h)) THEN
      RAISE EXCEPTION 'check 3 failed: a % row does not have exactly the tab headers', tabname;
    END IF;
    IF EXISTS (SELECT 1 FROM research.tab_row o WHERE o.superseded_by_batch_id = p_batch
               AND o.removed_from_tab = EXISTS (SELECT 1 FROM research.tab_row nw WHERE nw.live AND nw.city_id = o.city_id
                                                AND nw.tab = o.tab AND nw.row_key = o.row_key)) THEN
      RAISE EXCEPTION 'check 3 failed: a retired row is marked removed while still in the tab, or not marked when gone';
    END IF;
  END IF;

  -- check 4: nothing written to core
  IF research.core_print() <> bt.core_print THEN RAISE EXCEPTION 'check 4 failed: core tables changed during the batch'; END IF;

  -- check 5 (disposition rule) is the table constraint packet_disposition_check.

  c := jsonb_build_object(
    'run_files', (SELECT count(*) FROM research.run_file WHERE import_batch_id = p_batch),
    'packets',   (SELECT count(*) FROM research.packet   WHERE import_batch_id = p_batch),
    'packets_superseded', (SELECT count(*) FROM research.packet WHERE superseded_by_batch_id = p_batch),
    'tab_rows',  (SELECT count(*) FROM research.tab_row  WHERE import_batch_id = p_batch),
    'tab_rows_retired', (SELECT count(*) FROM research.tab_row WHERE superseded_by_batch_id = p_batch));
  UPDATE research.import_batch SET state = 'applied', finished_utc = now(), counts = c WHERE batch_id = p_batch;
  RETURN c;
END $$;

-- Undo one batch: an open batch (marked failed), or the newest applied batch of its unit (marked undone).
CREATE FUNCTION research.undo_import(p_batch bigint) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE bt research.import_batch; c jsonb; np bigint; nf bigint; nt bigint; rp bigint; rt bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('research.import'));
  LOCK TABLE research.promotion IN SHARE MODE;
  SELECT * INTO bt FROM research.import_batch WHERE batch_id = p_batch FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'batch % not found', p_batch; END IF;
  IF bt.state NOT IN ('open','applied') THEN RAISE EXCEPTION 'batch % is %', p_batch, bt.state; END IF;
  IF EXISTS (SELECT 1 FROM research.import_batch WHERE state = 'open' AND batch_id <> p_batch) THEN
    RAISE EXCEPTION 'another batch is open; undo or finish it first';
  END IF;
  IF bt.state = 'applied' AND EXISTS (SELECT 1 FROM research.import_batch
       WHERE city_id = bt.city_id AND unit_id = bt.unit_id AND state = 'applied' AND batch_id > p_batch) THEN
    RAISE EXCEPTION 'batch % is not the newest applied batch for %; undo newer ones first', p_batch, bt.unit_id;
  END IF;
  IF EXISTS (SELECT 1 FROM research.promotion pr JOIN research.packet p ON p.packet_row_id = pr.packet_row_id
             WHERE p.import_batch_id = p_batch) THEN
    RAISE EXCEPTION 'batch % has promoted packets; not undone', p_batch;
  END IF;
  IF EXISTS (SELECT 1 FROM research.packet WHERE import_batch_id = p_batch AND superseded_by_batch_id IS NOT NULL
             AND superseded_by_batch_id <> p_batch)
     OR EXISTS (SELECT 1 FROM research.tab_row WHERE import_batch_id = p_batch AND superseded_by_batch_id IS NOT NULL
                AND superseded_by_batch_id <> p_batch) THEN
    RAISE EXCEPTION 'a later batch superseded rows of batch %; undo it first', p_batch;
  END IF;

  PERFORM set_config('research.in_undo', 'on', true);
  DELETE FROM research.packet  WHERE import_batch_id = p_batch; GET DIAGNOSTICS np = ROW_COUNT;
  DELETE FROM research.tab_row WHERE import_batch_id = p_batch; GET DIAGNOSTICS nt = ROW_COUNT;
  DELETE FROM research.run_file WHERE import_batch_id = p_batch; GET DIAGNOSTICS nf = ROW_COUNT;
  UPDATE research.packet SET review_state = 'pending', superseded_by_batch_id = NULL
   WHERE superseded_by_batch_id = p_batch; GET DIAGNOSTICS rp = ROW_COUNT;
  UPDATE research.tab_row SET live = true, removed_from_tab = false, superseded_by_batch_id = NULL
   WHERE superseded_by_batch_id = p_batch; GET DIAGNOSTICS rt = ROW_COUNT;
  PERFORM set_config('research.in_undo', 'off', true);

  c := jsonb_build_object('packets_deleted', np, 'tab_rows_deleted', nt, 'run_files_deleted', nf,
                          'packets_restored', rp, 'tab_rows_restored', rt);
  UPDATE research.import_batch
     SET state = CASE WHEN bt.state = 'open' THEN 'failed' ELSE 'undone' END,
         finished_utc = now(), counts = coalesce(counts, '{}') || jsonb_build_object('undo', c)
   WHERE batch_id = p_batch;
  RETURN c;
END $$;

INSERT INTO core.schema_migrations (version, note) VALUES ('0003', 'research import (plan 05)');
COMMIT;
