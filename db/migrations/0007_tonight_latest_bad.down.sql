-- Undo 0007 (plan 47 finish S2): puts back api.tonight() exactly as 0006 made it (body copied from
-- 0006_nightly_api.sql). Grants and owner stay (CREATE OR REPLACE). Run before any 0006 down, as the owner of
-- schema research.
BEGIN;

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '0007') THEN RAISE EXCEPTION '0007 not applied'; END IF;
  IF current_user::text <> (SELECT nspowner::regrole::text FROM pg_namespace WHERE nspname = 'research') THEN
    RAISE EXCEPTION 'run 0007.down as the owner of schema research';
  END IF;
END$$;

GRANT nyc_door TO CURRENT_USER WITH INHERIT TRUE, SET TRUE;

-- api.tonight: read-only. For each enabled tab: tonight's status (latest good row wins; an undone base batch
-- shows UNDONE, never an older good row), last good time and hours since; plus open batches over 2 hours.
CREATE OR REPLACE FUNCTION api.tonight()
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


REVOKE nyc_door FROM CURRENT_USER;

DELETE FROM core.schema_migrations WHERE version = '0007';
COMMIT;
