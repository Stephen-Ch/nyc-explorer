-- Smoke test for 0007 (plan 47 finish S2: api.tonight shows a later STOPPED or FAIL). Run only on a local database or
-- a throwaway Neon branch, never on production. psql -v ON_ERROR_STOP=1 -d <db> -f db/smoke/0007_smoke.sql (as the owner
-- of schema research). Catalog checks only (the owner cannot call api.tonight; the behaviour is tested in db/test/0007).
-- Ends with 'ALL PASS'; ROLLBACK leaves nothing behind.
BEGIN;
DO $$DECLARE r record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0007') THEN RAISE EXCEPTION '0007 row missing'; END IF;
  SELECT p.* INTO r FROM pg_proc p WHERE p.oid = 'api.tonight()'::regprocedure;
  IF pg_get_userbyid(r.proowner) <> 'nyc_door' OR NOT r.prosecdef OR r.provolatile <> 's' THEN RAISE EXCEPTION 'tonight owner, SECURITY DEFINER or STABLE wrong'; END IF;
  IF r.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, research, pg_temp'] THEN RAISE EXCEPTION 'tonight settings: %', r.proconfig; END IF;
  IF has_function_privilege('public', r.oid, 'EXECUTE') OR NOT has_function_privilege('nyc_loader', r.oid, 'EXECUTE') THEN RAISE EXCEPTION 'tonight grants wrong'; END IF;
  IF r.prosrc !~ 'bad_later' THEN RAISE EXCEPTION 'tonight is not the 0007 version'; END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE roleid = 'nyc_door'::regrole AND (inherit_option OR set_option)) THEN
    RAISE EXCEPTION 'someone can use nyc_door (temporary membership left over)';
  END IF;

  RAISE NOTICE 'ALL PASS';
END$$;
ROLLBACK;
