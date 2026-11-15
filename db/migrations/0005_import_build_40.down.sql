-- Undo 0005. Works only while no row uses a new kind, retry, tab or unit (undo those batches first, newest first).
BEGIN;
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0005') THEN RAISE EXCEPTION '0005 not applied'; END IF;
  IF EXISTS (SELECT 1 FROM research.run_file WHERE kind IN ('story-sources','story-existing','blind','check')
             OR (retry AND kind NOT IN ('skeptic','story-skeptic')))
     OR EXISTS (SELECT 1 FROM research.tab_row WHERE tab IN ('INDEX','STORY_TEXT'))
     OR EXISTS (SELECT 1 FROM research.import_batch WHERE unit_id IN ('TAB-INDEX','TAB-STORY_TEXT')) THEN
    RAISE EXCEPTION 'rows of a 0005 kind, tab or unit exist; undo those batches first';
  END IF;
END$$;

DROP VIEW research.index_packet_mismatch, research.index_row, research.story_text_orphan, research.story_not_ready,
  research.story_ready, research.story_readiness, research.story_text_newest, research.story_text;

ALTER TABLE research.run_file DROP CONSTRAINT run_file_retry_check;
ALTER TABLE research.run_file ADD CONSTRAINT run_file_retry_check
  CHECK (retry = (file_name LIKE '%-retry.md') AND (NOT retry OR kind IN ('skeptic','story-skeptic')));
ALTER TABLE research.run_file DROP CONSTRAINT run_file_kind_check;
ALTER TABLE research.run_file ADD CONSTRAINT run_file_kind_check CHECK (kind IN
  ('packets','notes','sources','skeptic','story-claims','story-fragments','story-skeptic','story-notes'));

ALTER TABLE research.tab_row DROP CONSTRAINT tab_row_key_check_0005;
ALTER TABLE research.tab_row DROP CONSTRAINT tab_row_tab_check_0005;
ALTER TABLE research.import_batch DROP CONSTRAINT import_batch_unit_check_0005;
ALTER TABLE research.import_batch ADD CONSTRAINT import_batch_unit_id_check
  CHECK (unit_id ~ '^(MN[0-9]{2}-[0-9]{4}|US-[0-9]{4}|ST-(SQ|N|S|E|W)-[0-9]{4}|TAB-(STORIES|DELIGHTS))$');
ALTER TABLE research.tab_row ADD CONSTRAINT tab_row_tab_check CHECK (tab IN ('STORIES','DELIGHTS'));
ALTER TABLE research.tab_row ADD CONSTRAINT tab_row_check2
  CHECK ((tab = 'STORIES'  AND row_key ~ '^ST[0-9]{3,}$' AND row_key IS NOT DISTINCT FROM row_raw->>'story_id')
      OR (tab = 'DELIGHTS' AND row_key ~ '^D[0-9]{3,}$'  AND row_key IS NOT DISTINCT FROM row_raw->>'delight_id'));

DELETE FROM core.schema_migrations WHERE version = '0005';
COMMIT;
