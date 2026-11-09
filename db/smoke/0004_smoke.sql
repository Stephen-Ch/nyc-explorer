-- Smoke test for 0004 (importer role). Run only on a local database or a throwaway Neon branch, never on production.
-- Needs psql: part 2 logs in AS the importer (\connect), so session_user really is the importer.
-- Locally: psql -v ON_ERROR_STOP=1 -d <db> -f db/smoke/0004_smoke.sql   (importer needs a way to log in; local trust auth is fine)
-- Ends with 'ALL PASS' only if every check passed. Both parts end in ROLLBACK, so nothing is left behind.

-- ===================== part 1: as the owner =====================
BEGIN;
DO $$DECLARE owner_name text := (SELECT nspowner::regrole::text FROM pg_namespace WHERE nspname = 'research');
  r record; fn text; c jsonb; bt bigint;
BEGIN
  PERFORM 1 FROM core.schema_migrations WHERE version = '0004';
  IF NOT FOUND THEN RAISE EXCEPTION '0004 row missing'; END IF;

  -- the role: can log in, nothing else, member of nothing
  SELECT * INTO r FROM pg_roles WHERE rolname = 'importer';
  IF NOT FOUND THEN RAISE EXCEPTION 'role importer missing'; END IF;
  IF NOT r.rolcanlogin OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls THEN
    RAISE EXCEPTION 'importer has wrong attributes';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE member = 'importer'::regrole) THEN
    RAISE EXCEPTION 'importer is a member of another role';
  END IF;
  RAISE NOTICE 'PASS role attributes';

  -- functions: definer + fixed search_path where the plan says so
  FOREACH fn IN ARRAY ARRAY['research.begin_import(text,text,jsonb,timestamptz)', 'research.finish_import(bigint)',
                            'research.guard_row()', 'research.guard_lock()'] LOOP
    IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = fn::regprocedure) THEN RAISE EXCEPTION '% is not SECURITY DEFINER', fn; END IF;
  END LOOP;
  FOR r IN SELECT p.oid::regprocedure AS f, p.proconfig FROM pg_proc p WHERE p.pronamespace = 'research'::regnamespace LOOP
    IF NOT ('search_path=pg_catalog, pg_temp' = ANY (coalesce(r.proconfig, '{}'))) THEN
      RAISE EXCEPTION '% has no fixed search_path', r.f;
    END IF;
  END LOOP;
  IF (SELECT prosecdef FROM pg_proc WHERE oid = 'research.undo_import(bigint)'::regprocedure) THEN
    RAISE EXCEPTION 'undo_import must not be SECURITY DEFINER';
  END IF;
  -- EXECUTE: importer exactly these four; PUBLIC none
  FOR r IN SELECT p.oid::regprocedure AS f, p.proname FROM pg_proc p WHERE p.pronamespace = 'research'::regnamespace LOOP
    IF has_function_privilege('public', r.f, 'EXECUTE') THEN RAISE EXCEPTION 'PUBLIC can execute %', r.f; END IF;
    IF has_function_privilege('importer', r.f, 'EXECUTE')
       <> (r.proname IN ('begin_import','finish_import','utf8_sha256','has_blank_key')) THEN
      RAISE EXCEPTION 'importer EXECUTE on % is wrong', r.f;
    END IF;
  END LOOP;
  RAISE NOTICE 'PASS functions';

  -- schemas and tables
  IF has_schema_privilege('importer', 'core', 'USAGE') OR NOT has_schema_privilege('importer', 'research', 'USAGE')
     OR has_schema_privilege('importer', 'research', 'CREATE') THEN RAISE EXCEPTION 'schema rights wrong'; END IF;
  FOR r IN SELECT c2.oid::regclass AS t, c2.relname FROM pg_class c2
           WHERE c2.relnamespace = 'research'::regnamespace AND c2.relkind IN ('r','v') LOOP
    IF has_table_privilege('importer', r.t, 'SELECT') <> (r.relname IN ('import_batch','run_file','packet','tab_row')) THEN
      RAISE EXCEPTION 'SELECT on % is wrong', r.t; END IF;
    IF has_table_privilege('importer', r.t, 'DELETE') OR has_table_privilege('importer', r.t, 'TRUNCATE')
       OR has_table_privilege('importer', r.t, 'REFERENCES') OR has_table_privilege('importer', r.t, 'TRIGGER') THEN
      RAISE EXCEPTION 'importer has DELETE/TRUNCATE/REFERENCES/TRIGGER on %', r.t; END IF;
  END LOOP;
  -- column rights, exactly
  FOR r IN SELECT a.attrelid::regclass AS t, c2.relname AS tn, a.attname AS col FROM pg_attribute a JOIN pg_class c2 ON c2.oid = a.attrelid
           WHERE c2.relnamespace = 'research'::regnamespace AND c2.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped LOOP
    IF has_column_privilege('importer', r.t, r.col, 'INSERT') <> (
         (r.tn = 'run_file' AND r.col IN ('city_id','run_id','unit_id','kind','drive_file_id','content','import_batch_id',
                                          'file_name','retry','drive_md5','drive_revision','drive_modified_utc','sha256'))
      OR (r.tn = 'packet'   AND r.col IN ('city_id','candidate_id','unit_id','run_id','drive_file_id','packet','import_batch_id',
                                          'run_file_id','line_no','place_id_db','disposition_final','skeptic_changed'))
      OR (r.tn = 'tab_row'  AND r.col IN ('city_id','import_batch_id','tab','row_key','sheet_row','row_raw'))) THEN
      RAISE EXCEPTION 'INSERT on %.% is wrong', r.tn, r.col; END IF;
    IF has_column_privilege('importer', r.t, r.col, 'UPDATE') <> (
         (r.tn = 'packet'  AND r.col IN ('review_state','superseded_by_batch_id'))
      OR (r.tn = 'tab_row' AND r.col IN ('live','removed_from_tab','superseded_by_batch_id'))) THEN
      RAISE EXCEPTION 'UPDATE on %.% is wrong', r.tn, r.col; END IF;
  END LOOP;
  RAISE NOTICE 'PASS table and column rights';

  -- the owner can still begin and undo (undo stays owner-only, used through the connector)
  IF session_user::text <> owner_name THEN RAISE EXCEPTION 'part 1 must run as the owner %', owner_name; END IF;
  bt := research.begin_import('nyc','US-1902','{}', now());
  c := research.undo_import(bt);
  IF (SELECT state FROM research.import_batch WHERE batch_id = bt) <> 'failed' THEN RAISE EXCEPTION 'owner undo failed'; END IF;
  PERFORM set_config('research.in_undo', 'on', true);
  IF NOT research.in_undo() THEN RAISE EXCEPTION 'owner in_undo broken'; END IF;
  RAISE NOTICE 'PASS owner undo';
END$$;
ROLLBACK;

-- ===================== part 2: logged in as the importer =====================
\connect - importer
BEGIN;
CREATE FUNCTION pg_temp.expect_fail(q text, msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE q;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%' || msg || '%' THEN RAISE EXCEPTION 'expected "%", got "%" from: %', msg, SQLERRM, q; END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'should have failed (%): %', msg, q;
END $$;

DO $$DECLARE b1 bigint; b2 bigint; bt bigint; f1 bigint; f2 bigint; c jsonb;
  j1 text := '{"candidate_id":"us-1852-smoke-a"}' || chr(10) || '{"candidate_id":"us-1852-smoke-b"}' || chr(10);
  j2 text := '{"candidate_id":"us-1852-smoke-a","n":2}';
  ins_file text := $q$INSERT INTO research.run_file (city_id,run_id,unit_id,kind,drive_file_id,content,import_batch_id,file_name,drive_md5,drive_modified_utc,sha256,retry) VALUES ('nyc',%L,'US-1852','packets',%L,%L,%s,%L,%L,now(),%L,false)$q$;
  ins_pk text := $q$INSERT INTO research.packet (city_id,candidate_id,unit_id,run_id,drive_file_id,packet,import_batch_id,run_file_id,line_no,disposition_final,skeptic_changed,place_id_db) VALUES ('nyc',%L,'US-1852',%L,%L,%L,%s,%s,%s,%L,%L,%L)$q$;
BEGIN
  IF session_user::text <> 'importer' THEN RAISE EXCEPTION 'part 2 must run logged in as importer'; END IF;

  -- ===== a good import, as the importer =====
  b1 := research.begin_import('nyc','US-1852', jsonb_build_object('files', jsonb_build_object(
          'd-j1', jsonb_build_object('sha256', research.utf8_sha256(j1), 'lines', 2))), now());
  EXECUTE format(ins_file,'run-20261104T080254Z','d-j1',j1,b1,'US-1852__run-20261104T080254Z.jsonl',repeat('a',32),research.utf8_sha256(j1));
  SELECT run_file_id INTO f1 FROM research.run_file WHERE drive_file_id = 'd-j1';
  EXECUTE format(ins_pk,'us-1852-smoke-a','run-20261104T080254Z','d-j1','{"candidate_id":"us-1852-smoke-a"}',b1,f1,1,'A',NULL,'nyc-smoke-a');
  EXECUTE format(ins_pk,'us-1852-smoke-b','run-20261104T080254Z','d-j1','{"candidate_id":"us-1852-smoke-b"}',b1,f1,2,NULL,'dropped',NULL);
  -- read-back works
  IF (SELECT count(*) FROM research.packet WHERE import_batch_id = b1) <> 2 THEN RAISE EXCEPTION 'read-back failed'; END IF;
  c := research.finish_import(b1);
  IF (c->>'packets')::int <> 2 THEN RAISE EXCEPTION 'finish counts wrong: %', c; END IF;

  -- supersede in a second batch (supersede first, then insert)
  b2 := research.begin_import('nyc','US-1852', jsonb_build_object('files', jsonb_build_object(
          'd-j2', jsonb_build_object('sha256', research.utf8_sha256(j2), 'lines', 1))), now());
  EXECUTE format(ins_file,'run-20261104T100156Z','d-j2',j2,b2,'US-1852__run-20261104T100156Z.jsonl',repeat('c',32),research.utf8_sha256(j2));
  SELECT run_file_id INTO f2 FROM research.run_file WHERE drive_file_id = 'd-j2';
  UPDATE research.packet SET review_state = 'superseded', superseded_by_batch_id = b2 WHERE candidate_id = 'us-1852-smoke-a' AND review_state = 'pending';
  EXECUTE format(ins_pk,'us-1852-smoke-a','run-20261104T100156Z','d-j2',j2,b2,f2,1,'B',NULL,'nyc-smoke-a');
  PERFORM research.finish_import(b2);
  RAISE NOTICE 'PASS importer good import and supersede';

  -- ===== tabs: import, then retire one row as removed =====
  bt := research.begin_import('nyc','TAB-STORIES','{"tabs":{"STORIES":["ST001","ST002"]},"headers":{"STORIES":["story_id","hook (fresh wording)"]}}', now());
  INSERT INTO research.tab_row (city_id,import_batch_id,tab,row_key,sheet_row,row_raw) VALUES
    ('nyc',bt,'STORIES','ST001',2,'{"story_id":"ST001","hook (fresh wording)":"one"}'),
    ('nyc',bt,'STORIES','ST002',3,'{"story_id":"ST002","hook (fresh wording)":"two"}');
  PERFORM research.finish_import(bt);
  bt := research.begin_import('nyc','TAB-STORIES','{"tabs":{"STORIES":["ST001"]},"headers":{"STORIES":["story_id","hook (fresh wording)"]}}', now());
  UPDATE research.tab_row SET live = false, removed_from_tab = true, superseded_by_batch_id = bt WHERE row_key = 'ST002' AND live;
  PERFORM research.finish_import(bt);
  RAISE NOTICE 'PASS importer tab import and removal';

  -- ===== refusals =====
  -- setting research.in_undo by hand gives no bypass
  PERFORM set_config('research.in_undo', 'on', true);
  PERFORM pg_temp.expect_fail($q$UPDATE research.tab_row SET live = true, removed_from_tab = false, superseded_by_batch_id = NULL WHERE row_key = 'ST002'$q$,
                              'removed_from_tab changes only');   -- this guard is skipped only when in_undo() is true
  PERFORM pg_temp.expect_fail($q$UPDATE research.packet SET review_state = 'pending', superseded_by_batch_id = NULL WHERE review_state = 'superseded'$q$,
                              'may only go');   -- superseded -> pending is allowed only when in_undo() is true
  PERFORM pg_temp.expect_fail('DELETE FROM research.packet', 'permission denied');
  PERFORM pg_temp.expect_fail('DELETE FROM research.tab_row', 'permission denied');
  PERFORM set_config('research.in_undo', 'off', true);
  -- no undo, no internal functions
  PERFORM pg_temp.expect_fail(format('SELECT research.undo_import(%s)', bt), 'permission denied');
  PERFORM pg_temp.expect_fail('SELECT research.in_undo()', 'permission denied');
  PERFORM pg_temp.expect_fail('SELECT research.core_print()', 'permission denied');
  -- no core, no batch edits, no promotion, no views
  PERFORM pg_temp.expect_fail('SELECT count(*) FROM core.interest', 'permission denied');
  PERFORM pg_temp.expect_fail($q$INSERT INTO core.interest (slug,label) VALUES ('x','x')$q$, 'permission denied');
  PERFORM pg_temp.expect_fail($q$UPDATE research.import_batch SET state = 'applied' WHERE state = 'open'$q$, 'permission denied');
  PERFORM pg_temp.expect_fail($q$UPDATE research.import_batch SET note = 'x'$q$, 'permission denied');
  PERFORM pg_temp.expect_fail('INSERT INTO research.promotion DEFAULT VALUES', 'permission denied');
  PERFORM pg_temp.expect_fail('SELECT count(*) FROM research.v_promotable', 'permission denied');
  PERFORM pg_temp.expect_fail('SELECT count(*) FROM research.story', 'permission denied');
  -- columns outside the grants
  PERFORM pg_temp.expect_fail('UPDATE research.packet SET packet = packet', 'permission denied');
  PERFORM pg_temp.expect_fail('UPDATE research.packet SET promoted_utc = now()', 'permission denied');
  PERFORM pg_temp.expect_fail('UPDATE research.run_file SET content = content', 'permission denied');
  PERFORM pg_temp.expect_fail('UPDATE research.tab_row SET row_raw = row_raw', 'permission denied');
  bt := research.begin_import('nyc','US-1877', '{}', now());
  PERFORM pg_temp.expect_fail(format($q$INSERT INTO research.run_file (run_file_id,city_id,run_id,unit_id,kind,drive_file_id,content,import_batch_id,file_name,drive_md5,drive_modified_utc,sha256)
     OVERRIDING SYSTEM VALUE VALUES (999,'nyc','r','US-1877','notes','d-z','z',%s,'z.md',%L,now(),%L)$q$, bt, repeat('a',32), md5('')), 'permission denied');
  PERFORM pg_temp.expect_fail(format($q$INSERT INTO research.run_file (imported_utc,city_id,run_id,unit_id,kind,drive_file_id,content,import_batch_id,file_name,drive_md5,drive_modified_utc,sha256)
     VALUES ('2000-01-01','nyc','r','US-1877','notes','d-z','z',%s,'z.md',%L,now(),%L)$q$, bt, repeat('a',32), md5('')), 'permission denied');
  PERFORM pg_temp.expect_fail(format($q$INSERT INTO research.packet (review_state,city_id,candidate_id,unit_id,run_id,drive_file_id,packet,import_batch_id,run_file_id,line_no)
     VALUES ('promoted','nyc','us-1877-x','US-1877','r','d-z','{"candidate_id":"us-1877-x"}',%s,%s,1)$q$, bt, f1), 'permission denied');
  PERFORM pg_temp.expect_fail(format($q$INSERT INTO research.tab_row (live,city_id,import_batch_id,tab,row_key,sheet_row,row_raw)
     VALUES (false,'nyc',%s,'STORIES','ST003',4,'{"story_id":"ST003"}')$q$, bt), 'permission denied');
  -- the importer can't make itself something else
  PERFORM pg_temp.expect_fail(format('SET ROLE %I', (SELECT nspowner::regrole::text FROM pg_namespace WHERE nspname = 'research')), 'permission denied');
  PERFORM pg_temp.expect_fail('CREATE TABLE research.x (a int)', 'permission denied');
  RAISE NOTICE 'PASS importer refusals';
END$$;
ROLLBACK;


DO $$BEGIN RAISE NOTICE 'ALL PASS'; END$$;
