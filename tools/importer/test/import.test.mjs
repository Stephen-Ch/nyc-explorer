// Tests for the plan 05 importer. Run ONLY on a throwaway PostgreSQL 16+ server used for nothing else, with
// IMPORT_TEST_ISOLATED=1 set (the tests create and drop the server-wide role 'importer'). The server needs:
//   - IMPORT_TEST_PGHOST (default /tmp) is reachable as superuser IMPORT_TEST_PGSUPER (default postgres) without a password,
//   - role 'importer' can log in without a password (trust auth), which 0004 creates.
// Each test gets a fresh database with migrations 0001-0004 and runs the importer AS the importer role.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import { runImport, parseFileName, splitLines } from '../lib.mjs';

const HOST = process.env.IMPORT_TEST_PGHOST || '/tmp';
const SUPER = process.env.IMPORT_TEST_PGSUPER || 'postgres';
const REPO = path.resolve(import.meta.dirname, '../../..');
const MIGRATIONS = ['0001_init.sql', '0002_before_import.sql', '0003_research_import.sql', '0004_importer_role.sql']
  .map(f => fs.readFileSync(path.join(REPO, 'db/migrations', f), 'utf8'));

const md5 = b => crypto.createHash('md5').update(b).digest('hex');
const RUN1 = 'run-20261104T050256Z', RUN2 = 'run-20261104T060205Z', RUN3 = 'run-20261104T070248Z';
const STORY_HEADERS = ['story_id','tier (delight/record)','check_label','place','address','zone','index_place_id','story_date',
  'map_years (standing confirmed)','notable_name','hook (fresh wording)','original_source','original_link','original_quote',
  'pointer_source (modern, credit only)','skeptic_verdict','grade','new_vs_index_wiki','notes','added','run_id','skeptic_file'];

let dbCount = 0;
const made = [];
async function superQuery(db, sql) {
  const c = new pg.Client({ host: HOST, user: SUPER, database: db });
  await c.connect();
  try { return await c.query(sql); } finally { await c.end(); }
}
// Only on a server set aside for these tests (ChatGPT build review 2, finding 2)
before(() => {
  if (process.env.IMPORT_TEST_ISOLATED !== '1') throw new Error('set IMPORT_TEST_ISOLATED=1, and only on a throwaway test server: these tests drop the role importer');
});
const ident = n => '"' + n.replace(/"/g, '""') + '"';
// only the databases this run made, then the server-wide importer role
async function dropTestDbs() {
  for (const d of made.splice(0)) await superQuery('postgres', `DROP DATABASE IF EXISTS ${ident(d)} WITH (FORCE)`);
  try { await superQuery('postgres', 'DROP ROLE IF EXISTS importer'); }
  catch (e) { throw new Error(`role importer is still used by a database this run did not make (${e.message}); clean the test server by hand`); }
}
async function freshDb() {
  // 0004 now refuses a role that already exists (ChatGPT build review 1, finding 4): drop earlier test
  // databases and the role first, so each test starts from a server with no importer role.
  await dropTestDbs();
  const name = `imp_t_${process.pid}_${++dbCount}`;
  await superQuery('postgres', `CREATE DATABASE ${ident(name)}`);
  made.push(name);
  const c = new pg.Client({ host: HOST, user: SUPER, database: name });
  await c.connect();
  for (const m of MIGRATIONS) {
    // 0004 creates the role only if missing (roles are shared by all databases of the server)
    await c.query(m);
  }
  await c.end();
  return name;
}
after(async () => { for (const d of made) await superQuery('postgres', `DROP DATABASE IF EXISTS ${ident(d)} WITH (FORCE)`).catch(() => {}); });

// one temp world per test: sync folder, imports root, config
function world(db, { tryDb = db, prodDb = db } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'imp-'));
  const sync = path.join(root, 'overnight'); fs.mkdirSync(sync);
  const imports = path.join(root, 'imports'); fs.mkdirSync(imports);
  const config = {
    syncFolder: sync, importsRoot: imports, user: 'importer',
    targets: { try: { host: HOST, database: tryDb, ssl: false }, prod: { host: 'localhost', database: prodDb, ssl: false } }
  };
  return { root, sync, imports, config, n: 0 };
}
function putFile(w, name, text) {
  const b = Buffer.isBuffer(text) ? text : Buffer.from(text, 'utf8');
  fs.writeFileSync(path.join(w.sync, name), b);
  return { drive_id: 'd-' + name.replace(/[^A-Za-z0-9]/g, '').slice(-40), name, md5: md5(b), size: b.length,
           modified_utc: '2026-11-04T10:00:00Z', revision: null };
}
// manifest.json, plus drive-listing.json = the raw remote Drive folder listing (by default: exactly the manifest files)
function manifest(w, m, { listing } = {}) {
  const dir = path.join(w.imports, `2026-11-09-${m.unit}-${++w.n}`);
  fs.mkdirSync(dir);
  const created = new Date(Date.now() - 1000 * (100 - w.n)).toISOString();
  const full = { created_utc: created, city: 'nyc', ...m };
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(full, null, 2));
  if (!m.unit.startsWith('TAB-') && listing !== null) {
    const files = listing ?? (m.files ?? []).map(f => ({ id: f.drive_id, name: f.name, md5Checksum: f.md5 }));
    fs.writeFileSync(path.join(dir, 'drive-listing.json'), JSON.stringify({ listed_utc: created, folder_id: '1FBC1-UVjPWVjPyRUX-nzY4HQiV3JOSoD', next_page_token: null, files }));
  }
  return dir;
}
const pk = (cand, extra = {}) => JSON.stringify({ candidate_id: cand, place_id: cand.replace(/^us-1852-/, ''), unit_id: 'US-1852',
  disposition: 'B', skeptic: { checked: true, changed: 'none', notes: '' }, ...extra });
const go = (w, target = 'try', opts = {}) => runImport({ config: w.config, target, password: 'x', quiet: true, ...opts });
async function q(db, sql, params) {
  const c = new pg.Client({ host: HOST, user: SUPER, database: db }); await c.connect();
  try { return (await c.query(sql, params)).rows; } finally { await c.end(); }
}

function stories(rows) {
  const esc = v => /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  const line = cells => STORY_HEADERS.map((h, i) => esc(cells[i] ?? '')).join(',');
  return [STORY_HEADERS.map(esc).join(','), ...rows.map(r => line(r))].join('\r\n') + '\r\n';
}
function putCsv(w, dir, text) {
  const b = Buffer.from(text, 'utf8');
  fs.writeFileSync(path.join(dir, 'STORIES.csv'), b);
  return crypto.createHash('sha256').update(b).digest('hex');
}
function tabManifest(w, text) {
  const dir = manifest(w, { unit: 'TAB-STORIES', tab: 'STORIES', csv: 'STORIES.csv', csv_sha256: 'later', sheet_read_utc: new Date(Date.now() - 600e3).toISOString() });
  const sha = putCsv(w, dir, text);
  const mf = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); mf.csv_sha256 = sha;
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(mf));
  return dir;
}

// ---------------------------------------------------------------- pure helpers
test('file names map to kinds; unknown kinds and run ids are refused', () => {
  assert.deepEqual(parseFileName('US-1852__run-20261104T050256Z.jsonl'), { unit: 'US-1852', run_id: RUN1, kind: 'packets', retry: false });
  assert.equal(parseFileName('US-1852__run-20261104T050256Z.md').kind, 'notes');
  assert.equal(parseFileName('US-1852__run-20261104T050256Z__sources.md').kind, 'sources');
  assert.deepEqual(parseFileName('US-1852__run-20261104T050256Z__skeptic-3-retry.md'), { unit: 'US-1852', run_id: RUN1, kind: 'skeptic', retry: true });
  assert.equal(parseFileName('ST-N-1852__run-20261109T145045Z__story-skeptic-6.md').kind, 'story-skeptic');
  assert.equal(parseFileName('ST-N-1852__run-20261109T145045Z__story-fragments.md').kind, 'story-fragments');
  assert.throws(() => parseFileName('ST-SQ-1852__run-20261108T212944Z__story-sources.md'), /kind/);
  assert.throws(() => parseFileName('MN06-1852__backfill-20261030T180544Z.jsonl'), /run id/);
  assert.throws(() => parseFileName('US-1852__run-20261104T050256Z (1).jsonl'), /copy/);
});
test('lines split like the database (one final newline dropped, CR trimmed)', () => {
  assert.deepEqual(splitLines('a\r\nb\n'), ['a', 'b']);
  assert.deepEqual(splitLines('a\nb'), ['a', 'b']);
});

// ---------------------------------------------------------------- unit imports
test('good import, then re-run is nothing new and keeps no batch', async () => {
  const db = await freshDb(); const w = world(db);
  const files = [
    putFile(w, `US-1852__${RUN1}.jsonl`, pk('us-1852-a') + '\n' + pk('us-1852-b', { place_id: undefined, disposition: 'A' }) + '\n'),
    putFile(w, `US-1852__${RUN1}.md`, 'notes é\n'),
    putFile(w, `US-1852__${RUN1}__skeptic-1-retry.md`, 'skeptic\n'),
  ];
  manifest(w, { unit: 'US-1852', files });
  const r = await go(w);
  assert.equal(r.status, 'PASS', r.error);
  assert.equal(r.counts.packets, 2); assert.equal(r.counts.run_files, 3);
  const rows = await q(db, `SELECT candidate_id, place_id_db, disposition_final::text d, skeptic_changed FROM research.packet ORDER BY 1`);
  assert.deepEqual(rows, [{ candidate_id: 'us-1852-a', place_id_db: 'nyc-a', d: 'B', skeptic_changed: 'none' },
                          { candidate_id: 'us-1852-b', place_id_db: null, d: 'A', skeptic_changed: 'none' }]);
  assert.equal((await q(db, `SELECT retry FROM research.run_file WHERE kind='skeptic'`))[0].retry, true);
  const again = await go(w);
  assert.equal(again.status, 'NOTHING_NEW');
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch`))[0].n, 1);
  assert.match(fs.readFileSync(path.join(w.imports, '2026-11-09-US-1852-1', 'import-log.txt'), 'utf8'), /PASS[\s\S]*NOTHING NEW/);
});

test('md5 mismatch, BOM, NUL, bad UTF-8, secrets, a (1) copy and a missing file are refused before any write', async () => {
  const db = await freshDb(); const w = world(db);
  // md5
  let f = putFile(w, `US-1852__${RUN1}.md`, 'hi\n'); f.md5 = '0'.repeat(32);
  manifest(w, { unit: 'US-1852', files: [f] });
  assert.match((await go(w)).error, /Drive may still be syncing/);
  // BOM
  f = putFile(w, `US-1852__${RUN1}.md`, Buffer.from([0xef, 0xbb, 0xbf, 0x68, 0x69]));
  manifest(w, { unit: 'US-1852', files: [f] });
  assert.match((await go(w)).error, /byte-order mark/);
  // NUL
  f = putFile(w, `US-1852__${RUN1}.md`, Buffer.from('a\u0000b'));
  manifest(w, { unit: 'US-1852', files: [f] });
  assert.match((await go(w)).error, /NUL/);
  // invalid UTF-8
  f = putFile(w, `US-1852__${RUN1}.md`, Buffer.from([0x61, 0xff, 0x62]));
  manifest(w, { unit: 'US-1852', files: [f] });
  assert.match((await go(w)).error, /UTF-8/);
  // secret
  f = putFile(w, `US-1852__${RUN1}.md`, 'see postgresql://bob:hunter2@ep-x.neon.tech/db');
  manifest(w, { unit: 'US-1852', files: [f] });
  const sec = await go(w);
  assert.match(sec.error, /secret/); assert.doesNotMatch(sec.error, /hunter2/);
  // a "(1)" copy beside the file
  f = putFile(w, `US-1852__${RUN1}.md`, 'hi\n');
  fs.writeFileSync(path.join(w.sync, `US-1852__${RUN1} (1).md`), 'other');
  manifest(w, { unit: 'US-1852', files: [f] });
  assert.match((await go(w)).error, /copy/);
  fs.unlinkSync(path.join(w.sync, `US-1852__${RUN1} (1).md`));
  // missing
  manifest(w, { unit: 'US-1852', files: [{ ...f, name: `US-1852__${RUN2}.md` }] });
  assert.match((await go(w)).error, /missing/);
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch`))[0].n, 0);
});

test('resumed runs: supersede inside one batch and across batches; older-after-newer refused', async () => {
  const db = await freshDb(); const w = world(db);
  const a1 = putFile(w, `US-1852__${RUN1}.jsonl`, pk('us-1852-a') + '\n');
  const a2 = putFile(w, `US-1852__${RUN2}.jsonl`, pk('us-1852-a', { disposition: 'C', skeptic: { checked: true, changed: 'downgraded', notes: '' } }) + '\n');
  manifest(w, { unit: 'US-1852', files: [a2, a1] });         // order in the manifest must not matter
  const r = await go(w);
  assert.equal(r.status, 'PASS', r.error);
  assert.equal(r.counts.packets_superseded, 1);
  let live = await q(db, `SELECT run_id FROM research.packet WHERE review_state='pending'`);
  assert.deepEqual(live, [{ run_id: RUN2 }]);
  // across batches
  const a3 = putFile(w, `US-1852__${RUN3}.jsonl`, pk('us-1852-a', { n: 3 }) + '\n');
  manifest(w, { unit: 'US-1852', files: [a1, a2, a3] });
  assert.equal((await go(w)).status, 'PASS');
  live = await q(db, `SELECT run_id FROM research.packet WHERE review_state='pending'`);
  assert.deepEqual(live, [{ run_id: RUN3 }]);
  // an OLDER run arriving after a newer one is stored
  const a0 = putFile(w, `US-1852__run-20261104T040000Z.jsonl`, pk('us-1852-a', { n: 0 }) + '\n');
  manifest(w, { unit: 'US-1852', files: [a0, a1, a2, a3] });
  assert.match((await go(w)).error, /newer run/);
});

test('a stored Drive file with different content stops the import', async () => {
  const db = await freshDb(); const w = world(db);
  const f = putFile(w, `US-1852__${RUN1}.md`, 'one\n');
  manifest(w, { unit: 'US-1852', files: [f] });
  assert.equal((await go(w)).status, 'PASS');
  const g = putFile(w, `US-1852__${RUN1}.md`, 'two\n'); g.drive_id = f.drive_id;
  manifest(w, { unit: 'US-1852', files: [g] });
  assert.match((await go(w)).error, /changed since it was imported/);
});

test('packet rules: duplicate candidate in a file, blank line, unknown disposition, wrong unit', async () => {
  const db = await freshDb(); const w = world(db);
  const cases = [
    [pk('us-1852-a') + '\n' + pk('us-1852-a') + '\n', /twice/],
    [pk('us-1852-a') + '\n\n' + pk('us-1852-b') + '\n', /blank line/],
    [pk('us-1852-a', { disposition: 'maybe' }) + '\n', /disposition/],
    [pk('us-1852-a', { disposition: 'dropped', skeptic: undefined }) + '\n', null],   // dropped with no skeptic record is allowed
    [JSON.stringify({ candidate_id: 'us-1877-x', disposition: 'B' }) + '\n', /does not belong/],
  ];
  for (const [text, err] of cases) {
    const f = putFile(w, `US-1852__${RUN1}.jsonl`, text);
    manifest(w, { unit: 'US-1852', files: [f] });
    const r = await go(w);
    if (err) assert.match(r.error ?? '', err); else assert.equal(r.status, 'PASS', r.error);
  }
  assert.deepEqual(await q(db, `SELECT disposition_final, skeptic_changed FROM research.packet`), [{ disposition_final: null, skeptic_changed: 'dropped' }]);
});

test('manifest: older than 24 hours refused; unit name typed wrong for production refused', async () => {
  const db = await freshDb(); const w = world(db);
  const f = putFile(w, `US-1852__${RUN1}.md`, 'x\n');
  const dir = manifest(w, { unit: 'US-1852', files: [f] });
  const mf = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  mf.created_utc = new Date(Date.now() - 25 * 3600e3).toISOString();
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(mf));
  assert.match((await go(w)).error, /older than 24 hours/);
  manifest(w, { unit: 'US-1852', files: [f] });
  const r = await go(w, 'prod', { confirmUnit: async () => 'US-1877' });
  assert.match(r.error, /typed/);
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch`))[0].n, 0);
  const ok = await go(w, 'prod', { confirmUnit: async () => 'US-1852' });
  assert.equal(ok.status, 'PASS', ok.error);
});

test('targets: equal or empty hosts refused; unknown target refused; not logged in as importer refused', async () => {
  const db = await freshDb(); const w = world(db);
  const f = putFile(w, `US-1852__${RUN1}.md`, 'x\n');
  manifest(w, { unit: 'US-1852', files: [f] });
  const same = structuredClone(w.config); same.targets.prod.host = same.targets.try.host;
  assert.match((await runImport({ config: same, target: 'try', password: 'x', quiet: true })).error, /hosts/);
  const empty = structuredClone(w.config); empty.targets.prod.host = '';
  assert.match((await runImport({ config: empty, target: 'try', password: 'x', quiet: true })).error, /hosts/);
  assert.match((await go(w, 'staging')).error, /target/);
  const sup = structuredClone(w.config); sup.user = SUPER;
  assert.match((await runImport({ config: sup, target: 'try', password: 'x', quiet: true })).error, /importer/);
  const ssl = structuredClone(w.config); ssl.targets.try.host = 'ep-x.neon.tech'; ssl.targets.try.ssl = false;
  ssl.targets.prod = { host: 'ep-morning-hill-b4nfx1pk.c-6.us-east-2.aws.neon.tech', database: 'neondb' };
  assert.match((await runImport({ config: ssl, target: 'try', password: 'x', quiet: true })).error, /ssl/);
  assert.match((await runImport({ config: w.config, target: 'try', password: '', quiet: true })).error, /NYC_IMPORT_PW/);
});

test('a second import waits for the first; its checks then see the first one (nothing new)', async () => {
  const db = await freshDb(); const w = world(db);
  const f = putFile(w, `US-1852__${RUN1}.jsonl`, pk('us-1852-a') + '\n');
  manifest(w, { unit: 'US-1852', files: [f] });
  let release; const hold = new Promise(r => { release = r; });
  let entered; const inA = new Promise(r => { entered = r; });
  const A = go(w, 'try', { afterBegin: async () => { entered(); await hold; } });
  await inA;
  let bDone = false;
  const B = go(w).then(x => { bDone = true; return x; });
  await new Promise(r => setTimeout(r, 700));
  assert.equal(bDone, false, 'B must wait for the import lock');
  release();
  assert.equal((await A).status, 'PASS');
  assert.equal((await B).status, 'NOTHING_NEW');
});

// ---------------------------------------------------------------- tab imports
test('tab: import, nothing new, change, move, removal; quoted newline kept', async () => {
  const db = await freshDb(); const w = world(db);
  const row = (id, hook, extra = {}) => { const r = Array(STORY_HEADERS.length).fill(''); r[0] = id; r[10] = hook; for (const [k, v] of Object.entries(extra)) r[STORY_HEADERS.indexOf(k)] = v; return r; };
  tabManifest(w, stories([row('ST001', 'one'), row('ST002', 'two "quoted"\nsecond line'), Array(STORY_HEADERS.length).fill('')]));
  let r = await go(w);
  assert.equal(r.status, 'PASS', r.error);
  assert.equal(r.counts.tab_rows, 2);
  assert.equal((await q(db, `SELECT row_raw->>'hook (fresh wording)' h FROM research.tab_row WHERE row_key='ST002'`))[0].h, 'two "quoted"\nsecond line');
  tabManifest(w, stories([row('ST001', 'one'), row('ST002', 'two "quoted"\nsecond line')]));
  assert.equal((await go(w)).status, 'NOTHING_NEW');
  // ST001 changed, ST002 moved down a row, ST003 new
  tabManifest(w, stories([row('ST001', 'one, edited'), Array(STORY_HEADERS.length).fill(''), row('ST002', 'two "quoted"\nsecond line'), row('ST003', 'three')]));
  r = await go(w);
  assert.equal(r.status, 'PASS', r.error);
  assert.equal(r.counts.tab_rows, 3); assert.equal(r.counts.tab_rows_retired, 2);
  assert.deepEqual(await q(db, `SELECT row_key, sheet_row FROM research.tab_row WHERE live ORDER BY 1`),
    [{ row_key: 'ST001', sheet_row: 2 }, { row_key: 'ST002', sheet_row: 4 }, { row_key: 'ST003', sheet_row: 5 }]);
  // ST002 gone from the tab
  tabManifest(w, stories([row('ST001', 'one, edited'), row('ST003', 'three')]));
  r = await go(w);
  assert.equal(r.status, 'PASS', r.error);
  assert.deepEqual(await q(db, `SELECT row_key FROM research.tab_row WHERE removed_from_tab`), [{ row_key: 'ST002' }]);
  // ST003 now at row 3 (moved) -> retired and re-added
  assert.deepEqual((await q(db, `SELECT row_key FROM research.tab_row WHERE live ORDER BY 1`)).map(x => x.row_key), ['ST001', 'ST003']);
});

test('tab refusals: CSV changed after its hash, half-filled row, header change, duplicate id', async () => {
  const db = await freshDb(); const w = world(db);
  const row = (id, hook) => { const r = Array(STORY_HEADERS.length).fill(''); r[0] = id; r[10] = hook; return r; };
  const dir = tabManifest(w, stories([row('ST001', 'one')]));
  fs.appendFileSync(path.join(dir, 'STORIES.csv'), 'x');
  assert.match((await go(w)).error, /sha256/);
  tabManifest(w, stories([row('ST001', 'one'), row('', 'orphan hook')]));
  assert.match((await go(w)).error, /row 3/);
  tabManifest(w, stories([row('ST001', 'one')]).replace('notable_name', 'notable name'));
  assert.match((await go(w)).error, /headers/);
  tabManifest(w, stories([row('ST001', 'one'), row('ST001', 'again')]));
  assert.match((await go(w)).error, /twice/);
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch`))[0].n, 0);
});

// ---------------------------------------------------------------- review 1 additions
test('hosts: a pooled host, or the same Neon endpoint under two names, is refused', async () => {
  const db = await freshDb(); const w = world(db);
  const f = putFile(w, `US-1852__${RUN1}.md`, 'x\n');
  manifest(w, { unit: 'US-1852', files: [f] });
  const c1 = structuredClone(w.config);
  c1.targets.prod = { host: 'ep-morning-hill-b4nfx1pk.c-6.us-east-2.aws.neon.tech', database: 'neondb' };
  c1.targets.try = { host: 'ep-morning-hill-b4nfx1pk-pooler.c-6.us-east-2.aws.neon.tech', database: 'neondb' };
  assert.match((await runImport({ config: c1, target: 'try', password: 'x', quiet: true })).error, /pooled|same Neon endpoint/);
  c1.targets.try = { host: 'ep-other-b4aaaaaa-pooler.c-6.us-east-2.aws.neon.tech', database: 'neondb' };
  assert.match((await runImport({ config: c1, target: 'try', password: 'x', quiet: true })).error, /pooled/);
  c1.targets.try = { host: 'EP-MORNING-HILL-B4NFX1PK.c-6.us-east-2.aws.neon.tech', database: 'neondb' };
  assert.match((await runImport({ config: c1, target: 'try', password: 'x', quiet: true })).error, /same Neon endpoint/);
});

test('tab: a header-only CSV with nothing stored is nothing new', async () => {
  const db = await freshDb(); const w = world(db);
  tabManifest(w, stories([]));
  assert.equal((await go(w)).status, 'NOTHING_NEW');
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch`))[0].n, 0);
});

test('a packet from the same run already stored (different Drive id) stops the import', async () => {
  const db = await freshDb(); const w = world(db);
  const f = putFile(w, `US-1852__${RUN1}.jsonl`, pk('us-1852-a') + '\n');
  manifest(w, { unit: 'US-1852', files: [f] });
  assert.equal((await go(w)).status, 'PASS');
  const g = putFile(w, `US-1852__${RUN1}.jsonl`, pk('us-1852-a', { n: 2 }) + '\n'); g.drive_id = 'd-other-file-id-0123456789abc';
  manifest(w, { unit: 'US-1852', files: [g] });
  assert.match((await go(w)).error, /same run/);
});

test('a database refusal after some writes keeps nothing', async () => {
  const db = await freshDb(); const w = world(db);
  const files = [putFile(w, `US-1852__${RUN1}.md`, 'notes\n'),
                 putFile(w, `US-1852__${RUN1}.jsonl`, pk('us-1852-a') + '\n' + pk('us-1852-b', { place_id: 'Bad_Id' }) + '\n')];
  manifest(w, { unit: 'US-1852', files });
  const r = await go(w);
  assert.equal(r.status, 'FAIL'); assert.match(r.error, /check|23514/);
  assert.deepEqual(await q(db, `SELECT (SELECT count(*) FROM research.import_batch)::int b, (SELECT count(*) FROM research.run_file)::int f`), [{ b: 0, f: 0 }]);
});

test('the password never reaches the result or the log; other secret patterns are refused', async () => {
  const db = await freshDb(); const w = world(db);
  const pw = 'S3cr%!^&"pw-xyz';
  let f = putFile(w, `US-1852__${RUN1}.md`, 'x\n'); f.md5 = '0'.repeat(32);
  const dir = manifest(w, { unit: 'US-1852', files: [f] });
  const r = await runImport({ config: w.config, target: 'try', password: pw, quiet: true });
  assert.ok(!JSON.stringify(r).includes(pw));
  assert.ok(!fs.readFileSync(path.join(dir, 'import-log.txt'), 'utf8').includes(pw));
  for (const text of ['host=x password=abc', 'token npg_AbCdEf123456', '-----BEGIN OPENSSH PRIVATE KEY-----']) {
    f = putFile(w, `US-1852__${RUN1}.md`, text);
    manifest(w, { unit: 'US-1852', files: [f] });
    assert.match((await go(w)).error, /secret/, text);
  }
});

test('a failed COMMIT is reported as UNKNOWN with the batch id, not as "nothing kept"', async () => {
  const db = await freshDb(); const w = world(db);
  const f = putFile(w, `US-1852__${RUN1}.md`, 'x\n');
  const dir = manifest(w, { unit: 'US-1852', files: [f] });
  const r = await go(w, 'try', { beforeCommit: async (client) => {
    const pid = (await client.query('SELECT pg_backend_pid() p')).rows[0].p;
    await q(db, 'SELECT pg_terminate_backend($1)', [pid]);
  } });
  assert.equal(r.status, 'UNKNOWN', r.error);
  assert.match(r.error, /batch [0-9]+/);
  assert.match(fs.readFileSync(path.join(dir, 'import-log.txt'), 'utf8'), /UNKNOWN/);
});

// ---------------------------------------------------------------- ChatGPT build review 1
test('inventory: a unit file in the Drive folder that the manifest leaves out stops the import', async () => {
  const db = await freshDb(); const w = world(db);
  const a = putFile(w, `US-1852__${RUN1}.jsonl`, pk('us-1852-a') + '\n');
  putFile(w, `US-1852__${RUN1}__skeptic-1.md`, 'skeptic\n');          // in the folder, not in the manifest
  putFile(w, `US-1877__${RUN1}.md`, 'other unit\n');                    // other units are not this import's business
  manifest(w, { unit: 'US-1852', files: [a] });
  const r = await go(w);
  assert.match(r.error ?? '', /not in the manifest/); assert.match(r.error, /skeptic-1/);
  // a unit file whose name the importer can't read also stops it
  fs.unlinkSync(path.join(w.sync, `US-1852__${RUN1}__skeptic-1.md`));
  fs.writeFileSync(path.join(w.sync, `US-1852__${RUN1}__story-sources.md`), 'x');
  manifest(w, { unit: 'US-1852', files: [a] });
  assert.match((await go(w)).error ?? '', /story-sources/);
  fs.unlinkSync(path.join(w.sync, `US-1852__${RUN1}__story-sources.md`));
  manifest(w, { unit: 'US-1852', files: [a] });
  assert.equal((await go(w)).status, 'PASS');
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch`))[0].n, 1);
});

test('manifest: a blank or malformed Drive id is refused before the database is touched', async () => {
  const db = await freshDb(); const w = world(db);
  for (const bad of ['', '   ', 'short', 'has space in it 0123456789', null, 42]) {
    const f = putFile(w, `US-1852__${RUN1}.md`, 'x\n'); f.drive_id = bad;
    manifest(w, { unit: 'US-1852', files: [f] });
    assert.match((await go(w)).error ?? '', /Drive id/, String(bad));
  }
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch`))[0].n, 0);
});

test('targets: production endpoint is pinned; trial can never point at it; only Neon hosts', async () => {
  const db = await freshDb(); const w = world(db);
  const f = putFile(w, `US-1852__${RUN1}.md`, 'x\n');
  manifest(w, { unit: 'US-1852', files: [f] });
  const PROD = 'ep-morning-hill-b4nfx1pk.c-6.us-east-2.aws.neon.tech';
  const run = c => runImport({ config: c, target: 'try', password: 'x', quiet: true });
  const c = structuredClone(w.config);
  // trial mistakenly set to production, production set to some other endpoint
  c.targets.try = { host: PROD, database: 'neondb' };
  c.targets.prod = { host: 'ep-other-b4aaaaaa.c-6.us-east-2.aws.neon.tech', database: 'neondb' };
  assert.match((await run(c)).error ?? '', /production/);
  // production host that is not the pinned endpoint
  c.targets.try = { host: 'ep-try-b4bbbbbb.c-6.us-east-2.aws.neon.tech', database: 'neondb' };
  assert.match((await run(c)).error ?? '', /production/);
  // a host that is not Neon
  c.targets.prod = { host: PROD, database: 'neondb' };
  c.targets.try = { host: 'db.example.com', database: 'neondb' };
  assert.match((await run(c)).error ?? '', /Neon/);
  c.targets.try = { host: 'ep-try-b4bbbbbb.neon.tech.evil.com', database: 'neondb' };
  assert.match((await run(c)).error ?? '', /Neon/);
  // one local, one Neon: refused (local hosts are for tests only)
  c.targets.try = { host: 'localhost', database: 'neondb', ssl: false };
  assert.match((await run(c)).error ?? '', /Neon/);
});

test('0004 refuses to run when a role named importer already exists', async () => {
  const name = `imp_t_${process.pid}_${++dbCount}`;
  await dropTestDbs();
  await superQuery('postgres', 'CREATE ROLE importer LOGIN');
  await superQuery('postgres', `CREATE DATABASE ${ident(name)}`); made.push(name);
  const c = new pg.Client({ host: HOST, user: SUPER, database: name }); await c.connect();
  try {
    for (const m of MIGRATIONS.slice(0, 3)) await c.query(m);
    await assert.rejects(c.query(MIGRATIONS[3]), /already exists/);
    await c.query('ROLLBACK');
    assert.equal((await c.query(`SELECT count(*)::int n FROM core.schema_migrations WHERE version='0004'`)).rows[0].n, 0);
  } finally { await c.end(); }
});

test('tab: sheet_read_utc must be a valid UTC time, not in the future, not after the manifest', async () => {
  const db = await freshDb(); const w = world(db);
  const row = (id, hook) => { const r = Array(STORY_HEADERS.length).fill(''); r[0] = id; r[10] = hook; return r; };
  for (const bad of [undefined, '', 'yesterday', '2026-11-09 12:00', new Date(Date.now() + 3600e3).toISOString()]) {
    const dir = tabManifest(w, stories([row('ST001', 'one')]));
    const mf = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    if (bad === undefined) delete mf.sheet_read_utc; else mf.sheet_read_utc = bad;
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(mf));
    assert.match((await go(w)).error ?? '', /sheet_read_utc/, String(bad));
  }
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch`))[0].n, 0);
});

test('a second import gives up cleanly when the lock wait passes the time limit', async () => {
  const db = await freshDb(); const w = world(db);
  const f = putFile(w, `US-1852__${RUN1}.jsonl`, pk('us-1852-a') + '\n');
  manifest(w, { unit: 'US-1852', files: [f] });
  let release; const hold = new Promise(r => { release = r; });
  let entered; const inA = new Promise(r => { entered = r; });
  const A = go(w, 'try', { afterBegin: async () => { entered(); await hold; } });
  await inA;
  const B = await go(w, 'try', { timeouts: { lockMs: 800 } });
  assert.equal(B.status, 'FAIL'); assert.match(B.error, /another import/);
  release();
  assert.equal((await A).status, 'PASS');
});

test('the session gets lock, statement and idle time limits', async () => {
  const db = await freshDb(); const w = world(db);
  const f = putFile(w, `US-1852__${RUN1}.md`, 'x\n');
  manifest(w, { unit: 'US-1852', files: [f] });
  let seen;
  const r = await go(w, 'try', { afterBegin: async (client) => {
    seen = (await client.query(`SELECT current_setting('lock_timeout') l, current_setting('statement_timeout') s,
      current_setting('idle_in_transaction_session_timeout') i`)).rows[0];
  } });
  assert.equal(r.status, 'PASS', r.error);
  for (const v of Object.values(seen)) assert.notEqual(v, '0', JSON.stringify(seen));
});

// ---------------------------------------------------------------- ChatGPT build review 2
test('remote Drive listing: required, and its unit files must equal the manifest by Drive id, name and md5', async () => {
  const db = await freshDb(); const w = world(db);
  const a = putFile(w, `US-1852__${RUN1}.jsonl`, pk('us-1852-a') + '\n');
  const b = putFile(w, `US-1852__${RUN1}.md`, 'notes\n');
  fs.unlinkSync(path.join(w.sync, b.name));                         // on Drive, not yet synced to the PC
  const L = f => ({ id: f.drive_id, name: f.name, md5Checksum: f.md5 });
  const other = { id: 'd-otherunitfile0123456789', name: `US-1877__${RUN1}.md`, md5Checksum: '1'.repeat(32) };
  // no listing
  manifest(w, { unit: 'US-1852', files: [a] }, { listing: null });
  assert.match((await go(w)).error ?? '', /drive-listing/);
  // the listing has a unit file the manifest left out (and the PC hasn't synced it): refused, named
  manifest(w, { unit: 'US-1852', files: [a] }, { listing: [L(a), L(b), other] });
  const r = await go(w);
  assert.match(r.error ?? '', /not in the manifest/); assert.match(r.error, /US-1852__run-20261104T050256Z\.md/);
  // same name, different Drive id
  manifest(w, { unit: 'US-1852', files: [a] }, { listing: [{ ...L(a), id: 'd-someotherid0123456789xyz' }] });
  assert.match((await go(w)).error ?? '', /Drive id/);
  // md5 differs between listing and manifest
  manifest(w, { unit: 'US-1852', files: [a] }, { listing: [{ ...L(a), md5Checksum: '2'.repeat(32) }] });
  assert.match((await go(w)).error ?? '', /md5/);
  // a manifest file the listing does not have
  manifest(w, { unit: 'US-1852', files: [a] }, { listing: [other] });
  assert.match((await go(w)).error ?? '', /not in the Drive listing/);
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch`))[0].n, 0);
  // listing = manifest (other units ignored): PASS
  manifest(w, { unit: 'US-1852', files: [a] }, { listing: [L(a), other] });
  assert.equal((await go(w)).status, 'PASS');
});

// ---------------------------------------------------------------- ChatGPT build review 3
test('remote Drive listing: must be the overnight folder and a complete listing (no next page)', async () => {
  const db = await freshDb(); const w = world(db);
  const a = putFile(w, `US-1852__${RUN1}.md`, 'x\n');
  const edit = (dir, change) => {
    const p = path.join(dir, 'drive-listing.json'); const L = JSON.parse(fs.readFileSync(p, 'utf8'));
    change(L); fs.writeFileSync(p, JSON.stringify(L));
  };
  edit(manifest(w, { unit: 'US-1852', files: [a] }), L => { L.folder_id = '1SomeOtherFolderId0123456789'; });
  assert.match((await go(w)).error ?? '', /folder/);
  edit(manifest(w, { unit: 'US-1852', files: [a] }), L => { L.next_page_token = 'more-pages-token'; });
  assert.match((await go(w)).error ?? '', /incomplete|page/);
  edit(manifest(w, { unit: 'US-1852', files: [a] }), L => { delete L.next_page_token; });
  assert.match((await go(w)).error ?? '', /incomplete|page/);
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch`))[0].n, 0);
  manifest(w, { unit: 'US-1852', files: [a] });
  assert.equal((await go(w)).status, 'PASS');
});

test('the .cmd files: CRLF, every jump has one label, and each exit code has its own banner', () => {
  for (const t of ['try', 'prod']) {
    const s = fs.readFileSync(path.join(import.meta.dirname, '..', `import-${t}.cmd`), 'utf8');
    assert.ok(!/[^\r]\n/.test(s), `${t}: LF without CR`);
    const labels = [...s.matchAll(/^:(\w+)\r?$/gm)].map(m => m[1]);
    assert.equal(new Set(labels).size, labels.length, `${t}: duplicate label`);
    for (const [, g] of s.matchAll(/goto :(\w+)/g)) assert.ok(labels.includes(g), `${t}: goto :${g} has no label`);
    assert.match(s, /"%RC%"=="0" goto :ok/); assert.match(s, /"%RC%"=="2" goto :nothing/); assert.match(s, /"%RC%"=="3" goto :unknown/);
    assert.match(s, new RegExp(`node import\\.mjs ${t}\\r?\\n`));
    const ok = s.slice(s.indexOf('\n:ok')), unknown = s.slice(s.indexOf('\n:unknown'));
    assert.match(ok.slice(0, 200), /PASS/); assert.match(unknown.slice(0, 200), /UNKNOWN/);
  }
});
