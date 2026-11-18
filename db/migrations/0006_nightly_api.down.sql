-- Undo 0006 (plan 47 nightly door). Works only while no row of a new door tab (PLACE_HOOKS, PEOPLE, NAME_LINKS,
-- NUMBER_MAP) and no open or applied batch for those tabs exists: undo those batches first, newest first.
-- The nightly record, approvals and tab list are dropped with their tables (history of the door is lost).
-- Batches of the 0005 tabs (STORIES, DELIGHTS, INDEX, STORY_TEXT) made through the door stay; 0005 allows them.
-- Restores the three 0005 checks with their exact names and definitions (0005.down drops them by name).
BEGIN;
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0006') THEN RAISE EXCEPTION '0006 not applied'; END IF;
  IF current_user::text <> (SELECT nspowner::regrole::text FROM pg_namespace WHERE nspname = 'research') THEN
    RAISE EXCEPTION 'run 0006.down as the owner of schema research';
  END IF;
  IF EXISTS (SELECT 1 FROM research.tab_row WHERE tab IN ('PLACE_HOOKS','PEOPLE','NAME_LINKS','NUMBER_MAP'))
     OR EXISTS (SELECT 1 FROM research.import_batch WHERE unit_id IN ('TAB-PLACE_HOOKS','TAB-PEOPLE','TAB-NAME_LINKS','TAB-NUMBER_MAP')
                AND state IN ('open','applied')) THEN
    RAISE EXCEPTION 'rows or batches of a 0006 tab exist; undo those batches first';
  END IF;
END$$;

-- the door
DROP FUNCTION api.put_tab(date, text, timestamptz, text, text, jsonb, jsonb), api.record_result(date, jsonb, text), api.tonight();
DROP SCHEMA api;
DROP TRIGGER import_batch_door_guard ON research.import_batch;
DROP FUNCTION research.door_guard();
DROP TABLE research.removal_approval, research.nightly_run, research.tab_schema;
-- undone or failed records of the new tab units (no rows left), since the 0005 unit check refuses them
DELETE FROM research.import_batch WHERE unit_id IN ('TAB-PLACE_HOOKS','TAB-PEOPLE','TAB-NAME_LINKS','TAB-NUMBER_MAP') AND state IN ('undone','failed');

-- the three 0005 checks, exactly as 0005 made them
ALTER TABLE research.tab_row DROP CONSTRAINT tab_row_key_check_0006;
ALTER TABLE research.tab_row DROP CONSTRAINT tab_row_tab_check_0006;
ALTER TABLE research.import_batch DROP CONSTRAINT import_batch_unit_check_0006;
ALTER TABLE research.import_batch ADD CONSTRAINT import_batch_unit_check_0005
  CHECK (unit_id ~ '^(MN[0-9]{2}-[0-9]{4}|US-[0-9]{4}|ST-(SQ|N|S|E|W)-[0-9]{4}|TAB-(STORIES|DELIGHTS|INDEX|STORY_TEXT))$');
ALTER TABLE research.tab_row ADD CONSTRAINT tab_row_tab_check_0005 CHECK (tab IN ('STORIES','DELIGHTS','INDEX','STORY_TEXT'));
ALTER TABLE research.tab_row ADD CONSTRAINT tab_row_key_check_0005 CHECK (
     (tab = 'STORIES'    AND row_key ~ '^ST[0-9]{3,}$' AND row_key IS NOT DISTINCT FROM row_raw->>'story_id')
  OR (tab = 'DELIGHTS'   AND row_key ~ '^D[0-9]{3,}$'  AND row_key IS NOT DISTINCT FROM row_raw->>'delight_id')
  OR (tab = 'INDEX'      AND row_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND row_key IS NOT DISTINCT FROM row_raw->>'candidate_id')
  OR (tab = 'STORY_TEXT' AND row_raw->>'story_id' ~ '^ST[0-9]{3,}$' AND row_raw->>'run_id' ~ '^run-[0-9]{8}T[0-9]{6}Z$'
      AND row_key IS NOT DISTINCT FROM (row_raw->>'story_id') || '@' || (row_raw->>'run_id')));

-- roles: every right they hold, then the roles
REVOKE ALL ON research.import_batch, research.tab_row FROM nyc_door;
REVOKE ALL (city_id, import_batch_id, tab, row_key, sheet_row, row_raw, live, removed_from_tab, superseded_by_batch_id) ON research.tab_row FROM nyc_door;
REVOKE ALL ON FUNCTION research.begin_import(text, text, jsonb, timestamptz), research.finish_import(bigint),
  research.utf8_sha256(text), research.has_blank_key(jsonb) FROM nyc_door;
REVOKE ALL ON SCHEMA research FROM nyc_door;
REVOKE nyc_loader FROM authenticator;
DROP ROLE nyc_loader;
DROP ROLE nyc_door;
ALTER ROLE importer LOGIN;

DELETE FROM core.schema_migrations WHERE version = '0006';
COMMIT;
