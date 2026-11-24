// Plan 47 finish S2, item 6: migration 0007. api.tonight() shows a STOPPED or FAIL that comes after the day's
// good row (by run_row_id), instead of the older good row. A later WAIT or SKIPPED keeps the good row; a later
// good row wins again. Nothing else in 0006 changes; the down file restores the 0006 function exactly.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { requireIsolated, freshDb, cleanup, q, withLoader, putTab, tonight, recordResult, tabStatus,
  rowsFor, ago, nyDate, readMigration, M6, M6_DOWN, M7, M7_DOWN } from '../0006/helpers.mjs';

before(requireIsolated);
after(cleanup);

const tabOf = (t, tab) => t.tabs.find(x => x.tab === tab);
// PASS for INDEX (2 rows), then a send with one row missing: STOPPED 'removed keys without approval'
async function passThenStop(c, g) {
  assert.equal((await putTab(c, { group: g, tab: 'INDEX', rows: rowsFor('INDEX', 2), utc: ago(30) })).status, 'PASS');
  const r = await putTab(c, { group: g, tab: 'INDEX', rows: rowsFor('INDEX', 1), utc: ago(20) });
  assert.equal(r.status, 'STOPPED', JSON.stringify(r)); assert.match(r.reason, /removed/);
}
const fnState = async db => (await q(db, `SELECT p.prosrc, pg_get_userbyid(p.proowner) owner, p.prosecdef, p.provolatile, p.proconfig,
    coalesce(p.proacl::text, '') acl FROM pg_proc p WHERE p.oid = 'api.tonight()'::regprocedure`)).rows[0];

test('must-fail (0006 only): a STOPPED after the good row still shows the older good row', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => { await passThenStop(c, g); assert.equal(tabStatus(await tonight(c), 'INDEX'), 'PASS'); });
});

test('0007: STOPPED after the good row shows STOPPED, with its reason; the good copy and times stay', async () => {
  const db = await freshDb({ with7: true }); const g = await nyDate(db);
  await withLoader(db, async c => {
    await passThenStop(c, g);
    const t = tabOf(await tonight(c), 'INDEX');
    assert.equal(t.status, 'STOPPED'); assert.match(t.reason, /removed/);
    assert.ok(t.copy_id, 'copy_id of the good row is still given'); assert.ok(t.last_good_utc);
  });
});

test('0007: FAIL (record_result) after the good row shows FAIL', async () => {
  const db = await freshDb({ with7: true }); const g = await nyDate(db);
  await withLoader(db, async c => {
    assert.equal((await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(30) })).status, 'PASS');
    await recordResult(c, g, [{ tab: 'STORIES', status: 'FAIL', message: 'http 500' }]);
    const t = tabOf(await tonight(c), 'STORIES');
    assert.equal(t.status, 'FAIL'); assert.equal(t.reason, 'http 500');
  });
});

test('0007: a later WAIT or SKIPPED after the good row keeps the good row', async () => {
  const db = await freshDb({ with7: true }); const g = await nyDate(db);
  await withLoader(db, async c => {
    assert.equal((await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(30) })).status, 'PASS');
    assert.equal((await putTab(c, { group: g, tab: 'INDEX', rows: rowsFor('INDEX', 2), utc: ago(30) })).status, 'PASS');
    await recordResult(c, g, [{ tab: 'STORIES', status: 'WAIT', message: 'later run' }, { tab: 'INDEX', status: 'SKIPPED', message: 'busy' }]);
    const t = await tonight(c);
    assert.equal(tabStatus(t, 'STORIES'), 'PASS'); assert.equal(tabStatus(t, 'INDEX'), 'PASS');
    assert.equal(tabOf(t, 'STORIES').reason, null);
  });
});

test('0007: a good row after a STOPPED shows good (both ways); a later NOTHING_NEW after a good row shows good', async () => {
  const db = await freshDb({ with7: true }); const g = await nyDate(db);
  await withLoader(db, async c => {
    await passThenStop(c, g);
    assert.equal(tabStatus(await tonight(c), 'INDEX'), 'STOPPED');
    // the same two rows again, newer copy: no change, so NOTHING_NEW, logged after the STOPPED
    assert.equal((await putTab(c, { group: g, tab: 'INDEX', rows: rowsFor('INDEX', 2), utc: ago(10) })).status, 'NOTHING_NEW');
    const t = tabOf(await tonight(c), 'INDEX');
    assert.equal(t.status, 'NOTHING_NEW'); assert.equal(t.reason, null);
    // a later PASS after a good row
    assert.equal((await putTab(c, { group: g, tab: 'INDEX', rows: rowsFor('INDEX', 3), utc: ago(5) })).status, 'PASS');
    assert.equal(tabStatus(await tonight(c), 'INDEX'), 'PASS');
  });
});

test('0007: a STOPPED with no good row tonight shows STOPPED (as before); other tabs unaffected', async () => {
  const db = await freshDb({ with7: true }); const g = await nyDate(db);
  await withLoader(db, async c => {
    await passThenStop(c, g);
    const r = await putTab(c, { group: g, tab: 'NOT_A_TAB', rows: [], headers: ['x'] });
    assert.equal(r.status, 'STOPPED');
    const t = await tonight(c);
    assert.equal(tabStatus(t, 'STORIES'), 'MISSING');
    assert.equal(t.tabs.length, 8);
  });
});

test('0007: an undone good base batch still shows UNDONE when nothing bad came later', async () => {
  const db = await freshDb({ with7: true }); const g = await nyDate(db);
  await withLoader(db, async c => assert.equal((await putTab(c, { group: g, tab: 'INDEX', rows: rowsFor('INDEX', 2), utc: ago(20) })).status, 'PASS'));
  const b = (await q(db, `SELECT max(batch_id) b FROM research.import_batch WHERE unit_id = 'TAB-INDEX'`)).rows[0].b;
  await q(db, `SELECT research.undo_import($1)`, [b]);
  await withLoader(db, async c => assert.equal(tabStatus(await tonight(c), 'INDEX'), 'UNDONE'));
});

test('0007 catalog: same owner, security definer, settings and grants as 0006; only nyc_loader may run it; migration row', async () => {
  const db6 = await freshDb(); const before6 = await fnState(db6);
  const db7 = await freshDb({ with7: true }); const after7 = await fnState(db7);
  for (const k of ['owner', 'prosecdef', 'provolatile', 'proconfig', 'acl']) assert.deepEqual(after7[k], before6[k], k);
  assert.equal(after7.owner, 'nyc_door');
  assert.notEqual(after7.prosrc, before6.prosrc);
  assert.equal((await q(db7, `SELECT count(*)::int n FROM core.schema_migrations WHERE version = '0007'`)).rows[0].n, 1);
  // nobody but the owner can use nyc_door afterwards (temporary membership gone)
  assert.equal((await q(db7, `SELECT count(*)::int n FROM pg_auth_members WHERE roleid = 'nyc_door'::regrole AND (inherit_option OR set_option)`)).rows[0].n, 0);
});

test('0007 refuses twice, and without 0006', async () => {
  const db7 = await freshDb({ with7: true });
  await assert.rejects(q(db7, readMigration(M7)), /0007 already applied/);
  const db5 = await freshDb({ with6: false });
  await assert.rejects(q(db5, readMigration(M7)), /0006 not applied/);
});

test('0007 down: tonight() body equals 0006 exactly again and the old behaviour returns; then 0006 down still works', async () => {
  const db6 = await freshDb(); const src6 = (await fnState(db6)).prosrc;
  const db = await freshDb({ with7: true });
  await q(db, readMigration(M7_DOWN));
  const s = await fnState(db);
  assert.equal(s.prosrc, src6); assert.equal(s.owner, 'nyc_door');
  assert.equal((await q(db, `SELECT count(*)::int n FROM core.schema_migrations WHERE version = '0007'`)).rows[0].n, 0);
  const g = await nyDate(db);
  await withLoader(db, async c => { await passThenStop(c, g); assert.equal(tabStatus(await tonight(c), 'INDEX'), 'PASS'); });
  // the way back order (plan 47 finish, drill 6): 0007 down, then 0006 down
  const empty = await freshDb({ with7: true });
  await q(empty, readMigration(M7_DOWN));
  await q(empty, readMigration(M6_DOWN));
});

test('0007 up and down as a non-superuser CREATEROLE owner (like Neon neondb_owner)', async () => {
  await q('postgres', `DROP ROLE IF EXISTS owner47`).catch(() => {});
  await cleanup();
  await q('postgres', `DO $$BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN CREATE ROLE authenticator LOGIN NOINHERIT; END IF; END$$`);
  await q('postgres', `CREATE ROLE owner47 LOGIN CREATEROLE`);
  const name = `door_t_owner7_${process.pid}`;
  await q('postgres', `DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  await q('postgres', `CREATE DATABASE ${name} OWNER owner47`);
  await q(name, `CREATE EXTENSION postgis`);
  try {
    for (const f of ['0001_init.sql', '0002_before_import.sql', '0003_research_import.sql', '0004_importer_role.sql', '0005_import_build_40.sql', M6, M7]) {
      await q(name, readMigration(f), [], 'owner47');
    }
    const m = (await q(name, `SELECT admin_option, inherit_option, set_option FROM pg_auth_members
        WHERE roleid = 'nyc_door'::regrole AND member = 'owner47'::regrole`)).rows;
    assert.deepEqual(m, [{ admin_option: true, inherit_option: false, set_option: false }]);
    const g = await nyDate(name);
    await withLoader(name, async c => { await passThenStop(c, g); assert.equal(tabStatus(await tonight(c), 'INDEX'), 'STOPPED'); });
    await q(name, readMigration(M7_DOWN), [], 'owner47');
    assert.deepEqual((await q(name, `SELECT admin_option, inherit_option, set_option FROM pg_auth_members
        WHERE roleid = 'nyc_door'::regrole AND member = 'owner47'::regrole`)).rows, [{ admin_option: true, inherit_option: false, set_option: false }]);
    await withLoader(name, async c => assert.equal(tabStatus(await tonight(c), 'INDEX'), 'PASS'));
  } finally {
    await q('postgres', `DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    for (const r of ['nyc_loader', 'nyc_door', 'importer', 'owner47']) await q('postgres', `DROP ROLE IF EXISTS ${r}`).catch(() => {});
  }
});
