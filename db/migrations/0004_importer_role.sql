-- ExplorerWalks database, migration 0004: limited 'importer' role for the PC import script (plan 05, draft 7 rev 3).
-- The role is made HERE with SQL, not in the Neon console: Neon gives console-made roles neon_superuser
-- (write access to every table). This role can log in but has no password; Stephen sets one himself
-- in the Neon SQL Editor (ALTER ROLE importer WITH PASSWORD '...'), so Claude never sees it.
-- Import functions and guard triggers run with the owner's rights (SECURITY DEFINER) and a fixed search_path;
-- the importer gets only the grants below. undo_import stays owner-only.
-- Replaces the 0003 note "one owner role": research.in_undo() now also requires session_user to be the owner
-- of schema research, so setting research.in_undo by hand gives the importer no bypass.
-- Target: Neon PostgreSQL 18 + PostGIS 3.6. All or nothing.
BEGIN;

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0003') THEN RAISE EXCEPTION '0003 not applied'; END IF;
  IF EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0004') THEN RAISE EXCEPTION '0004 already applied'; END IF;
  IF current_user::text <> (SELECT nspowner::regrole::text FROM pg_namespace WHERE nspname = 'research') THEN
    RAISE EXCEPTION 'run 0004 as the owner of schema research';
  END IF;
END$$;

-- ---------- 1. the role ----------
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'importer') THEN
    CREATE ROLE importer LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT;
  END IF;
  -- a role made earlier (for example in the console) must not carry admin rights
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'importer'
             AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR NOT rolcanlogin)) THEN
    RAISE EXCEPTION 'role importer has admin attributes or cannot log in; delete it and run 0004 again';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE member = 'importer'::regrole) THEN
    RAISE EXCEPTION 'role importer is a member of another role (e.g. neon_superuser); delete it and run 0004 again';
  END IF;
END$$;

-- ---------- 2. in_undo: owner sessions only ----------
CREATE OR REPLACE FUNCTION research.in_undo() RETURNS boolean LANGUAGE sql STABLE
  SET search_path = pg_catalog, pg_temp AS
$$ SELECT coalesce(pg_catalog.current_setting('research.in_undo', true), '') = 'on'
      AND session_user::text = (SELECT n.nspowner::regrole::text FROM pg_catalog.pg_namespace n WHERE n.nspname = 'research') $$;

-- ---------- 3. owner's rights + fixed search_path ----------
-- Every name inside these functions is already schema-qualified (research.*, core.*, information_schema.*).
ALTER FUNCTION research.begin_import(text, text, jsonb, timestamptz) SECURITY DEFINER SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION research.finish_import(bigint)                        SECURITY DEFINER SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION research.guard_row()                                  SECURITY DEFINER SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION research.guard_lock()                                 SECURITY DEFINER SET search_path = pg_catalog, pg_temp;
-- the rest keep the caller's rights, but get a fixed search_path too
ALTER FUNCTION research.undo_import(bigint) SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION research.core_print()        SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION research.utf8_sha256(text)   SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION research.has_blank_key(jsonb) SET search_path = pg_catalog, pg_temp;

-- ---------- 4. EXECUTE: nobody by default; the importer only what inserts need ----------
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA research FROM PUBLIC;
-- Functions the owner creates LATER are not callable by PUBLIC either. Must be the global form:
-- a per-schema default can only add rights, never remove the built-in PUBLIC EXECUTE (review 1, finding 1).
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
GRANT EXECUTE ON FUNCTION research.begin_import(text, text, jsonb, timestamptz) TO importer;
GRANT EXECUTE ON FUNCTION research.finish_import(bigint) TO importer;
-- called by CHECKs and the generated row_sha256 column, which run with the inserting user's rights
GRANT EXECUTE ON FUNCTION research.utf8_sha256(text)    TO importer;
GRANT EXECUTE ON FUNCTION research.has_blank_key(jsonb) TO importer;

-- ---------- 5. tables: per column, no DELETE, no core ----------
GRANT USAGE ON SCHEMA research TO importer;
GRANT SELECT ON research.import_batch, research.run_file, research.packet, research.tab_row TO importer;
GRANT INSERT (city_id, run_id, unit_id, kind, drive_file_id, content, import_batch_id,
              file_name, retry, drive_md5, drive_revision, drive_modified_utc, sha256) ON research.run_file TO importer;
GRANT INSERT (city_id, candidate_id, unit_id, run_id, drive_file_id, packet, import_batch_id,
              run_file_id, line_no, place_id_db, disposition_final, skeptic_changed) ON research.packet TO importer;
GRANT INSERT (city_id, import_batch_id, tab, row_key, sheet_row, row_raw) ON research.tab_row TO importer;
GRANT UPDATE (review_state, superseded_by_batch_id) ON research.packet TO importer;
GRANT UPDATE (live, removed_from_tab, superseded_by_batch_id) ON research.tab_row TO importer;

INSERT INTO core.schema_migrations (version, note) VALUES ('0004', 'importer role (plan 05)');
COMMIT;
