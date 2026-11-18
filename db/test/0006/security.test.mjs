// Plan 47 (nightly door) tests: roles, ownership, grants, catalog audit, migration up/down, importer route.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { requireIsolated, freshDb, cleanup, q, withLoader, putTab, rowsFor, ago, nyDate, readMigration, M6, M6_DOWN, HOST } from './helpers.mjs';

before(requireIsolated);
after(cleanup);

const API = ['api.put_tab(date,text,timestamp with time zone,text,text,jsonb,jsonb)', 'api.record_result(date,jsonb,text)', 'api.tonight()'];

test('13f: api functions: owned by nyc_door, no PUBLIC EXECUTE, fixed search_path, no statement_timeout, no dynamic SQL, no cancel handler', async () => {
  const db = await freshDb();
  const r = (await q(db, `SELECT p.oid::regprocedure::text sig, pg_get_userbyid(p.proowner) owner, p.prosecdef, p.proconfig,
      p.prosrc, coalesce(p.proacl::text[], '{}') acl FROM pg_proc p WHERE p.pronamespace = 'api'::regnamespace ORDER BY 1`)).rows;
  assert.deepEqual(r.map(x => x.sig).sort(), [...API].sort());
  for (const f of r) {
    assert.equal(f.owner, 'nyc_door', f.sig);
    assert.ok(f.prosecdef, `${f.sig} SECURITY DEFINER`);
    assert.ok(f.proconfig.includes('search_path=pg_catalog, research, pg_temp'), `${f.sig} ${f.proconfig}`);
    assert.ok(!f.proconfig.some(x => x.startsWith('statement_timeout')), `${f.sig} has statement_timeout in SET`);
    assert.ok(!f.acl.some(a => a.startsWith('=')), `${f.sig} PUBLIC EXECUTE: ${f.acl}`);
    assert.ok(f.acl.some(a => a.startsWith('nyc_loader=X/')), `${f.sig} nyc_loader EXECUTE: ${f.acl}`);
    assert.doesNotMatch(f.prosrc, /\bEXECUTE\b/i, `${f.sig} dynamic SQL`);
    assert.doesNotMatch(f.prosrc, /query_canceled|57014/i, `${f.sig} catches cancel`);
  }
  assert.ok(r.find(x => x.sig.startsWith('api.put_tab')).proconfig.includes('lock_timeout=3s'));
  // schema api: only nyc_loader and nyc_door may use it
  const acl = (await q(db, `SELECT coalesce(nspacl::text[], '{}') a, pg_get_userbyid(nspowner) o FROM pg_namespace WHERE nspname='api'`)).rows[0];
  assert.ok(!acl.a.some(x => x.startsWith('=')), acl.a);
  assert.ok(!acl.a.some(x => /^nyc_door=[^/]*C/.test(x)), 'nyc_door keeps CREATE on api');
});

test('13w: no role setting for nyc_loader; 14d: nyc_loader -> authenticator with inherit false, set true; authenticator alone has no rights', async () => {
  const db = await freshDb();
  assert.equal((await q(db, `SELECT count(*)::int n FROM pg_db_role_setting WHERE setrole = 'nyc_loader'::regrole`)).rows[0].n, 0);
  const m = (await q(db, `SELECT inherit_option, set_option, admin_option FROM pg_auth_members WHERE roleid='nyc_loader'::regrole AND member='authenticator'::regrole`)).rows;
  assert.deepEqual(m, [{ inherit_option: false, set_option: true, admin_option: false }]);
  const a = new pg.Client({ host: HOST, user: 'authenticator', database: db }); await a.connect();
  try {
    await assert.rejects(a.query(`SELECT api.tonight()`), /permission denied/);
    await assert.rejects(a.query(`SELECT * FROM research.tab_row`), /permission denied/);
  } finally { await a.end(); }
  // the temporary owner membership is gone; owner keeps ADMIN only (written down in the plan)
  const own = (await q(db, `SELECT inherit_option, set_option FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.member
      WHERE m.roleid = 'nyc_door'::regrole AND r.rolname = current_user`)).rows;
  assert.ok(own.every(x => !x.inherit_option && !x.set_option), JSON.stringify(own));
  for (const role of ['nyc_door', 'nyc_loader']) {
    const p = (await q(db, `SELECT rolcanlogin, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls FROM pg_roles WHERE rolname=$1`, [role])).rows[0];
    assert.deepEqual(p, { rolcanlogin: false, rolsuper: false, rolcreaterole: false, rolcreatedb: false, rolbypassrls: false }, role);
  }
});

test('19: as nyc_loader: select or insert any table, call undo_import or begin_import, touch core: permission denied', async () => {
  const db = await freshDb();
  await withLoader(db, async c => {
    for (const sql of [`SELECT * FROM research.tab_row`, `SELECT * FROM research.nightly_run`, `SELECT * FROM research.tab_schema`,
      `INSERT INTO research.nightly_run (status) VALUES ('PASS')`, `SELECT research.undo_import(1)`,
      `SELECT research.begin_import('nyc','TAB-STORIES','{}',NULL)`, `SELECT * FROM core.city`, `INSERT INTO core.city (city_id) VALUES ('zz')`,
      `UPDATE research.tab_schema SET enabled = true`, `INSERT INTO research.removal_approval (city_id, tab, row_key, live_batch_id) VALUES ('nyc','STORIES','ST001',1)`]) {
      await assert.rejects(c.query(sql), /permission denied/, sql);
    }
  });
});

test('20: anonymous and authenticated cannot call anything in api or read research', async () => {
  const db = await freshDb();
  const a = new pg.Client({ host: HOST, user: 'authenticator', database: db }); await a.connect();
  try {
    for (const role of ['anonymous', 'authenticated']) {
      await a.query(`SET ROLE ${role}`);
      for (const sql of [`SELECT api.tonight()`, `SELECT api.record_result(current_date, '[]', 'x')`, `SELECT * FROM research.tab_row`]) {
        await assert.rejects(a.query(sql), /permission denied/, `${role}: ${sql}`);
      }
      await a.query('RESET ROLE');
    }
  } finally { await a.end(); }
});

test('14c local: switching to nyc_door, importer or the owner from authenticator is refused', async () => {
  const db = await freshDb();
  const a = new pg.Client({ host: HOST, user: 'authenticator', database: db }); await a.connect();
  try {
    for (const role of ['nyc_door', 'importer', 'postgres']) await assert.rejects(a.query(`SET ROLE ${role}`), /permission denied/, role);
  } finally { await a.end(); }
});

test('14b: the importer cannot alter, grant on or drop any api function', async () => {
  const db = await freshDb();
  await q(db, `ALTER ROLE importer LOGIN`);
  for (const f of ['api.tonight()', 'api.record_result(date,jsonb,text)']) {
    for (const sql of [`ALTER FUNCTION ${f} OWNER TO importer`, `GRANT EXECUTE ON FUNCTION ${f} TO PUBLIC`, `DROP FUNCTION ${f}`,
      `ALTER FUNCTION ${f} SECURITY INVOKER`]) {
      await assert.rejects(q(db, sql, [], 'importer'), /must be owner|permission denied/, sql);
    }
  }
  await assert.rejects(q(db, `CREATE FUNCTION api.x() RETURNS int LANGUAGE sql AS 'select 1'`, [], 'importer'), /permission denied/);
});

test('22: anything nyc_door owns cannot write core or undo (a probe function owned by nyc_door)', async () => {
  const db = await freshDb();
  // the owner makes probes the same way 0006 makes door functions, then hands them to nyc_door
  await q(db, `GRANT nyc_door TO postgres WITH INHERIT TRUE, SET TRUE; GRANT CREATE ON SCHEMA api TO nyc_door;
    CREATE FUNCTION api.probe_core() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$ INSERT INTO core.city (city_id) VALUES ('zz') $$;
    CREATE FUNCTION api.probe_undo() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$ SELECT research.undo_import(1) $$;
    ALTER FUNCTION api.probe_core() OWNER TO nyc_door; ALTER FUNCTION api.probe_undo() OWNER TO nyc_door;
    GRANT EXECUTE ON FUNCTION api.probe_core(), api.probe_undo() TO nyc_loader;
    REVOKE CREATE ON SCHEMA api FROM nyc_door; REVOKE nyc_door FROM postgres;`);
  await withLoader(db, async c => {
    await assert.rejects(c.query(`SELECT api.probe_core()`), /permission denied/);
    await assert.rejects(c.query(`SELECT api.probe_undo()`), /permission denied/);
  });
});

test('18d, 18f: importer is NOLOGIN after 0006; with login turned on it still cannot open a batch for any door tab', async () => {
  const db = await freshDb();
  await assert.rejects(q(db, 'SELECT 1', [], 'importer'), /not permitted to log in/);
  await q(db, `ALTER ROLE importer LOGIN`);
  for (const t of ['STORIES', 'DELIGHTS', 'INDEX', 'STORY_TEXT', 'PLACE_HOOKS', 'PEOPLE', 'NAME_LINKS', 'NUMBER_MAP']) {
    await assert.rejects(q(db, `SELECT research.begin_import('nyc', $1, '{}', NULL)`, [`TAB-${t}`], 'importer'), /door/, t);
  }
  // run-file units still open
  const b = (await q(db, `SELECT research.begin_import('nyc', 'US-1852', '{"files":{}}', NULL) b`, [], 'importer')).rows[0].b;
  assert.ok(b > 0);
  await q(db, `ALTER ROLE importer NOLOGIN`);
  await assert.rejects(q(db, 'SELECT 1', [], 'importer'), /not permitted to log in/);
});

test('0006 refuses to run twice, without 0005, or with roles already made', async () => {
  const db = await freshDb();
  await assert.rejects(q(db, readMigration(M6)), /0006 already applied/);
  const db2 = await freshDb({ with6: false });
  await q('postgres', `CREATE ROLE nyc_door NOLOGIN`);
  await assert.rejects(q(db2, readMigration(M6)), /nyc_door already exists/);
});

// ---- 13: up, down, up; fingerprints of 0001-0005 objects ----
const PRINT = `SELECT jsonb_build_object(
  'functions', (SELECT jsonb_agg(jsonb_build_array(p.oid::regprocedure::text, md5(pg_get_functiondef(p.oid)), p.proacl::text, p.proconfig::text,
       pg_get_userbyid(p.proowner)) ORDER BY 1) FROM pg_proc p WHERE p.pronamespace IN ('research'::regnamespace,'core'::regnamespace) AND p.prokind = 'f'),
  'checks', (SELECT jsonb_agg(jsonb_build_array(conrelid::regclass::text, conname, pg_get_constraintdef(oid)) ORDER BY 1, 2, 3)
       FROM pg_constraint WHERE connamespace IN ('research'::regnamespace,'core'::regnamespace)),
  'views', (SELECT jsonb_agg(jsonb_build_array(c.oid::regclass::text, md5(pg_get_viewdef(c.oid))) ORDER BY 1) FROM pg_class c
       WHERE c.relkind = 'v' AND c.relnamespace IN ('research'::regnamespace,'core'::regnamespace)),
  'triggers', (SELECT jsonb_agg(jsonb_build_array(tgrelid::regclass::text, tgname, md5(pg_get_triggerdef(oid))) ORDER BY 1, 2)
       FROM pg_trigger WHERE NOT tgisinternal),
  'tables', (SELECT jsonb_agg(jsonb_build_array(c.oid::regclass::text, c.relacl::text) ORDER BY 1) FROM pg_class c
       WHERE c.relkind = 'r' AND c.relnamespace IN ('research'::regnamespace,'core'::regnamespace)),
  'columns', (SELECT jsonb_agg(jsonb_build_array(attrelid::regclass::text, attname, attacl::text) ORDER BY 1, 2) FROM pg_attribute
       WHERE attacl IS NOT NULL AND attrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'research'::regnamespace)),
  'importer', (SELECT jsonb_build_array(rolcanlogin, rolinherit) FROM pg_roles WHERE rolname = 'importer'),
  'migrations', (SELECT jsonb_agg(version ORDER BY version) FROM core.schema_migrations)) p`;
const REPLACED = ['import_batch_unit_check_0005', 'tab_row_tab_check_0005', 'tab_row_key_check_0005'];
const NEW_CHECKS = ['import_batch_unit_check_0006', 'tab_row_tab_check_0006', 'tab_row_key_check_0006'];

test('13: 0006 up, down, up: down restores 0001-0005 exactly; up changes only the three checks, importer login and new objects', async () => {
  const db = await freshDb({ with6: false });
  const p0 = (await q(db, PRINT)).rows[0].p;
  await q(db, readMigration(M6));
  const p1 = (await q(db, PRINT)).rows[0].p;
  await q(db, readMigration(M6_DOWN));
  const p2 = (await q(db, PRINT)).rows[0].p;
  assert.deepEqual(p2, p0, 'down restores everything');
  assert.equal((await q(db, `SELECT count(*)::int n FROM pg_namespace WHERE nspname = 'api'`)).rows[0].n, 0);
  assert.equal((await q(db, `SELECT count(*)::int n FROM pg_roles WHERE rolname IN ('nyc_door','nyc_loader')`)).rows[0].n, 0);
  await q(db, readMigration(M6));
  const p3 = (await q(db, PRINT)).rows[0].p;
  assert.deepEqual(p3, p1, 'up again gives the same result');
  // what up changed against 0001-0005
  const old = new Map(p0.functions.map(f => [f[0], f]));
  for (const f of p1.functions) if (old.has(f[0])) assert.deepEqual(f, old.get(f[0]), `0001-0005 function changed: ${f[0]}`);
  const c0 = p0.checks.filter(c => !REPLACED.includes(c[1]));
  const c1 = p1.checks.filter(c => !NEW_CHECKS.includes(c[1]) && /^research\.(import_batch|tab_row|run_file|packet)$|^core\./.test(c[0]));
  assert.deepEqual(c1, c0.filter(c => /^research\.(import_batch|tab_row|run_file|packet)$|^core\./.test(c[0])));
  assert.deepEqual(p1.views, p0.views);
  assert.deepEqual(p1.triggers.filter(t => t[1] !== 'import_batch_door_guard'), p0.triggers);
  assert.deepEqual(p1.importer, [false, false]); assert.deepEqual(p0.importer, [true, false]);
});

test('13: 0006.down refuses while door batches or nightly rows exist', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => putTab(c, { group: g, tab: 'PEOPLE', rows: rowsFor('PEOPLE', 1), utc: ago(30) }));
  await assert.rejects(q(db, readMigration(M6_DOWN)), /undo/);
});

test('13u: keys valid under 0005 still pass after 0006 (run-file tabs keep their rules)', async () => {
  const db = await freshDb();
  // owner session, like an attended import: one batch per 0005 tab, rows with 0005-valid keys
  const rows = {
    STORIES: [{ story_id: 'ST001' }, 'ST001'], DELIGHTS: [{ delight_id: 'D001' }, 'D001'],
    INDEX: [{ candidate_id: 'us-1852-x' }, 'us-1852-x'], STORY_TEXT: [{ story_id: 'ST001', run_id: 'run-20261116T141651Z' }, 'ST001@run-20261116T141651Z'],
  };
  for (const [tab, [raw, key]] of Object.entries(rows)) {
    const b = (await q(db, `SELECT research.begin_import('nyc', $1, $2::jsonb, now()) b`, [`TAB-${tab}`,
      JSON.stringify({ tabs: { [tab]: [key] }, headers: { [tab]: Object.keys(raw) } })])).rows[0].b;
    await q(db, `INSERT INTO research.tab_row (city_id, import_batch_id, tab, row_key, sheet_row, row_raw) VALUES ('nyc',$1,$2,$3,2,$4)`, [b, tab, key, raw]);
    await q(db, `SELECT research.finish_import($1)`, [b]);
  }
  // and a STORY_TEXT key with a bad run_id is still refused by the constraint
  await assert.rejects(q(db, `INSERT INTO research.tab_row (city_id, import_batch_id, tab, row_key, sheet_row, row_raw) VALUES ('nyc',1,'STORY_TEXT','ST001@x',3,'{"story_id":"ST001","run_id":"x"}')`), /check/);
});
