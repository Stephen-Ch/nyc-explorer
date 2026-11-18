-- Smoke test for 0006 (plan 47 nightly door). Run only on a local database or a throwaway Neon branch, never on production.
-- psql -v ON_ERROR_STOP=1 -d <db> -f db/smoke/0006_smoke.sql   (as the owner of schema research)
-- Catalog checks only; calls through the Data API are test 13g (step 4). Ends with 'ALL PASS'; ROLLBACK leaves nothing behind.
BEGIN;
DO $$DECLARE r record; n int;
BEGIN
  PERFORM 1 FROM core.schema_migrations WHERE version = '0006';
  IF NOT FOUND THEN RAISE EXCEPTION '0006 row missing'; END IF;

  -- roles: no login, no powers; nyc_loader -> authenticator with inherit false, set true; no role setting
  FOR r IN SELECT * FROM pg_roles WHERE rolname IN ('nyc_door','nyc_loader') LOOP
    IF r.rolcanlogin OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls THEN
      RAISE EXCEPTION '% has wrong attributes', r.rolname;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM pg_roles WHERE rolname IN ('nyc_door','nyc_loader')) <> 2 THEN RAISE EXCEPTION 'door roles missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_auth_members WHERE roleid = 'nyc_loader'::regrole AND member = 'authenticator'::regrole
                 AND NOT inherit_option AND set_option AND NOT admin_option) THEN
    RAISE EXCEPTION 'nyc_loader is not granted to authenticator WITH INHERIT FALSE, SET TRUE';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE roleid = 'nyc_loader'::regrole AND member <> 'authenticator'::regrole) THEN
    RAISE EXCEPTION 'nyc_loader is granted to someone else';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE roleid = 'nyc_door'::regrole AND (inherit_option OR set_option)) THEN
    RAISE EXCEPTION 'someone can use nyc_door (temporary membership left over)';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_db_role_setting WHERE setrole = 'nyc_loader'::regrole) THEN RAISE EXCEPTION 'nyc_loader has a role setting (A2: none)'; END IF;
  IF (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'importer') THEN RAISE EXCEPTION 'importer can log in (0006 sets NOLOGIN)'; END IF;

  -- the door: three functions, owned by nyc_door, only nyc_loader may run them, fixed search_path, no statement_timeout
  SELECT count(*) INTO n FROM pg_proc WHERE pronamespace = 'api'::regnamespace;
  IF n <> 3 THEN RAISE EXCEPTION 'expected 3 api functions, found %', n; END IF;
  FOR r IN SELECT p.oid::regprocedure AS f, p.* FROM pg_proc p WHERE pronamespace = 'api'::regnamespace LOOP
    IF pg_get_userbyid(r.proowner) <> 'nyc_door' OR NOT r.prosecdef THEN RAISE EXCEPTION '% not owned by nyc_door with SECURITY DEFINER', r.f; END IF;
    IF NOT ('search_path=pg_catalog, research, pg_temp' = ANY (r.proconfig)) THEN RAISE EXCEPTION '% search_path', r.f; END IF;
    IF EXISTS (SELECT 1 FROM unnest(r.proconfig) c WHERE c LIKE 'statement_timeout%') THEN RAISE EXCEPTION '% sets statement_timeout', r.f; END IF;
    IF has_function_privilege('public', r.oid, 'EXECUTE') THEN RAISE EXCEPTION '% PUBLIC EXECUTE', r.f; END IF;
    IF NOT has_function_privilege('nyc_loader', r.oid, 'EXECUTE') THEN RAISE EXCEPTION '% nyc_loader cannot run it', r.f; END IF;
    IF r.prosrc ~* '\mEXECUTE\M' OR r.prosrc ~* 'query_canceled|57014' THEN RAISE EXCEPTION '% has dynamic SQL or catches a cancel', r.f; END IF;
  END LOOP;
  FOR r IN SELECT rolname FROM pg_roles WHERE rolname IN ('authenticator','anonymous','authenticated','importer') LOOP
    IF has_schema_privilege(r.rolname, 'api', 'USAGE') OR has_schema_privilege(r.rolname, 'research', 'USAGE') AND r.rolname <> 'importer' THEN
      RAISE EXCEPTION '% can use schema api or research', r.rolname;
    END IF;
  END LOOP;
  IF has_schema_privilege('nyc_loader', 'research', 'USAGE') THEN RAISE EXCEPTION 'nyc_loader can use schema research'; END IF;
  IF has_schema_privilege('nyc_door', 'api', 'CREATE') THEN RAISE EXCEPTION 'nyc_door kept CREATE on api'; END IF;
  IF has_table_privilege('nyc_door', 'research.tab_row', 'DELETE') OR has_table_privilege('nyc_door', 'research.nightly_run', 'UPDATE')
     OR has_table_privilege('nyc_door', 'research.removal_approval', 'INSERT') OR has_function_privilege('nyc_door', 'research.undo_import(bigint)', 'EXECUTE') THEN
    RAISE EXCEPTION 'nyc_door has more rights than the door needs';
  END IF;

  -- the list, the checks, the importer guard
  IF (SELECT count(*) FROM research.tab_schema WHERE enabled) <> 8 THEN RAISE EXCEPTION 'expected 8 enabled tabs'; END IF;
  IF (SELECT count(*) FROM pg_constraint WHERE conname IN ('import_batch_unit_check_0006','tab_row_tab_check_0006','tab_row_key_check_0006')) <> 3
     OR EXISTS (SELECT 1 FROM pg_constraint WHERE conname LIKE '%\_0005' AND conrelid IN ('research.import_batch'::regclass, 'research.tab_row'::regclass)) THEN
    RAISE EXCEPTION 'replaced checks wrong';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'import_batch_door_guard' AND tgrelid = 'research.import_batch'::regclass) THEN
    RAISE EXCEPTION 'door guard trigger missing';
  END IF;
  RAISE NOTICE 'ALL PASS';
END$$;
ROLLBACK;
