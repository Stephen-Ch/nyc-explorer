-- Way back for 0004: puts the research functions back as 0003 left them and removes the importer role.
-- Rows the importer already wrote stay (undo them first with research.undo_import if they must go).
BEGIN;
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0004') THEN RAISE EXCEPTION '0004 not applied'; END IF;
  IF EXISTS (SELECT 1 FROM core.schema_migrations WHERE version > '0004') THEN RAISE EXCEPTION 'a later migration is applied; undo it first'; END IF;
END$$;

REVOKE ALL ON research.import_batch, research.run_file, research.packet, research.tab_row FROM importer;
REVOKE ALL (city_id, run_id, unit_id, kind, drive_file_id, content, import_batch_id,
            file_name, retry, drive_md5, drive_revision, drive_modified_utc, sha256) ON research.run_file FROM importer;
REVOKE ALL (city_id, candidate_id, unit_id, run_id, drive_file_id, packet, import_batch_id, run_file_id, line_no,
            place_id_db, disposition_final, skeptic_changed, review_state, superseded_by_batch_id) ON research.packet FROM importer;
REVOKE ALL (city_id, import_batch_id, tab, row_key, sheet_row, row_raw, live, removed_from_tab,
            superseded_by_batch_id) ON research.tab_row FROM importer;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA research FROM importer;
REVOKE USAGE ON SCHEMA research FROM importer;
-- roles are shared by all databases of the server; keep it if another database still uses it
DO $$BEGIN
  DROP ROLE importer;
EXCEPTION WHEN dependent_objects_still_exist THEN
  RAISE NOTICE 'role importer kept: another database still grants it rights';
END$$;

ALTER DEFAULT PRIVILEGES IN SCHEMA research GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA research TO PUBLIC;

ALTER FUNCTION research.begin_import(text, text, jsonb, timestamptz) SECURITY INVOKER RESET search_path;
ALTER FUNCTION research.finish_import(bigint)  SECURITY INVOKER RESET search_path;
ALTER FUNCTION research.guard_row()            SECURITY INVOKER RESET search_path;
ALTER FUNCTION research.guard_lock()           SECURITY INVOKER RESET search_path;
ALTER FUNCTION research.undo_import(bigint)    RESET search_path;
ALTER FUNCTION research.core_print()           RESET search_path;
ALTER FUNCTION research.utf8_sha256(text)      RESET search_path;
ALTER FUNCTION research.has_blank_key(jsonb)   RESET search_path;

CREATE OR REPLACE FUNCTION research.in_undo() RETURNS boolean LANGUAGE sql STABLE AS
$$ SELECT coalesce(current_setting('research.in_undo', true), '') = 'on' $$;

DELETE FROM core.schema_migrations WHERE version = '0004';
COMMIT;
