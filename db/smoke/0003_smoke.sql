-- Smoke test for 0003 v6. Run only on a throwaway Neon branch (try-0003) right after 0003, never on production.
-- Ends with 'ALL PASS' only if every check passed. Leaves nothing behind (ROLLBACK).
BEGIN;
DO $$BEGIN
  PERFORM 1 FROM core.schema_migrations WHERE version='0003';
  IF NOT FOUND THEN RAISE EXCEPTION '0003 row missing'; END IF;
  IF (SELECT count(*) FROM core.interest) <> 22 THEN RAISE EXCEPTION 'expected 22 interests'; END IF;
  IF EXISTS (SELECT 1 FROM core.interest WHERE slug='19th-century-history') THEN RAISE EXCEPTION '19th-century-history still there'; END IF;
  IF NOT EXISTS (SELECT 1 FROM core.interest WHERE slug='waterfront-maritime') THEN RAISE EXCEPTION 'new interest missing'; END IF;
  RAISE NOTICE 'PASS objects and interests';
END$$;

-- expect(sql, error-text): run sql; it must fail with an error whose message contains the text.
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
  sk text := 'ok é ü';
  ins_file text := $q$INSERT INTO research.run_file (city_id,run_id,unit_id,kind,drive_file_id,content,import_batch_id,file_name,drive_md5,drive_modified_utc,sha256,retry) VALUES ('nyc','run-20261104T080254Z',%L,%L,%L,%L,%s,%L,%L,now(),%L,%s)$q$;
  ins_pk text := $q$INSERT INTO research.packet (city_id,candidate_id,unit_id,run_id,drive_file_id,packet,import_batch_id,run_file_id,line_no,disposition_final,skeptic_changed) VALUES ('nyc',%L,'US-1852',%L,%L,%L,%s,%s,%s,%L,%L)$q$;
BEGIN
  -- ===== batch 1: one jsonl file with 2 lines, plus a skeptic retry file =====
  INSERT INTO core.city VALUES ('chi','Chicago',3435,'America/Chicago','chi-pin');
  b1 := research.begin_import('nyc','US-1852', jsonb_build_object('files', jsonb_build_object(
          'd-j1',  jsonb_build_object('sha256', research.utf8_sha256(j1), 'lines', 2),
          'd-s1r', jsonb_build_object('sha256', research.utf8_sha256(sk)))), now());
  PERFORM pg_temp.expect_fail($q$SELECT research.begin_import('nyc','US-1877','{}', now())$q$, 'another import batch is open');
  PERFORM pg_temp.expect_fail(format(ins_file,'US-1852','packets','d-x',j1,b1,'x.jsonl',repeat('a',32),repeat('0',64),'false'), 'run_file_sha256_check');
  PERFORM pg_temp.expect_fail(format(ins_file,'US-1852','packets','d-x',j1,b1,'x.jsonl',repeat('a',32),research.utf8_sha256(j1),'true'), 'run_file_retry_check');
  PERFORM pg_temp.expect_fail(format(ins_file,'US-1852','skeptic','d-x',sk,b1,'y__skeptic-1-retry.md',repeat('a',32),research.utf8_sha256(sk),'false'), 'run_file_retry_check');
  PERFORM pg_temp.expect_fail(format(ins_file,'MN01-1852','packets','d-x',j1,b1,'x.jsonl',repeat('a',32),research.utf8_sha256(j1),'false'), 'is not batch unit');
  PERFORM pg_temp.expect_fail(replace(format(ins_file,'US-1852','packets','d-x',j1,b1,'x.jsonl',repeat('a',32),research.utf8_sha256(j1),'false'), $q$('nyc',$q$, $q$('chi',$q$), 'is not batch city');
  EXECUTE format(ins_file,'US-1852','packets','d-j1',j1,b1,'US-1852__run-20261104T080254Z.jsonl',repeat('a',32),research.utf8_sha256(j1),'false');
  EXECUTE format(ins_file,'US-1852','skeptic','d-s1r',sk,b1,'US-1852__run-20261104T080254Z__skeptic-1-retry.md',repeat('b',32),research.utf8_sha256(sk),'true');
  SELECT run_file_id INTO f1 FROM research.run_file WHERE drive_file_id='d-j1';
  PERFORM pg_temp.expect_fail(format('UPDATE research.run_file SET kind=%L WHERE run_file_id=%s','notes',f1), 'run files never change');
  -- a pending packet needs a grade or a dropped mark (NULL must not slip through)
  PERFORM pg_temp.expect_fail(format(ins_pk,'us-1852-smoke-a','run-20261104T080254Z','d-j1','{"candidate_id":"us-1852-smoke-a"}',b1,f1,1,NULL,NULL), 'packet_disposition_check');
  -- a packet must match its file (wrong run id refused)
  PERFORM pg_temp.expect_fail(format(ins_pk,'us-1852-smoke-a','run-other','d-j1','{"candidate_id":"us-1852-smoke-a"}',b1,f1,1,'A',NULL), 'does not match its packets file');
  -- a tab row can't go in a unit batch
  PERFORM pg_temp.expect_fail(format($q$INSERT INTO research.tab_row (city_id,import_batch_id,tab,row_key,sheet_row,row_raw) VALUES ('nyc',%s,'STORIES','ST001',2,'{"story_id":"ST001"}')$q$, b1), 'TAB-STORIES batch');
  -- candidate column must equal the JSON, and belong to the batch unit
  PERFORM pg_temp.expect_fail(format(ins_pk,'us-1852-smoke-a','run-20261104T080254Z','d-j1','{"candidate_id":"us-1852-other"}',b1,f1,1,'A',NULL), 'packet_candidate_matches_json');
  PERFORM pg_temp.expect_fail(format(ins_pk,'us-1877-smoke-a','run-20261104T080254Z','d-j1','{"candidate_id":"us-1877-smoke-a"}',b1,f1,1,'A',NULL), 'does not belong to unit');
  PERFORM pg_temp.expect_fail(format(ins_pk,'us-1852-smoke-a','run-20261104T080254Z','d-j1','{"no_id":1}',b1,f1,1,'A',NULL), 'packet_candidate_matches_json');
  PERFORM pg_temp.expect_fail(format($q$INSERT INTO research.packet (city_id,candidate_id,unit_id,run_id,drive_file_id,packet,import_batch_id,run_file_id,line_no,review_state) VALUES ('nyc','us-1852-smoke-a','US-1852','run-20261104T080254Z','d-j1','{"candidate_id":"us-1852-smoke-a"}',%s,%s,1,'rejected')$q$, b1, f1), 'inserted live and pending');
  EXECUTE format(ins_pk,'us-1852-smoke-a','run-20261104T080254Z','d-j1','{"candidate_id":"us-1852-smoke-a"}',b1,f1,1,'A',NULL);
  -- forced failure: a missing line makes finish_import raise; the batch stays open
  PERFORM pg_temp.expect_fail(format('SELECT research.finish_import(%s)', b1), 'check 2 failed');
  -- a packet whose JSON differs from its line is caught
  EXECUTE format(ins_pk,'us-1852-smoke-b','run-20261104T080254Z','d-j1','{"candidate_id":"us-1852-smoke-b","x":1}',b1,f1,2,NULL,'dropped');
  PERFORM pg_temp.expect_fail(format('SELECT research.finish_import(%s)', b1), 'do not match its lines');
  PERFORM pg_temp.expect_fail('DELETE FROM research.packet WHERE line_no=2', 'removed only by research.undo_import');
  -- undo of an open batch with rows: everything goes, batch marked failed
  c := research.undo_import(b1);
  IF (c->>'packets_deleted')::int <> 2 OR (c->>'run_files_deleted')::int <> 2 THEN RAISE EXCEPTION 'open undo counts wrong: %', c; END IF;
  IF (SELECT state FROM research.import_batch WHERE batch_id=b1) <> 'failed' THEN RAISE EXCEPTION 'open batch not marked failed'; END IF;
  IF EXISTS (SELECT 1 FROM research.packet) OR EXISTS (SELECT 1 FROM research.run_file) THEN RAISE EXCEPTION 'forced failure left rows'; END IF;
  RAISE NOTICE 'PASS guards, forced failures, open-batch undo';

  -- ===== batch 1 again, correctly =====
  b1 := research.begin_import('nyc','US-1852', jsonb_build_object('files', jsonb_build_object(
          'd-j1',  jsonb_build_object('sha256', research.utf8_sha256(j1), 'lines', 2),
          'd-s1r', jsonb_build_object('sha256', research.utf8_sha256(sk)))), now());
  EXECUTE format(ins_file,'US-1852','packets','d-j1',j1,b1,'US-1852__run-20261104T080254Z.jsonl',repeat('a',32),research.utf8_sha256(j1),'false');
  -- check 1: a listed file that was not stored
  PERFORM pg_temp.expect_fail(format('SELECT research.finish_import(%s)', b1), 'check 1 failed');
  EXECUTE format(ins_file,'US-1852','skeptic','d-s1r',sk,b1,'US-1852__run-20261104T080254Z__skeptic-1-retry.md',repeat('b',32),research.utf8_sha256(sk),'true');
  SELECT run_file_id INTO f1 FROM research.run_file WHERE drive_file_id='d-j1';
  EXECUTE format(ins_pk,'us-1852-smoke-a','run-20261104T080254Z','d-j1','{"candidate_id":"us-1852-smoke-a"}',b1,f1,1,'A',NULL);
  EXECUTE format(ins_pk,'us-1852-smoke-b','run-20261104T080254Z','d-j1','{"candidate_id":"us-1852-smoke-b"}',b1,f1,2,NULL,'dropped');
  IF (SELECT count(*) FROM research.v_promotable) <> 0 THEN RAISE EXCEPTION 'open batch visible as promotable'; END IF;
  c := research.finish_import(b1);
  IF (c->>'packets')::int <> 2 THEN RAISE EXCEPTION 'expected 2 packets, got %', c; END IF;
  IF (SELECT count(*) FROM research.v_promotable) <> 1 THEN RAISE EXCEPTION 'dropped packet promotable, or A packet missing'; END IF;
  PERFORM pg_temp.expect_fail(format(ins_file,'US-1852','notes','d-late','x',b1,'late.md',repeat('a',32),research.utf8_sha256('x'),'false'), 'is not open');
  PERFORM pg_temp.expect_fail($q$UPDATE research.packet SET packet='{}' WHERE line_no=1$q$, 'never change');
  PERFORM pg_temp.expect_fail($q$UPDATE research.packet SET review_state='promoted', promoted_utc=now() WHERE line_no=1$q$, 'may only go');
  PERFORM pg_temp.expect_fail($q$UPDATE research.packet SET review_state='rejected' WHERE line_no=1$q$, 'may only go');
  -- a batch whose files were all imported before is a no-op and can't finish
  bt := research.begin_import('nyc','US-1852', jsonb_build_object('files', jsonb_build_object(
          'd-j1', jsonb_build_object('sha256', research.utf8_sha256(j1), 'lines', 2))), now());
  PERFORM pg_temp.expect_fail(format('SELECT research.finish_import(%s)', bt), 'check 0 failed');
  PERFORM research.undo_import(bt);
  -- a batch of another unit can't claim an earlier unit's file
  bt := research.begin_import('nyc','US-1877', jsonb_build_object('files', jsonb_build_object(
          'd-j1', jsonb_build_object('sha256', research.utf8_sha256(j1)),
          'd-n77', jsonb_build_object('sha256', research.utf8_sha256('n')))), now());
  EXECUTE replace(format(ins_file,'US-1877','notes','d-n77','n',bt,'US-1877__run-20261104T080254Z.md',repeat('d',32),research.utf8_sha256('n'),'false'), 'run-20261104T080254Z', 'run-20261104T080254Z');
  PERFORM pg_temp.expect_fail(format('SELECT research.finish_import(%s)', bt), 'check 1 failed');
  PERFORM research.undo_import(bt);
  RAISE NOTICE 'PASS batch 1 applied';

  -- ===== batch 2: a resumed run copies candidate a forward =====
  b2 := research.begin_import('nyc','US-1852', jsonb_build_object('files', jsonb_build_object(
          'd-j1', jsonb_build_object('sha256', research.utf8_sha256(j1)),
          'd-j2', jsonb_build_object('sha256', research.utf8_sha256(j2), 'lines', 1))), now());
  EXECUTE replace(format(ins_file,'US-1852','packets','d-j2',j2,b2,'US-1852__run-20261104T100156Z.jsonl',repeat('c',32),research.utf8_sha256(j2),'false'), 'run-20261104T080254Z', 'run-20261104T100156Z');
  SELECT run_file_id INTO f2 FROM research.run_file WHERE drive_file_id='d-j2';
  PERFORM pg_temp.expect_fail(format($q$UPDATE research.packet SET review_state='superseded', superseded_by_batch_id=%s WHERE candidate_id='us-1852-smoke-a'$q$, b1), 'only by an open batch');
  UPDATE research.packet SET review_state='superseded', superseded_by_batch_id=b2 WHERE candidate_id='us-1852-smoke-a' AND review_state='pending';
  -- check 2b: superseded without a replacement
  PERFORM pg_temp.expect_fail(format('SELECT research.finish_import(%s)', b2), 'check 2');
  EXECUTE format(ins_pk,'us-1852-smoke-a','run-20261104T100156Z','d-j2',j2,b2,f2,1,'B',NULL);
  PERFORM research.finish_import(b2);
  -- undo order: older batch refused while the newer one is applied
  PERFORM pg_temp.expect_fail(format('SELECT research.undo_import(%s)', b1), 'not the newest');
  c := research.undo_import(b2);
  IF (c->>'packets_restored')::int <> 1 OR (c->>'packets_deleted')::int <> 1 THEN RAISE EXCEPTION 'undo counts wrong: %', c; END IF;
  IF (SELECT review_state FROM research.packet WHERE candidate_id='us-1852-smoke-a') <> 'pending' THEN RAISE EXCEPTION 'older copy not restored'; END IF;
  IF (SELECT state FROM research.import_batch WHERE batch_id=b2) <> 'undone' THEN RAISE EXCEPTION 'batch 2 not marked undone'; END IF;
  -- undo refused while another batch is open
  bt := research.begin_import('nyc','US-1877','{}', now());
  PERFORM pg_temp.expect_fail(format('SELECT research.undo_import(%s)', b1), 'another batch is open');
  PERFORM research.undo_import(bt);
  RAISE NOTICE 'PASS supersede, check 2b and undo order';

  -- ===== stories =====
  bt := research.begin_import('nyc','TAB-STORIES','{"tabs":{"STORIES":["ST001","ST002"]},"headers":{"STORIES":["story_id","hook (fresh wording)"]}}', now());
  INSERT INTO research.tab_row (city_id,import_batch_id,tab,row_key,sheet_row,row_raw) VALUES
    ('nyc',bt,'STORIES','ST001',2,'{"story_id":"ST001","hook (fresh wording)":"one"}'),
    ('nyc',bt,'STORIES','ST002',3,'{"story_id":"ST002","hook (fresh wording)":"two"}');
  PERFORM pg_temp.expect_fail(format($q$INSERT INTO research.tab_row (city_id,import_batch_id,tab,row_key,sheet_row,row_raw) VALUES ('nyc',%s,'STORIES','ST009',4,'{"story_id":"ST010"}')$q$, bt), 'tab_row_check');
  PERFORM pg_temp.expect_fail(format($q$INSERT INTO research.tab_row (city_id,import_batch_id,tab,row_key,sheet_row,row_raw) VALUES ('nyc',%s,'STORIES','ST009',4,'{"story_id":"ST009","":"x"}')$q$, bt), 'tab_row_row_raw_check');
  PERFORM pg_temp.expect_fail(format($q$INSERT INTO research.tab_row (city_id,import_batch_id,tab,row_key,sheet_row,row_raw) VALUES ('nyc',%s,'STORIES','ST009',4,'{"story_id":"ST009","\t":"x"}')$q$, bt), 'tab_row_row_raw_check');
  PERFORM pg_temp.expect_fail(format($q$INSERT INTO research.tab_row (city_id,import_batch_id,tab,row_key,sheet_row,row_raw,live,removed_from_tab,superseded_by_batch_id) VALUES ('nyc',%s,'STORIES','ST009',4,'{"story_id":"ST009"}',false,true,%s)$q$, bt, bt), 'inserted live');
  PERFORM research.finish_import(bt);
  bt := research.begin_import('nyc','TAB-STORIES','{"tabs":{"STORIES":["ST001"]},"headers":{"STORIES":["story_id","hook (fresh wording)"]}}', now());
  UPDATE research.tab_row SET live=false, superseded_by_batch_id=bt WHERE row_key='ST001' AND live;
  INSERT INTO research.tab_row (city_id,import_batch_id,tab,row_key,sheet_row,row_raw)
    VALUES ('nyc',bt,'STORIES','ST001',2,'{"story_id":"ST001","hook (fresh wording)":"one, edited"}');
  PERFORM pg_temp.expect_fail(format('SELECT research.finish_import(%s)', bt), 'check 3 failed');   -- ST002 still live
  UPDATE research.tab_row SET live=false, superseded_by_batch_id=bt WHERE row_key='ST002' AND live;    -- retired but not marked removed
  PERFORM pg_temp.expect_fail(format('SELECT research.finish_import(%s)', bt), 'retired row');
  PERFORM pg_temp.expect_fail($q$UPDATE research.tab_row SET row_raw='{"story_id":"ST002"}' WHERE row_key='ST002'$q$, 'never changes');
  -- marking removed needs the superseding batch to stay the same: set the flag only
  UPDATE research.tab_row SET removed_from_tab=true WHERE row_key='ST002' AND superseded_by_batch_id=bt;
  PERFORM research.finish_import(bt);
  IF (SELECT hook FROM research.story WHERE story_id='ST001') <> 'one, edited' THEN RAISE EXCEPTION 'story view wrong'; END IF;
  IF (SELECT count(*) FROM research.story) <> 1 THEN RAISE EXCEPTION 'story view shows non-live rows'; END IF;
  PERFORM pg_temp.expect_fail($q$UPDATE research.tab_row SET removed_from_tab=false WHERE row_key='ST002' AND removed_from_tab$q$, 'removed_from_tab changes only');
  c := research.undo_import(bt);
  IF (c->>'tab_rows_restored')::int <> 2 THEN RAISE EXCEPTION 'tab undo counts wrong: %', c; END IF;
  IF (SELECT count(*) FROM research.story) <> 2 OR EXISTS (SELECT 1 FROM research.tab_row WHERE removed_from_tab) THEN
    RAISE EXCEPTION 'tab rows not restored'; END IF;
  RAISE NOTICE 'PASS stories retire, remove and undo';

  -- ===== check 4: a core change inside a batch is caught (an update, not just a new row) =====
  -- a place batch with no files can't finish
  bt := research.begin_import('nyc','US-1902','{}', now());
  PERFORM pg_temp.expect_fail(format('SELECT research.finish_import(%s)', bt), 'check 0 failed');
  PERFORM research.undo_import(bt);
  bt := research.begin_import('nyc','TAB-DELIGHTS','{"tabs":{"DELIGHTS":[]},"headers":{"DELIGHTS":[]}}', now());
  -- session settings must not change the fingerprint
  PERFORM set_config('datestyle', 'SQL, DMY', true);
  PERFORM set_config('timezone', 'Asia/Tokyo', true);
  IF research.core_print() <> (SELECT core_print FROM research.import_batch WHERE batch_id = bt) THEN RAISE EXCEPTION 'core_print depends on session settings'; END IF;
  UPDATE core.interest SET label = label || ' ' WHERE slug = 'religion';
  PERFORM pg_temp.expect_fail(format('SELECT research.finish_import(%s)', bt), 'check 4 failed');
  RAISE NOTICE 'PASS core check';
END$$;

DO $$BEGIN RAISE NOTICE 'ALL PASS'; END$$;
ROLLBACK;
