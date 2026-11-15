-- 0005: plan 40 (import build). New file kinds and retries, tabs INDEX and STORY_TEXT, and read-only views
-- for story readiness and INDEX/packet agreement. Changes no functions (0004's SECURITY DEFINER and
-- search_path settings stay as they are) and grants nothing new. The lists here must equal lib.mjs
-- (a test compares them). 0003's unnamed checks are found by their definition in pg_constraint.
BEGIN;

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0004') THEN RAISE EXCEPTION '0004 not applied'; END IF;
  IF EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0005') THEN RAISE EXCEPTION '0005 already applied'; END IF;
  IF current_user::text <> (SELECT nspowner::regrole::text FROM pg_namespace WHERE nspname = 'research') THEN
    RAISE EXCEPTION 'run 0005 as the owner of schema research';
  END IF;
END$$;

-- drop each 0003 check this replaces, found by its exact full definition; stop unless exactly one matches (schema drift)
DO $$DECLARE r record; n int;
BEGIN
  FOR r IN SELECT * FROM (VALUES
      ('research.import_batch', $d$CHECK ((unit_id ~ '^(MN[0-9]{2}-[0-9]{4}|US-[0-9]{4}|ST-(SQ|N|S|E|W)-[0-9]{4}|TAB-(STORIES|DELIGHTS))$'::text))$d$),
      ('research.tab_row',      $d$CHECK ((tab = ANY (ARRAY['STORIES'::text, 'DELIGHTS'::text])))$d$),
      ('research.tab_row',      $d$CHECK ((((tab = 'STORIES'::text) AND (row_key ~ '^ST[0-9]{3,}$'::text) AND (NOT (row_key IS DISTINCT FROM (row_raw ->> 'story_id'::text)))) OR ((tab = 'DELIGHTS'::text) AND (row_key ~ '^D[0-9]{3,}$'::text) AND (NOT (row_key IS DISTINCT FROM (row_raw ->> 'delight_id'::text))))))$d$)
    ) AS v(tbl, def) LOOP
    SELECT count(*) INTO n FROM pg_constraint WHERE conrelid = r.tbl::regclass AND contype = 'c' AND pg_get_constraintdef(oid) = r.def;
    IF n <> 1 THEN RAISE EXCEPTION '0005: expected one check on % exactly as 0003 made it, found %; nothing changed', r.tbl, n; END IF;
    EXECUTE (SELECT format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, conname) FROM pg_constraint
             WHERE conrelid = r.tbl::regclass AND contype = 'c' AND pg_get_constraintdef(oid) = r.def);
  END LOOP;
END$$;

ALTER TABLE research.import_batch ADD CONSTRAINT import_batch_unit_check_0005
  CHECK (unit_id ~ '^(MN[0-9]{2}-[0-9]{4}|US-[0-9]{4}|ST-(SQ|N|S|E|W)-[0-9]{4}|TAB-(STORIES|DELIGHTS|INDEX|STORY_TEXT))$');
ALTER TABLE research.tab_row ADD CONSTRAINT tab_row_tab_check_0005 CHECK (tab IN ('STORIES','DELIGHTS','INDEX','STORY_TEXT'));
-- IS NOT DISTINCT FROM: a row with no id key must fail, not slip through as NULL
ALTER TABLE research.tab_row ADD CONSTRAINT tab_row_key_check_0005 CHECK (
     (tab = 'STORIES'    AND row_key ~ '^ST[0-9]{3,}$' AND row_key IS NOT DISTINCT FROM row_raw->>'story_id')
  OR (tab = 'DELIGHTS'   AND row_key ~ '^D[0-9]{3,}$'  AND row_key IS NOT DISTINCT FROM row_raw->>'delight_id')
  OR (tab = 'INDEX'      AND row_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND row_key IS NOT DISTINCT FROM row_raw->>'candidate_id')
  OR (tab = 'STORY_TEXT' AND row_raw->>'story_id' ~ '^ST[0-9]{3,}$' AND row_raw->>'run_id' ~ '^run-[0-9]{8}T[0-9]{6}Z$'
      AND row_key IS NOT DISTINCT FROM (row_raw->>'story_id') || '@' || (row_raw->>'run_id')));

ALTER TABLE research.run_file DROP CONSTRAINT run_file_kind_check;
ALTER TABLE research.run_file ADD CONSTRAINT run_file_kind_check CHECK (kind IN
  ('packets','notes','sources','skeptic','story-claims','story-fragments','story-skeptic','story-notes',
   'story-sources','story-existing','blind','check'));
ALTER TABLE research.run_file DROP CONSTRAINT run_file_retry_check;
ALTER TABLE research.run_file ADD CONSTRAINT run_file_retry_check
  CHECK (retry = (file_name LIKE '%-retry.md') AND (NOT retry OR kind IN ('skeptic','story-skeptic','story-fragments','blind','check','sources')));

-- ---------- views (live rows of applied batches only, like 0003's) ----------
CREATE VIEW research.story_text AS
SELECT t.tab_row_id, t.import_batch_id, t.sheet_row,
  t.row_raw->>'story_id' AS story_id, t.row_raw->>'run_id' AS run_id, t.row_raw->>'lead_id' AS lead_id,
  t.row_raw->>'story_text' AS story_text, t.row_raw->>'date_note' AS date_note,
  t.row_raw->>'style_check' AS style_check, t.row_raw->>'followup_status' AS followup_status,
  -- the stamp is UTC whatever the session time zone ('Z' read by the timestamptz input)
  (substr(t.row_raw->>'run_id', 5, 15) || 'Z')::timestamptz AS run_time_utc,
  t.row_raw
FROM research.tab_row t JOIN research.import_batch b ON b.batch_id = t.import_batch_id AND b.state = 'applied'
WHERE t.tab = 'STORY_TEXT' AND t.live;

-- newest text row per story: by run time; sheet row only breaks ties
CREATE VIEW research.story_text_newest AS
SELECT DISTINCT ON (story_id) * FROM research.story_text ORDER BY story_id, run_time_utc DESC, sheet_row DESC;

CREATE VIEW research.story_readiness AS
SELECT s.story_id, s.tab_row_id, n.run_id AS text_run_id, n.style_check,
  CASE WHEN n.story_id IS NULL THEN 'no story text'
       WHEN coalesce(s.notes, '') ILIKE '%style fail%' THEN 'notes say style fail'
       WHEN coalesce(n.story_text, '') !~ '[^[:space:]]' THEN 'empty story text'   -- no visible character (tabs, newlines too)
       WHEN n.style_check = 'ok' THEN 'ready'
       ELSE n.style_check END AS reason
FROM research.story s LEFT JOIN research.story_text_newest n ON n.story_id = s.story_id
WHERE s.tier = 'delight';

-- the only stories a later promotion plan may read
CREATE VIEW research.story_ready AS
SELECT s.*, r.text_run_id FROM research.story s JOIN research.story_readiness r ON r.tab_row_id = s.tab_row_id WHERE r.reason = 'ready';
CREATE VIEW research.story_not_ready AS
SELECT story_id, tab_row_id, text_run_id, reason FROM research.story_readiness WHERE reason <> 'ready';
CREATE VIEW research.story_text_orphan AS
SELECT x.* FROM research.story_text x WHERE NOT EXISTS (SELECT 1 FROM research.story s WHERE s.story_id = x.story_id);

CREATE VIEW research.index_row AS
SELECT t.tab_row_id, t.import_batch_id, t.city_id, t.sheet_row, t.row_key AS candidate_id,
  t.row_raw->>'place_id' AS place_id, t.row_raw->>'name' AS name, t.row_raw->>'address_in_year' AS address_in_year,
  t.row_raw->>'cd' AS cd, t.row_raw->>'year' AS year, t.row_raw->>'disposition' AS disposition,
  t.row_raw->>'importance_suggested' AS importance_suggested, t.row_raw->>'unit_id' AS unit_id,
  t.row_raw->>'zone' AS zone, t.row_raw->>'interests' AS interests, t.row_raw->>'hold_reason' AS hold_reason,
  t.row_raw
FROM research.tab_row t JOIN research.import_batch b ON b.batch_id = t.import_batch_id AND b.state = 'applied'
WHERE t.tab = 'INDEX' AND t.live;

-- INDEX rows whose unit_id does not match their candidate_id (any disposition), plus rows graded A/B/C whose unit
-- has an applied batch, with no live packet or a live packet of another grade
CREATE VIEW research.index_packet_mismatch AS
SELECT i.candidate_id, i.unit_id, i.sheet_row, i.disposition AS index_grade, NULL::text AS packet_grade, NULL::text AS packet_run_id,
  'unit_id does not match candidate'::text AS problem
FROM research.index_row i
WHERE i.unit_id IS NULL OR i.unit_id !~ '^(MN[0-9]{2}-[0-9]{4}|US-[0-9]{4}|ST-(SQ|N|S|E|W)-[0-9]{4})$'
   OR NOT starts_with(i.candidate_id, lower(i.unit_id) || '-')
UNION ALL
SELECT i.candidate_id, i.unit_id, i.sheet_row, i.disposition AS index_grade, p.disposition_final::text AS packet_grade,
  p.run_id AS packet_run_id, CASE WHEN p.packet_row_id IS NULL THEN 'no live packet' ELSE 'grade differs' END AS problem
FROM research.index_row i
LEFT JOIN (SELECT p.* FROM research.packet p JOIN research.import_batch b ON b.batch_id = p.import_batch_id AND b.state = 'applied'
           WHERE p.review_state IN ('pending','promoted')) p ON p.candidate_id = i.candidate_id AND p.city_id = i.city_id
WHERE i.disposition IN ('A','B','C') AND i.unit_id ~ '^(MN[0-9]{2}-[0-9]{4}|US-[0-9]{4}|ST-(SQ|N|S|E|W)-[0-9]{4})$'
  AND starts_with(i.candidate_id, lower(i.unit_id) || '-')
  AND EXISTS (SELECT 1 FROM research.import_batch b WHERE b.unit_id = i.unit_id AND b.city_id = i.city_id AND b.state = 'applied')
  AND (p.packet_row_id IS NULL OR p.disposition_final::text IS DISTINCT FROM i.disposition);

INSERT INTO core.schema_migrations (version, note) VALUES ('0005', 'import build: new kinds, INDEX + STORY_TEXT tabs, story views (plan 40)');
COMMIT;
