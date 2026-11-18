-- ExplorerWalks database, migration 0006: the nightly door (plan 47 draft 10 + amendments A1, A2).
-- Every night Stephen's Apps Script export sends each research tab of the tracker through three functions in
-- schema api ("the door"). The Neon Data API exposes only schema api. A call arrives as Neon's role
-- authenticator, switched to nyc_loader (the token's role claim). nyc_loader may only run the three functions;
-- they run as nyc_door, which holds only the research rights the door needs.
-- Before running: the Data API must be ON for the branch (role authenticator must exist), and the migration runs
-- as the owner of schema research. After running: refresh the Data API schema cache (plan 47 A2 section 3).
-- Not done here on purpose (A2): no ALTER ROLE nyc_loader SET statement_timeout (Neon ignores it; its own
-- authenticator limit, 8 s, applies). No api function has statement_timeout in its SET clause or catches a cancel.
-- Written down (plan 47): the migration owner keeps ADMIN on nyc_door and owns schema api, so it can still drop
-- or take over the door; that is the database owner, attended only.
-- Target: Neon PostgreSQL 18 + PostGIS 3.6. Tested on PostgreSQL 16. All or nothing.
BEGIN;

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0005') THEN RAISE EXCEPTION '0005 not applied'; END IF;
  IF EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0006') THEN RAISE EXCEPTION '0006 already applied'; END IF;
  IF current_user::text <> (SELECT nspowner::regrole::text FROM pg_namespace WHERE nspname = 'research') THEN
    RAISE EXCEPTION 'run 0006 as the owner of schema research';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    RAISE EXCEPTION 'role authenticator missing: turn the Data API on for this branch first, then run 0006';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nyc_door') THEN
    RAISE EXCEPTION 'role nyc_door already exists; 0006 makes it fresh. Delete it (after checking what it owns) and run 0006 again';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nyc_loader') THEN
    RAISE EXCEPTION 'role nyc_loader already exists; 0006 makes it fresh. Delete it (after checking what it owns) and run 0006 again';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'api') THEN RAISE EXCEPTION 'schema api already exists'; END IF;
END$$;

-- ---------- 1. roles (no login) ----------
CREATE ROLE nyc_door   NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT;
CREATE ROLE nyc_loader NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT;
-- authenticator may switch to nyc_loader but gains none of its rights (F3)
GRANT nyc_loader TO authenticator WITH INHERIT FALSE, SET TRUE;
-- choice 2 (a): the plan 40 importer logs in only during an attended PC import (Claude turns login on, then off)
ALTER ROLE importer NOLOGIN;

-- ---------- 2. the three replaced checks: 0005's rules plus the four new door tabs (A1 patterns) ----------
ALTER TABLE research.import_batch DROP CONSTRAINT import_batch_unit_check_0005;
ALTER TABLE research.tab_row DROP CONSTRAINT tab_row_tab_check_0005;
ALTER TABLE research.tab_row DROP CONSTRAINT tab_row_key_check_0005;
ALTER TABLE research.import_batch ADD CONSTRAINT import_batch_unit_check_0006
  CHECK (unit_id ~ '^(MN[0-9]{2}-[0-9]{4}|US-[0-9]{4}|ST-(SQ|N|S|E|W)-[0-9]{4}|TAB-(STORIES|DELIGHTS|INDEX|STORY_TEXT|PLACE_HOOKS|PEOPLE|NAME_LINKS|NUMBER_MAP))$');
ALTER TABLE research.tab_row ADD CONSTRAINT tab_row_tab_check_0006
  CHECK (tab IN ('STORIES','DELIGHTS','INDEX','STORY_TEXT','PLACE_HOOKS','PEOPLE','NAME_LINKS','NUMBER_MAP'));
-- the first four lines are 0005's rules unchanged (test 13u). Patterns may only widen in a later migration (A1).
ALTER TABLE research.tab_row ADD CONSTRAINT tab_row_key_check_0006 CHECK (
     (tab = 'STORIES'    AND row_key ~ '^ST[0-9]{3,}$' AND row_key IS NOT DISTINCT FROM row_raw->>'story_id')
  OR (tab = 'DELIGHTS'   AND row_key ~ '^D[0-9]{3,}$'  AND row_key IS NOT DISTINCT FROM row_raw->>'delight_id')
  OR (tab = 'INDEX'      AND row_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND row_key IS NOT DISTINCT FROM row_raw->>'candidate_id')
  OR (tab = 'STORY_TEXT' AND row_raw->>'story_id' ~ '^ST[0-9]{3,}$' AND row_raw->>'run_id' ~ '^run-[0-9]{8}T[0-9]{6}Z$'
      AND row_key IS NOT DISTINCT FROM (row_raw->>'story_id') || '@' || (row_raw->>'run_id'))
  OR (tab = 'PLACE_HOOKS' AND row_key ~ '^PH[0-9]{4,}@plan[0-9]+(-[A-Za-z0-9]+)*-[0-9]{8}$'
      AND row_key IS NOT DISTINCT FROM (row_raw->>'hook_id') || '@' || (row_raw->>'run_id'))
  OR (tab = 'PEOPLE'     AND row_key ~ '^PE[0-9]{4,}$' AND row_key IS NOT DISTINCT FROM row_raw->>'person_id')
  OR (tab = 'NAME_LINKS' AND row_key ~ '^NL[0-9]{4,}$' AND row_key IS NOT DISTINCT FROM row_raw->>'link_id')
  OR (tab = 'NUMBER_MAP' AND row_key ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$' AND row_key IS NOT DISTINCT FROM row_raw->>'map_id'));

-- ---------- 3. which list is the real one: research.tab_schema (data only, never run) ----------
CREATE TABLE research.tab_schema (
  tab          text PRIMARY KEY CHECK (tab ~ '^[A-Z_]{2,40}$'),
  enabled      boolean NOT NULL,
  headers      text[] NOT NULL CHECK (cardinality(headers) BETWEEN 1 AND 60),  -- sheet headers plus <column>__urls, in order
  key_strategy text NOT NULL CHECK (key_strategy IN ('single_column','id_at_run')),
  key_col1     text NOT NULL,
  key_col2     text,
  key_pattern  text NOT NULL,                                                -- used only with ~
  note         text,
  CHECK ((key_strategy = 'id_at_run') = (key_col2 IS NOT NULL))
);
INSERT INTO research.tab_schema (tab, enabled, headers, key_strategy, key_col1, key_col2, key_pattern) VALUES
('STORIES', true, ARRAY['story_id','tier (delight/record)','check_label','place','address','zone','index_place_id','story_date',
  'map_years (standing confirmed)','notable_name','hook (fresh wording)','original_source','original_link','original_link__urls','original_quote',
  'pointer_source (modern, credit only)','pointer_source (modern, credit only)__urls','skeptic_verdict','grade','new_vs_index_wiki','notes',
  'added','run_id','skeptic_file'], 'single_column', 'story_id', NULL, '^ST[0-9]{3,}$'),
('DELIGHTS', true, ARRAY['delight_id','kind','year','event_date','report_date','paper','printed_page','image_no','loc_link','loc_link__urls',
  'quote','spot_as_printed','cross_streets','zone','map_point','interests','hook','grade','second_source','check_result','notes'],
  'single_column', 'delight_id', NULL, '^D[0-9]{3,}$'),
('INDEX', true, ARRAY['candidate_id','place_id','name','address_in_year','cd','year','disposition','importance_suggested','unit_id','zone',
  'interests','hold_reason'], 'single_column', 'candidate_id', NULL, '^[a-z0-9]+(-[a-z0-9]+)*$'),
('STORY_TEXT', true, ARRAY['story_id','run_id','lead_id','story_text','date_note','style_check','followup_status'],
  'id_at_run', 'story_id', 'run_id', '^ST[0-9]{3,}@run-[0-9]{8}T[0-9]{6}Z$'),
('PLACE_HOOKS', true, ARRAY['hook_id','era','fact_year','block','address','address_note','own_rule','building','hook','fragments','source_file',
  'lpc_report','checker_file','hook_ok','checked_utc','run_id','notes'],
  'id_at_run', 'hook_id', 'run_id', '^PH[0-9]{4,}@plan[0-9]+(-[A-Za-z0-9]+)*-[0-9]{8}$'),
('PEOPLE', true, ARRAY['person_id','kind','display_name','name_variants','born','died','roles','wikidata_qid','wikipedia_url','wikipedia_url__urls',
  'match_status','match_evidence','checker_file','checked_utc','notes','links_json'], 'single_column', 'person_id', NULL, '^PE[0-9]{4,}$'),
('NAME_LINKS', true, ARRAY['link_id','person_id','item_type','item_id','name_in_hook','hook_text_at_link','role_in_item','year','era','run_id','notes'],
  'single_column', 'link_id', NULL, '^NL[0-9]{4,}$'),
('NUMBER_MAP', true, ARRAY['map_id','street_printed','street_modern','segment','break_id','old_years','new_years','old_side','new_side','old_from',
  'old_to','rule','n','swap','chain_next','pairs_json','houses_traced','households','anchors_json','contradictions_json',
  'image_checked','test_households','atlas_check','lot_run_check','grade','status','checker_file','notes'],
  'single_column', 'map_id', NULL, '^[A-Z0-9]+(-[A-Z0-9]+)*$');

-- ---------- 4. the nightly record: one row per tab per call, append-only ----------
CREATE TABLE research.nightly_run (
  run_row_id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  logged_utc     timestamptz NOT NULL DEFAULT now(),
  export_group   date,                       -- the night (America/New_York date)
  copy_id        text CHECK (char_length(copy_id) <= 200),
  copy_utc       timestamptz,
  tab            text,                       -- NULL only for a record_result guard stop
  status         text NOT NULL CHECK (status IN ('PASS','ALREADY','NOTHING_NEW','STOPPED','WAIT','SKIPPED','FAIL')),
  reason         text CHECK (char_length(reason) <= 2000),
  counts         jsonb,
  removed_keys   text[],
  client_version text CHECK (char_length(client_version) <= 100),
  payload_sha256 text CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
  row_count      integer,
  keyset_sha256  text CHECK (keyset_sha256 ~ '^[0-9a-f]{64}$'),
  base_batch_id  bigint REFERENCES research.import_batch ON DELETE RESTRICT,  -- PASS: its batch; ALREADY, NOTHING_NEW: the tab's live batch
  batch_id       bigint REFERENCES research.import_batch ON DELETE RESTRICT,  -- PASS only
  -- a good row always proves which copy it came from (R5)
  CHECK (status NOT IN ('PASS','ALREADY','NOTHING_NEW')
         OR (export_group IS NOT NULL AND copy_id IS NOT NULL AND copy_utc IS NOT NULL AND tab IS NOT NULL
             AND payload_sha256 IS NOT NULL AND row_count IS NOT NULL AND keyset_sha256 IS NOT NULL)),
  CHECK ((status = 'PASS') = (batch_id IS NOT NULL)),
  CHECK (status <> 'PASS' OR base_batch_id = batch_id)
);
CREATE INDEX nightly_run_tab_ix ON research.nightly_run (tab, export_group, copy_utc);
CREATE INDEX nightly_run_copy_ix ON research.nightly_run (copy_id, tab);

-- ---------- 5. removed rows Stephen accepted (attended inserts by the owner only) ----------
CREATE TABLE research.removal_approval (
  approval_id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id          text NOT NULL REFERENCES core.city,
  tab              text NOT NULL REFERENCES research.tab_schema,
  row_key          text NOT NULL,
  live_batch_id    bigint NOT NULL REFERENCES research.import_batch ON DELETE RESTRICT,  -- the batch the key is live in
  approved_utc     timestamptz NOT NULL DEFAULT now(),
  note             text,
  used_by_batch_id bigint REFERENCES research.import_batch ON DELETE RESTRICT,           -- set once; stays set after an undo
  used_utc         timestamptz,
  CHECK ((used_by_batch_id IS NULL) = (used_utc IS NULL))
);
CREATE INDEX removal_approval_key_ix ON research.removal_approval (city_id, tab, row_key, live_batch_id);

-- ---------- 6. the importer (or anyone else) cannot skip the door (review 6 M1) ----------
CREATE FUNCTION research.door_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF NEW.unit_id IN ('TAB-STORIES','TAB-DELIGHTS','TAB-INDEX','TAB-STORY_TEXT','TAB-PLACE_HOOKS','TAB-PEOPLE','TAB-NAME_LINKS','TAB-NUMBER_MAP')
     AND session_user::text NOT IN ((SELECT n.nspowner::regrole::text FROM pg_catalog.pg_namespace n WHERE n.nspname = 'research'), 'authenticator') THEN
    RAISE EXCEPTION '% is a door tab: it is imported only through the nightly door (api.put_tab) or by the database owner', NEW.unit_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION research.door_guard() FROM PUBLIC;
CREATE TRIGGER import_batch_door_guard BEFORE INSERT ON research.import_batch FOR EACH ROW EXECUTE FUNCTION research.door_guard();

-- ---------- 7. nyc_door's rights: a subset of the importer's, plus the new tables ----------
GRANT USAGE ON SCHEMA research TO nyc_door;
GRANT EXECUTE ON FUNCTION research.begin_import(text, text, jsonb, timestamptz), research.finish_import(bigint),
  research.utf8_sha256(text), research.has_blank_key(jsonb) TO nyc_door;
GRANT SELECT ON research.import_batch, research.tab_row, research.tab_schema, research.nightly_run, research.removal_approval TO nyc_door;
GRANT INSERT (city_id, import_batch_id, tab, row_key, sheet_row, row_raw) ON research.tab_row TO nyc_door;
GRANT UPDATE (live, removed_from_tab, superseded_by_batch_id) ON research.tab_row TO nyc_door;
GRANT INSERT (export_group, copy_id, copy_utc, tab, status, reason, counts, removed_keys, client_version, payload_sha256,
  row_count, keyset_sha256, base_batch_id, batch_id) ON research.nightly_run TO nyc_door;
GRANT UPDATE (used_by_batch_id, used_utc) ON research.removal_approval TO nyc_door;

-- ---------- 8. the door ----------
CREATE SCHEMA api;
REVOKE ALL ON SCHEMA api FROM PUBLIC;
-- temporary, so the functions can be handed to nyc_door (revoked at the end of this file)
GRANT nyc_door TO CURRENT_USER WITH INHERIT TRUE, SET TRUE;
GRANT CREATE ON SCHEMA api TO nyc_door;

-- api.put_tab: every check, then one snapshot batch. Returns {status, reason, counts, removed_keys}.
-- Statuses: PASS (imported), ALREADY (this exact copy was accepted tonight), NOTHING_NEW (no change, no batch),
-- STOPPED (refused and logged; nothing kept). A database cancel (Neon's 8 s limit) is never caught here: it
-- arrives as an HTTP error and the script logs FAIL.
CREATE FUNCTION api.put_tab(export_group date, copy_id text, copy_utc timestamptz, tab text, client_version text,
                            headers jsonb, rows jsonb)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, research, pg_temp SET lock_timeout = '3s' AS $$
DECLARE
  v_group date := put_tab.export_group; v_copy text := put_tab.copy_id; v_copy_utc timestamptz := put_tab.copy_utc;
  v_tab text := put_tab.tab; v_version text := left(put_tab.client_version, 100); v_hjson jsonb := put_tab.headers;
  v_rows jsonb := put_tab.rows;
  v_limit text; v_status text; v_reason text; v_counts jsonb; v_removed text[]; v_batch bigint; v_base bigint;
  v_hash text; v_keyset text; v_nrows integer; v_state text; v_msg text;
  s research.tab_schema; v_headers text[]; v_ncol integer; i1 integer; i2 integer;
  r jsonb; v_cells text[]; v_key text; v_keys text[] := '{}'; v_raws jsonb[] := '{}'; v_srows integer[] := '{}'; v_dup text;
  v_newest timestamptz; v_open bigint; v_live integer; v_missing text[]; v_changed text[]; v_n integer := 0;
BEGIN
  -- guard (A2): Neon's limit must be there and short; nothing locked, only this log row written
  v_limit := current_setting('statement_timeout');
  IF v_limit = '0' THEN v_reason := 'time limit missing: 0';
  ELSIF v_limit::interval > interval '15 seconds' THEN v_reason := 'time limit too long: ' || v_limit;
  ELSIF coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb->>'sub' IS DISTINCT FROM 'nightly-export' THEN
    v_reason := 'token sub is not nightly-export';
  END IF;
  IF v_reason IS NOT NULL THEN
    INSERT INTO research.nightly_run (export_group, copy_id, copy_utc, tab, status, reason, client_version)
    VALUES (v_group, left(v_copy, 200), v_copy_utc, left(v_tab, 40), 'STOPPED', v_reason, v_version);
    RETURN jsonb_build_object('status', 'STOPPED', 'reason', v_reason);
  END IF;

  BEGIN
    -- the import lock first: every check below sees all earlier imports (a wait over 3 s comes back STOPPED)
    PERFORM pg_advisory_xact_lock(hashtext('research.import'));

    IF v_group IS NULL OR v_copy IS NULL OR v_copy !~ '^[A-Za-z0-9._:-]{1,200}$' OR v_copy_utc IS NULL THEN
      RAISE EXCEPTION 'export_group, copy_id (1-200 of A-Z a-z 0-9 . _ : -) and copy_utc are required';
    END IF;
    -- 1. on the list and enabled
    SELECT * INTO s FROM research.tab_schema ts WHERE ts.tab = v_tab;
    IF NOT FOUND THEN RAISE EXCEPTION 'tab % is not on the list', left(v_tab, 40); END IF;
    IF NOT s.enabled THEN RAISE EXCEPTION 'tab % is disabled', v_tab; END IF;
    -- size limits (F14, A2): rows, columns, payload
    IF jsonb_typeof(v_rows) IS DISTINCT FROM 'array' OR jsonb_typeof(v_hjson) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'headers and rows must be JSON arrays';
    END IF;
    IF jsonb_array_length(v_rows) > 5000 THEN RAISE EXCEPTION 'size limit: rows (% over 5000)', jsonb_array_length(v_rows); END IF;
    IF jsonb_array_length(v_hjson) > 60 THEN RAISE EXCEPTION 'size limit: columns (% over 60)', jsonb_array_length(v_hjson); END IF;
    IF octet_length(v_rows::text) > 2000000 THEN RAISE EXCEPTION 'size limit: payload (% bytes over 2,000,000)', octet_length(v_rows::text); END IF;
    -- 2. headers equal the list exactly
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_hjson) e WHERE jsonb_typeof(e) <> 'string') THEN
      RAISE EXCEPTION 'headers differ from the list (not all text)';
    END IF;
    v_headers := ARRAY(SELECT e FROM jsonb_array_elements_text(v_hjson) WITH ORDINALITY AS x(e, o) ORDER BY o);
    IF v_headers IS DISTINCT FROM s.headers THEN RAISE EXCEPTION 'headers differ from the list for %', v_tab; END IF;
    v_ncol := cardinality(v_headers);
    i1 := array_position(v_headers, s.key_col1);
    i2 := CASE WHEN s.key_strategy = 'id_at_run' THEN array_position(v_headers, s.key_col2) END;

    -- 3. every row: shape, cell size, key (fixed CASE logic, no dynamic SQL)
    FOR r IN SELECT e FROM jsonb_array_elements(v_rows) WITH ORDINALITY AS x(e, o) ORDER BY o LOOP
      IF jsonb_typeof(r) <> 'object' OR (SELECT count(*) FROM jsonb_object_keys(r)) <> 2
         OR jsonb_typeof(r->'r') <> 'number' OR jsonb_typeof(r->'c') <> 'array'
         OR (r->>'r') !~ '^[0-9]{1,7}$' OR (r->>'r')::integer < 2 THEN
        RAISE EXCEPTION 'a row is not {r: sheet row >= 2, c: [cells]}';
      END IF;
      IF jsonb_array_length(r->'c') <> v_ncol THEN
        RAISE EXCEPTION 'row %: has % cells, headers have %', r->>'r', jsonb_array_length(r->'c'), v_ncol;
      END IF;
      IF EXISTS (SELECT 1 FROM jsonb_array_elements(r->'c') e WHERE jsonb_typeof(e) <> 'string') THEN
        RAISE EXCEPTION 'row %: cells must be text', r->>'r';
      END IF;
      v_cells := ARRAY(SELECT e FROM jsonb_array_elements_text(r->'c') WITH ORDINALITY AS x(e, o) ORDER BY o);
      IF EXISTS (SELECT 1 FROM unnest(v_cells) c WHERE char_length(c) > 50000) THEN
        RAISE EXCEPTION 'size limit: cell (row % has a cell over 50,000 characters)', r->>'r';
      END IF;
      CONTINUE WHEN NOT EXISTS (SELECT 1 FROM unnest(v_cells) c WHERE c <> '');   -- fully blank row: not data
      v_key := CASE s.key_strategy
        WHEN 'single_column' THEN nullif(v_cells[i1], '')
        WHEN 'id_at_run' THEN CASE WHEN coalesce(v_cells[i1], '') = '' OR coalesce(v_cells[i2], '') = '' THEN NULL
                                   ELSE v_cells[i1] || '@' || v_cells[i2] END
      END;
      IF v_key IS NULL THEN RAISE EXCEPTION 'row %: no key (cells but no full key)', r->>'r'; END IF;
      IF v_key !~ s.key_pattern THEN RAISE EXCEPTION 'row %: key % does not match the key pattern', r->>'r', left(v_key, 100); END IF;
      v_keys := v_keys || v_key;
      v_srows := v_srows || (r->>'r')::integer;
      v_raws := v_raws || jsonb_object(v_headers, v_cells);
    END LOOP;
    SELECT k INTO v_dup FROM unnest(v_srows) k GROUP BY k HAVING count(*) > 1 ORDER BY k LIMIT 1;
    IF v_dup IS NOT NULL THEN RAISE EXCEPTION 'duplicate sheet row %', v_dup; END IF;
    SELECT k INTO v_dup FROM unnest(v_keys) k GROUP BY k HAVING count(*) > 1 ORDER BY k COLLATE "C" LIMIT 1;
    IF v_dup IS NOT NULL THEN RAISE EXCEPTION 'duplicate key %', v_dup; END IF;

    v_nrows := cardinality(v_keys);
    v_hash := research.utf8_sha256(jsonb_build_array(v_hjson, v_rows)::text);
    v_keyset := research.utf8_sha256(coalesce((SELECT string_agg(k, E'\n' ORDER BY k COLLATE "C") FROM unnest(v_keys) k), ''));
    v_base := (SELECT max(b.batch_id) FROM research.import_batch b WHERE b.unit_id = 'TAB-' || v_tab AND b.city_id = 'nyc' AND b.state = 'applied');

    -- 4. ALREADY first (S3, T2): this exact copy was accepted tonight, inside 12 hours, not undone, not superseded
    IF EXISTS (SELECT 1 FROM research.nightly_run n
               WHERE n.copy_id = v_copy AND n.tab = v_tab AND n.status IN ('PASS','ALREADY','NOTHING_NEW')
                 AND n.payload_sha256 = v_hash AND n.export_group = v_group AND n.copy_utc = v_copy_utc
                 AND v_copy_utc >= now() - interval '12 hours'
                 AND (n.base_batch_id IS NULL OR EXISTS (SELECT 1 FROM research.import_batch b WHERE b.batch_id = n.base_batch_id AND b.state = 'applied'))
                 AND NOT EXISTS (SELECT 1 FROM research.nightly_run m WHERE m.tab = v_tab AND m.status IN ('PASS','ALREADY','NOTHING_NEW')
                                 AND m.copy_utc > n.copy_utc)) THEN
      v_status := 'ALREADY';
    ELSE
      IF EXISTS (SELECT 1 FROM research.nightly_run n WHERE n.copy_id = v_copy AND n.tab = v_tab AND n.payload_sha256 <> v_hash) THEN
        RAISE EXCEPTION 'same copy_id % with a different payload', v_copy;
      END IF;
      IF v_copy_utc > now() + interval '10 minutes' OR v_copy_utc < now() - interval '12 hours' THEN
        RAISE EXCEPTION 'copy time % is outside 10 minutes ahead to 12 hours behind the database clock', v_copy_utc;
      END IF;
      -- the night is the New York date of the copy, so no row can be filed under another night (review M2)
      IF v_group <> (v_copy_utc AT TIME ZONE 'America/New_York')::date THEN
        RAISE EXCEPTION 'export_group % is not the New York date of copy_utc (%)', v_group, (v_copy_utc AT TIME ZONE 'America/New_York')::date;
      END IF;
      v_newest := (SELECT max(n.copy_utc) FROM research.nightly_run n WHERE n.tab = v_tab AND n.status IN ('PASS','ALREADY','NOTHING_NEW'));
      IF v_newest IS NOT NULL AND v_copy_utc <= v_newest THEN
        RAISE EXCEPTION 'copy % is older than (or as old as) the newest accepted copy (%)', v_copy_utc, v_newest;
      END IF;
      -- 5. no open batch from another path (F7)
      v_open := (SELECT min(b.batch_id) FROM research.import_batch b WHERE b.state = 'open');
      IF v_open IS NOT NULL THEN RAISE EXCEPTION 'open batch % (another import is open; undo or finish it first)', v_open; END IF;
      -- 6. zero rows over live rows
      v_live := (SELECT count(*) FROM research.tab_row t WHERE t.city_id = 'nyc' AND t.tab = v_tab AND t.live);
      IF v_nrows = 0 AND v_live > 0 THEN RAISE EXCEPTION 'zero rows over % live rows', v_live; END IF;
      -- 7. removed keys need an unused approval from the batch they are live in
      v_removed := ARRAY(SELECT t.row_key FROM research.tab_row t WHERE t.city_id = 'nyc' AND t.tab = v_tab AND t.live
                         AND NOT (t.row_key = ANY (v_keys)) ORDER BY t.row_key COLLATE "C");
      v_missing := ARRAY(SELECT t.row_key FROM research.tab_row t WHERE t.city_id = 'nyc' AND t.tab = v_tab AND t.live
                         AND t.row_key = ANY (v_removed)
                         AND NOT EXISTS (SELECT 1 FROM research.removal_approval a WHERE a.city_id = 'nyc' AND a.tab = v_tab
                                         AND a.row_key = t.row_key AND a.live_batch_id = t.import_batch_id AND a.used_by_batch_id IS NULL)
                         ORDER BY t.row_key COLLATE "C");
      IF cardinality(v_missing) > 0 THEN
        RAISE EXCEPTION 'removed keys without approval: %', left(array_to_string(v_missing, ', '), 1500);
      END IF;
      -- rows that are new or changed (compared by content only; a moved row is not a change, A1 13q)
      v_changed := ARRAY(SELECT x.k FROM unnest(v_keys, v_raws) AS x(k, raw)
                         WHERE NOT EXISTS (SELECT 1 FROM research.tab_row t WHERE t.city_id = 'nyc' AND t.tab = v_tab AND t.live
                                           AND t.row_key = x.k AND t.row_raw = x.raw));
      IF cardinality(v_changed) = 0 AND cardinality(v_removed) = 0 THEN
        v_status := 'NOTHING_NEW';
      ELSE
        -- 9. the import, same snapshot rules as plan 40
        v_batch := research.begin_import('nyc', 'TAB-' || v_tab,
          jsonb_build_object('tabs', jsonb_build_object(v_tab, to_jsonb(v_keys)), 'headers', jsonb_build_object(v_tab, v_hjson),
                             'nightly', jsonb_build_object('copy_id', v_copy, 'export_group', v_group, 'payload_sha256', v_hash)),
          v_copy_utc);
        UPDATE research.tab_row t SET live = false, superseded_by_batch_id = v_batch
         WHERE t.city_id = 'nyc' AND t.tab = v_tab AND t.live AND t.row_key = ANY (v_changed);
        UPDATE research.tab_row t SET live = false, removed_from_tab = true, superseded_by_batch_id = v_batch
         WHERE t.city_id = 'nyc' AND t.tab = v_tab AND t.live AND t.row_key = ANY (v_removed);
        UPDATE research.removal_approval a SET used_by_batch_id = v_batch, used_utc = now()
         WHERE a.city_id = 'nyc' AND a.tab = v_tab AND a.used_by_batch_id IS NULL AND a.row_key = ANY (v_removed)
           AND a.approval_id IN (SELECT DISTINCT ON (a2.row_key) a2.approval_id FROM research.removal_approval a2
                                 JOIN research.tab_row t ON t.row_key = a2.row_key AND t.import_batch_id = a2.live_batch_id
                                  AND t.tab = v_tab AND t.superseded_by_batch_id = v_batch
                                 WHERE a2.tab = v_tab AND a2.used_by_batch_id IS NULL ORDER BY a2.row_key, a2.approval_id);
        INSERT INTO research.tab_row (city_id, import_batch_id, tab, row_key, sheet_row, row_raw)
        SELECT 'nyc', v_batch, v_tab, x.k, x.sr, x.raw FROM unnest(v_keys, v_srows, v_raws) AS x(k, sr, raw) WHERE x.k = ANY (v_changed);
        v_counts := research.finish_import(v_batch) || jsonb_build_object('batch_id', v_batch, 'removed', cardinality(v_removed));
        v_base := v_batch;
        v_status := 'PASS';
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- 10. everything above is rolled back (rows retired, batch opened, lock); log and answer normally
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_msg = MESSAGE_TEXT;
    v_status := 'STOPPED';
    v_reason := left(CASE WHEN v_state = '55P03' THEN 'lock wait: ' ELSE '' END || v_msg, 2000);
    v_batch := NULL; v_base := NULL; v_counts := NULL;
    IF v_msg NOT LIKE 'removed keys without approval%' THEN v_removed := NULL; END IF;
  END;

  INSERT INTO research.nightly_run (export_group, copy_id, copy_utc, tab, status, reason, counts, removed_keys, client_version,
                                    payload_sha256, row_count, keyset_sha256, base_batch_id, batch_id)
  VALUES (v_group, left(v_copy, 200), v_copy_utc, left(v_tab, 40), v_status, v_reason, v_counts, v_removed, v_version,
          v_hash, v_nrows, v_keyset, v_base, v_batch);
  RETURN jsonb_strip_nulls(jsonb_build_object('status', v_status, 'reason', v_reason, 'counts', v_counts,
         'removed_keys', CASE WHEN v_status = 'STOPPED' THEN to_jsonb(v_removed) END));
END $$;

-- api.record_result: WAIT, SKIPPED and FAIL for any mix of tabs in ONE call. Good statuses are refused.
CREATE FUNCTION api.record_result(export_group date, entries jsonb, client_version text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, research, pg_temp SET lock_timeout = '3s' AS $$
DECLARE v_group date := record_result.export_group; v_entries jsonb := record_result.entries;
  v_version text := left(record_result.client_version, 100); v_limit text; v_reason text; e jsonb; v_n integer := 0;
BEGIN
  v_limit := current_setting('statement_timeout');
  IF v_limit = '0' THEN v_reason := 'time limit missing: 0';
  ELSIF v_limit::interval > interval '15 seconds' THEN v_reason := 'time limit too long: ' || v_limit;
  ELSIF coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb->>'sub' IS DISTINCT FROM 'nightly-export' THEN
    v_reason := 'token sub is not nightly-export';
  END IF;
  IF v_reason IS NOT NULL THEN
    INSERT INTO research.nightly_run (export_group, tab, status, reason, client_version) VALUES (v_group, NULL, 'STOPPED', v_reason, v_version);
    RETURN jsonb_build_object('status', 'STOPPED', 'reason', v_reason);
  END IF;
  IF v_group IS NULL OR jsonb_typeof(v_entries) IS DISTINCT FROM 'array' OR jsonb_array_length(v_entries) NOT BETWEEN 1 AND 60 THEN
    RAISE EXCEPTION 'record_result: export_group and 1-60 entries are required';
  END IF;
  IF v_group <> (now() AT TIME ZONE 'America/New_York')::date THEN
    RAISE EXCEPTION 'record_result: export_group % is not tonight (New York date %)', v_group, (now() AT TIME ZONE 'America/New_York')::date;
  END IF;
  FOR e IN SELECT x FROM jsonb_array_elements(v_entries) x LOOP
    IF coalesce(e->>'status', '') NOT IN ('WAIT','SKIPPED','FAIL') THEN
      RAISE EXCEPTION 'record_result: status % refused (only WAIT, SKIPPED, FAIL)', left(coalesce(e->>'status', 'none'), 20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM research.tab_schema s WHERE s.tab = e->>'tab') THEN
      RAISE EXCEPTION 'record_result: tab % is not on the list', left(coalesce(e->>'tab', 'none'), 40);
    END IF;
    INSERT INTO research.nightly_run (export_group, tab, status, reason, client_version)
    VALUES (v_group, e->>'tab', e->>'status', left(e->>'message', 2000), v_version);
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('status', 'LOGGED', 'count', v_n);
END $$;

-- api.tonight: read-only. For each enabled tab: tonight's status (latest good row wins; an undone base batch
-- shows UNDONE, never an older good row), last good time and hours since; plus open batches over 2 hours.
CREATE FUNCTION api.tonight()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, research, pg_temp AS $$
  WITH g AS (SELECT (now() AT TIME ZONE 'America/New_York')::date AS d),
  per AS (
    SELECT s.tab,
      (SELECT n FROM research.nightly_run n, g WHERE n.tab = s.tab AND n.export_group = g.d AND n.status IN ('PASS','ALREADY','NOTHING_NEW')
        ORDER BY n.copy_utc DESC, n.run_row_id DESC LIMIT 1) AS good,
      (SELECT n FROM research.nightly_run n, g WHERE n.tab = s.tab AND n.export_group = g.d ORDER BY n.run_row_id DESC LIMIT 1) AS last,
      (SELECT max(n.logged_utc) FROM research.nightly_run n WHERE n.tab = s.tab AND n.status IN ('PASS','ALREADY','NOTHING_NEW')
          AND (n.base_batch_id IS NULL OR EXISTS (SELECT 1 FROM research.import_batch b WHERE b.batch_id = n.base_batch_id AND b.state = 'applied'))) AS last_good
    FROM research.tab_schema s WHERE s.enabled)
  SELECT jsonb_build_object(
    'export_group', (SELECT d FROM g),
    'now_utc', now(),
    'statement_timeout', current_setting('statement_timeout'),
    'tabs', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'tab', p.tab,
        'status', CASE WHEN (p.good).run_row_id IS NOT NULL THEN
                         CASE WHEN (p.good).base_batch_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM research.import_batch b
                                     WHERE b.batch_id = (p.good).base_batch_id AND b.state = 'applied') THEN 'UNDONE'
                              ELSE (p.good).status END
                       WHEN (p.last).run_row_id IS NOT NULL THEN (p.last).status
                       ELSE 'MISSING' END,
        'reason', CASE WHEN (p.good).run_row_id IS NULL THEN (p.last).reason END,
        'copy_id', (p.good).copy_id,
        'last_good_utc', p.last_good,
        'hours_since_good', round((extract(epoch FROM now() - p.last_good) / 3600)::numeric, 2)) ORDER BY p.tab) FROM per p), '[]'::jsonb),
    'open_batches', coalesce((SELECT jsonb_agg(jsonb_build_object('batch_id', b.batch_id, 'unit_id', b.unit_id, 'started_utc', b.started_utc,
        'hours_open', round((extract(epoch FROM now() - b.started_utc) / 3600)::numeric, 2)) ORDER BY b.batch_id)
      FROM research.import_batch b WHERE b.state = 'open' AND b.started_utc < now() - interval '2 hours'), '[]'::jsonb))
$$;

-- grants before the ownership transfer (F8): nobody but nyc_loader may run the door
REVOKE ALL ON FUNCTION api.put_tab(date, text, timestamptz, text, text, jsonb, jsonb), api.record_result(date, jsonb, text), api.tonight() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api.put_tab(date, text, timestamptz, text, text, jsonb, jsonb), api.record_result(date, jsonb, text), api.tonight() TO nyc_loader;
ALTER FUNCTION api.put_tab(date, text, timestamptz, text, text, jsonb, jsonb) OWNER TO nyc_door;
ALTER FUNCTION api.record_result(date, jsonb, text) OWNER TO nyc_door;
ALTER FUNCTION api.tonight() OWNER TO nyc_door;
GRANT USAGE ON SCHEMA api TO nyc_loader, nyc_door;

-- end of the temporary rights
REVOKE CREATE ON SCHEMA api FROM nyc_door;
-- removes only the grant made above; a non-superuser owner keeps the ADMIN it got by creating the role (review m2)
REVOKE nyc_door FROM CURRENT_USER;

INSERT INTO core.schema_migrations (version, note) VALUES ('0006', 'nightly door: api schema, tab_schema, nightly_run (plan 47)');
COMMIT;
