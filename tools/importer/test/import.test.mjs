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
import { runImport, parseFileName, splitLines, runTime, KINDS, RETRY_KINDS, UNIT_PATTERN, TAB_HEADERS, KEY_PATTERNS } from '../lib.mjs';

const HOST = process.env.IMPORT_TEST_PGHOST || '/tmp';
const SUPER = process.env.IMPORT_TEST_PGSUPER || 'postgres';
const REPO = path.resolve(import.meta.dirname, '../../..');
const MIGRATIONS = ['0001_init.sql', '0002_before_import.sql', '0003_research_import.sql', '0004_importer_role.sql', '0005_import_build_40.sql']
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
  assert.throws(() => parseFileName('ST-SQ-1852__run-20261108T212944Z__story-gossip.md'), /kind/);
  assert.throws(() => parseFileName('MN06-1852__redo-20261030T180544Z.jsonl'), /run id/);
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

// ================================================================ plan 40 (import build)
const REPO_MIG = f => fs.readFileSync(path.join(REPO, 'db/migrations', f), 'utf8');
const csvOf = (headers, rows) => {
  const esc = v => /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  return [headers.map(esc).join(','), ...rows.map(r => headers.map((h, i) => esc(r[i] ?? '')).join(','))].join('\r\n') + '\r\n';
};
const rowOf = (tab, vals) => TAB_HEADERS[tab].map(h => vals[h] ?? '');
function tabManifestFor(w, tab, text) {
  const dir = manifest(w, { unit: `TAB-${tab}`, tab, csv: `${tab}.csv`, csv_sha256: 'later', sheet_read_utc: new Date(Date.now() - 600e3).toISOString() });
  const b = Buffer.from(text, 'utf8');
  fs.writeFileSync(path.join(dir, `${tab}.csv`), b);
  const mf = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  mf.csv_sha256 = crypto.createHash('sha256').update(b).digest('hex');
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(mf));
  return dir;
}
const indexRow = (cand, vals = {}) => rowOf('INDEX', { candidate_id: cand, place_id: cand.replace(/^us-1852-/, ''), name: cand, year: '1852',
  disposition: 'B', unit_id: 'US-1852', zone: 'S', ...vals });
const holdLine = (cand, extra = {}) => JSON.stringify({ candidate_id: cand, place_id: cand.replace(/^us-1852-/, ''), grade: 'B', zone: 'S',
  block: '14th-15th', flags: ['block-from-number-table', 'day-restore'], skeptic_file_id: 'x', ...extra });
const putAt = (w, name, text, modified_utc) => ({ ...putFile(w, name, text), modified_utc });

test('plan 40: new kinds, retries and run ids are understood; the rest refused', () => {
  const k = n => parseFileName(n).kind;
  assert.equal(k('ST-SQ-1852__run-20261108T212944Z__story-sources.md'), 'story-sources');
  assert.equal(k('ST-S-1877__run-20261115T101557Z__story-existing.md'), 'story-existing');
  assert.equal(k('MN01-1877__run-20261020T140121Z__skeptic.md'), 'skeptic');
  assert.equal(k('MN06-1877__run-20261030T202651Z__blind-1.md'), 'blind');
  assert.equal(k('MN06-1877__run-20261030T202651Z__check-2.md'), 'check');
  assert.deepEqual(parseFileName('MN06-1877__run-20261030T202651Z__sources-retry.md'), { unit: 'MN06-1877', run_id: 'run-20261030T202651Z', kind: 'sources', retry: true });
  assert.equal(parseFileName('ST-S-1852__run-20261114T071632Z__story-fragments-retry.md').retry, true);
  assert.equal(parseFileName('MN06-1877__run-20261030T202651Z__blind-1-retry.md').retry, true);
  assert.equal(parseFileName('MN06-1852__backfill-20261030T180544Z.jsonl').kind, 'packets');
  assert.equal(parseFileName('US-1852__holds-20261116T104100Z.jsonl').run_id, 'holds-20261116T104100Z');
  assert.equal(parseFileName('US-1852__holds-20261116.jsonl').kind, 'packets');
  assert.equal(parseFileName('ST-N-1877__recheck-plan29__story-skeptic-1.md').run_id, 'recheck-plan29');
  assert.throws(() => parseFileName('ST-N-1877__recheck-plan29.jsonl'), /recheck/);
  assert.throws(() => parseFileName('US-1852__run-20261104T050256Z__notes-retry.md'), /kind|retr/);
  assert.throws(() => parseFileName('US-1852__run-20261104T050256Z-retry.md'), /run id|retr|understood/);
  assert.throws(() => parseFileName('US-1852__run-20261104T050256Z__blind.md'), /kind/);
  assert.throws(() => parseFileName('US-1852__run-20261104T050256Z__story-sources-2.md'), /kind/);
  assert.throws(() => parseFileName('US-1852__holds-2026111.jsonl'), /run id/);
  // run time: from the stamp; date-only holds ids need the Drive time; never the text of the id
  assert.equal(runTime('run-20261104T050256Z'), Date.parse('2026-11-04T05:02:56Z'));
  assert.equal(runTime('holds-20261116T104100Z'), Date.parse('2026-11-16T10:41:00Z'));
  assert.equal(runTime('holds-20261116', '2026-11-16T10:55:00Z'), Date.parse('2026-11-16T10:55:00Z'));
  assert.throws(() => runTime('holds-20261116'), /time/);
  assert.throws(() => runTime('holds-20261116', 'not a time'), /time/);
  // the Drive time must fall on the id's own New York date (a file re-saved later must not jump ahead)
  assert.throws(() => runTime('holds-20261115', '2026-12-01T15:00:00Z'), /date/);
  assert.throws(() => runTime('holds-20261115', '2026-11-16T06:00:00Z'), /date/);      // 1am Nov 16 in New York
  assert.equal(runTime('holds-20261115', '2026-11-16T04:30:00Z'), Date.parse('2026-11-16T04:30:00Z'));   // 11:30pm Nov 15 in New York
  assert.throws(() => runTime('recheck-plan29'), /time/);
});

test('plan 40: every new kind and retry is stored (0005 checks agree with lib.mjs)', async () => {
  const db = await freshDb(); const w = world(db);
  const R = 'run-20261108T212944Z', u = 'ST-SQ-1852';
  const files = ['story-sources', 'story-existing', 'skeptic', 'story-fragments-retry', 'sources-retry', 'blind-1', 'check-2', 'blind-1-retry', 'check-2-retry', 'notes']
    .map(s => putFile(w, s === 'notes' ? `${u}__${R}.md` : `${u}__${R}__${s}.md`, s + '\n'));
  files.push(putFile(w, `${u}__recheck-plan29__story-skeptic-1.md`, 'recheck\n'));
  manifest(w, { unit: u, files });
  const r = await go(w);
  assert.equal(r.status, 'PASS', r.error);
  assert.equal(r.counts.run_files, files.length);
  assert.deepEqual((await q(db, `SELECT kind, count(*)::int n, bool_or(retry) r FROM research.run_file GROUP BY 1 ORDER BY 1`)).map(x => `${x.kind}:${x.n}:${x.r}`),
    ['blind:2:true', 'check:2:true', 'notes:1:false', 'skeptic:1:false', 'sources:1:true', 'story-existing:1:false', 'story-fragments:1:true', 'story-skeptic:1:false', 'story-sources:1:false']);
});

test('plan 40: an empty packets file is stored with zero packets', async () => {
  const db = await freshDb(); const w = world(db);
  const files = [putFile(w, `US-1877__run-20261114T184429Z.jsonl`, '\n'), putFile(w, `US-1877__run-20261114T184429Z.md`, 'kept nothing\n')];
  manifest(w, { unit: 'US-1877', files });
  const r = await go(w);
  assert.equal(r.status, 'PASS', r.error);
  assert.equal(r.counts.packets ?? 0, 0); assert.equal(r.counts.run_files, 2);
  // a file with two empty lines is still a blank-line refusal
  const w2 = world(db);
  manifest(w2, { unit: 'US-1877', files: [putFile(w2, `US-1877__run-20261115T000000Z.jsonl`, '\n\n')] });
  assert.match((await go(w2)).error, /blank line/);
});

test('plan 40: run order is by time, not by the text of the id', async () => {
  const db = await freshDb(); const w = world(db);
  // a newer holds file (date-only id, Drive time Nov 15) is stored first
  const h = putAt(w, 'US-1852__holds-20261115.jsonl', holdLine('us-1852-a') + '\n', '2026-11-15T15:40:00Z');
  manifest(w, { unit: 'US-1852', files: [h] });
  let r = await go(w); assert.equal(r.status, 'PASS', r.error);
  // an older run- file for the same candidate now stops (text order would have let 'run-' beat 'holds-')
  manifest(w, { unit: 'US-1852', files: [h, putFile(w, `US-1852__${RUN2}.jsonl`, pk('us-1852-a') + '\n')] });
  r = await go(w); assert.equal(r.status, 'FAIL'); assert.match(r.error, /newer run/);
  // two packets files with the same time in one batch stop
  const w2 = world(db);
  manifest(w2, { unit: 'US-1852', files: [
    putFile(w2, 'US-1852__run-20261120T100000Z.jsonl', pk('us-1852-z') + '\n'),
    putFile(w2, 'US-1852__holds-20261120T100000Z.jsonl', holdLine('us-1852-y') + '\n')] });
  r = await go(w2); assert.equal(r.status, 'FAIL'); assert.match(r.error, /same time/);
  // backfill ids sort by their stamp too
  const w3 = world(db);
  manifest(w3, { unit: 'US-1852', files: [putFile(w3, 'US-1852__backfill-20261030T180544Z.jsonl', pk('us-1852-q') + '\n')] });
  assert.equal((await go(w3)).status, 'PASS');
});

test('plan 40: holds restore supersedes a live dropped packet, in two batches and in one', async () => {
  const db = await freshDb(); const w = world(db);
  const dropped = pk('us-1852-a', { disposition: 'dropped', skeptic: { checked: true, changed: 'dropped' } });
  const d1 = putFile(w, `US-1852__${RUN1}.jsonl`, dropped + '\n');
  manifest(w, { unit: 'US-1852', files: [d1] });
  assert.equal((await go(w)).status, 'PASS');
  manifest(w, { unit: 'US-1852', files: [d1, putAt(w, 'US-1852__holds-20261116.jsonl', holdLine('us-1852-a', { grade: 'C' }) + '\n', '2026-11-16T10:50:00Z')] });
  const r = await go(w); assert.equal(r.status, 'PASS', r.error);
  assert.deepEqual(await q(db, `SELECT run_id, disposition_final::text d, skeptic_changed, review_state FROM research.packet ORDER BY packet_row_id`),
    [{ run_id: RUN1, d: null, skeptic_changed: 'dropped', review_state: 'superseded' },
     { run_id: 'holds-20261116', d: 'C', skeptic_changed: null, review_state: 'pending' }]);
  // one batch with both files
  const db2 = await freshDb(); const w2 = world(db2);
  manifest(w2, { unit: 'US-1852', files: [putFile(w2, `US-1852__${RUN1}.jsonl`, dropped + '\n'),
    putFile(w2, 'US-1852__holds-20261116T104100Z.jsonl', holdLine('us-1852-a') + '\n')] });
  const r2 = await go(w2); assert.equal(r2.status, 'PASS', r2.error);
  assert.deepEqual((await q(db2, `SELECT run_id FROM research.packet WHERE review_state='pending'`)).map(x => x.run_id), ['holds-20261116T104100Z']);
});

test('plan 40: holds lines must be clean restores; never over a kept place', async () => {
  const db = await freshDb(); const w = world(db);
  manifest(w, { unit: 'US-1852', files: [putFile(w, `US-1852__${RUN1}.jsonl`, pk('us-1852-a', { disposition: 'A' }) + '\n')] });
  assert.equal((await go(w)).status, 'PASS');
  const tryHolds = async (line, name = 'US-1852__holds-20261116T104100Z.jsonl') => {
    const wx = world(db); manifest(wx, { unit: 'US-1852', files: [putFile(wx, name, line + '\n')] }); return go(wx);
  };
  let r = await tryHolds(holdLine('us-1852-a')); assert.equal(r.status, 'FAIL'); assert.match(r.error, /kept place|graded A/);
  r = await tryHolds(holdLine('us-1852-b', { disposition: 'B' })); assert.match(r.error, /disposition/);
  r = await tryHolds(holdLine('us-1852-b', { grade: 'D' })); assert.match(r.error, /grade/);
  r = await tryHolds(holdLine('us-1852-b', { flags: ['block-from-number-table'] })); assert.match(r.error, /day-restore/);
  r = await tryHolds(holdLine('us-1877-b')); assert.match(r.error, /belong/);
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch`))[0].n, 1);
});

test('plan 40: TAB-INDEX stores holds and every other row as read; duplicate or bad ids stop', async () => {
  const db = await freshDb(); const w = world(db);
  tabManifestFor(w, 'INDEX', csvOf(TAB_HEADERS.INDEX, [indexRow('us-1852-a'), indexRow('us-1852-h', { disposition: 'hold', hold_reason: 'address unparsed' })]));
  const r = await go(w); assert.equal(r.status, 'PASS', r.error);
  assert.deepEqual(await q(db, `SELECT row_key, row_raw->>'hold_reason' h FROM research.tab_row WHERE tab='INDEX' ORDER BY 1`),
    [{ row_key: 'us-1852-a', h: '' }, { row_key: 'us-1852-h', h: 'address unparsed' }]);
  tabManifestFor(w, 'INDEX', csvOf(TAB_HEADERS.INDEX, [indexRow('us-1852-a'), indexRow('us-1852-b'), indexRow('us-1852-a')]));
  let x = await go(w); assert.equal(x.status, 'FAIL'); assert.match(x.error, /us-1852-a.*rows 2 and 4/);
  tabManifestFor(w, 'INDEX', csvOf(TAB_HEADERS.INDEX, [indexRow('US-1852-A')]));
  x = await go(w); assert.match(x.error, /bad candidate_id/);
  tabManifestFor(w, 'INDEX', csvOf(TAB_HEADERS.INDEX.slice(0, 11), [indexRow('us-1852-a').slice(0, 11)]));
  x = await go(w); assert.match(x.error, /headers/);
});

test('plan 40: TAB-STORY_TEXT keys on story and run; bad rows stop', async () => {
  const db = await freshDb(); const w = world(db);
  const st = (id, run, style, text = 'text') => rowOf('STORY_TEXT', { story_id: id, run_id: run, lead_id: 'l1', story_text: text, style_check: style });
  tabManifestFor(w, 'STORY_TEXT', csvOf(TAB_HEADERS.STORY_TEXT, [st('ST001', RUN1, 'ok'), st('ST001', RUN2, 'fail 2 5'), st('ST002', RUN1, 'unchecked', '')]));
  const r = await go(w); assert.equal(r.status, 'PASS', r.error);
  assert.deepEqual((await q(db, `SELECT row_key FROM research.tab_row ORDER BY 1`)).map(x => x.row_key), [`ST001@${RUN1}`, `ST001@${RUN2}`, `ST002@${RUN1}`]);
  const bad = async (rows, re) => { tabManifestFor(w, 'STORY_TEXT', csvOf(TAB_HEADERS.STORY_TEXT, rows)); const x = await go(w); assert.equal(x.status, 'FAIL'); assert.match(x.error, re); };
  await bad([st('ST001', RUN1, 'ok'), st('ST001', RUN1, 'ok')], /twice/);
  await bad([st('ST001', '', 'ok')], /run_id/);
  await bad([st('ST001', RUN1, 'failed')], /style_check/);
  await bad([st('ST001', 'recheck-plan29', 'ok')], /run_id/);
  await bad([st('S001', RUN1, 'ok')], /story_id/);
});

async function importTabs(db, w, tabs) {
  for (const [tab, rows] of tabs) { tabManifestFor(w, tab, csvOf(TAB_HEADERS[tab], rows)); const r = await go(w); assert.equal(r.status, 'PASS', `${tab}: ${r.error}`); }
}
test('plan 40: story_ready takes the newest text row; notes style fail and missing text are not ready; sort order does not matter', async () => {
  const stories = [
    rowOf('STORIES', { story_id: 'ST001', 'tier (delight/record)': 'delight', run_id: RUN1 }),
    rowOf('STORIES', { story_id: 'ST002', 'tier (delight/record)': 'delight', run_id: RUN1 }),
    rowOf('STORIES', { story_id: 'ST003', 'tier (delight/record)': 'delight', run_id: RUN1, notes: 'v1.3 style fail 4' }),
    rowOf('STORIES', { story_id: 'ST004', 'tier (delight/record)': 'delight', run_id: RUN1 }),
    rowOf('STORIES', { story_id: 'ST005', 'tier (delight/record)': 'record', run_id: RUN1 }),
  ];
  const st = (id, run, style) => rowOf('STORY_TEXT', { story_id: id, run_id: run, story_text: 't', style_check: style });
  // ST006: runs 45 minutes apart in the spring clock-change hour; the later (ok) row must win in any session time zone
  stories.push(rowOf('STORIES', { story_id: 'ST006', 'tier (delight/record)': 'delight', run_id: RUN1 }));
  stories.push(rowOf('STORIES', { story_id: 'ST007', 'tier (delight/record)': 'delight', run_id: RUN1 }));
  const text = [rowOf('STORY_TEXT', { story_id: 'ST007', run_id: RUN1, story_text: ' \t\r\n\t ', style_check: 'ok' }), st('ST006', 'run-20260308T031500Z', 'ok'), st('ST006', 'run-20260308T023000Z', 'fail 1'), st('ST001', RUN1, 'fail 2'), st('ST001', RUN3, 'ok'), st('ST002', RUN1, 'unchecked'), st('ST003', RUN1, 'ok'), st('ST009', RUN1, 'ok')];
  const answers = [];
  for (const order of [text, [...text].reverse()]) {
    const db = await freshDb(); const w = world(db);
    await importTabs(db, w, [['STORIES', stories], ['STORY_TEXT', order]]);
    await q(db, `ALTER DATABASE ${ident(db)} SET timezone = 'America/New_York'`);
    answers.push({
      ready: (await q(db, `SELECT story_id FROM research.story_ready ORDER BY 1`)).map(x => x.story_id),
      utc: (await q(db, `SELECT to_char(run_time_utc AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') t FROM research.story_text WHERE run_id = 'run-20260308T023000Z'`))[0].t,
      not: (await q(db, `SELECT story_id, reason FROM research.story_not_ready ORDER BY 1`)).map(x => `${x.story_id}:${x.reason}`),
      orphan: (await q(db, `SELECT story_id FROM research.story_text_orphan`)).map(x => x.story_id),
    });
  }
  assert.deepEqual(answers[0], { ready: ['ST001', 'ST006'], utc: '2026-03-08 02:30', not: ['ST002:unchecked', 'ST003:notes say style fail', 'ST004:no story text', 'ST007:empty story text'], orphan: ['ST009'] });
  assert.deepEqual(answers[1], answers[0]);
});

test('plan 40: INDEX check finds grades with no or a different live packet, only for imported units', async () => {
  const db = await freshDb(); const w = world(db);
  manifest(w, { unit: 'US-1852', files: [putFile(w, `US-1852__${RUN1}.jsonl`, [
    pk('us-1852-a', { disposition: 'B' }), pk('us-1852-d', { disposition: 'dropped', skeptic: { checked: true, changed: 'dropped' } })].join('\n') + '\n')] });
  assert.equal((await go(w)).status, 'PASS');
  await importTabs(db, w, [['INDEX', [indexRow('us-1852-a'), indexRow('us-1852-d', { disposition: 'A' }), indexRow('us-1852-n', { disposition: 'A' }),
    indexRow('us-1852-h', { disposition: 'hold', hold_reason: 'edge, check address' }), indexRow('us-1877-z', { unit_id: 'US-1877', disposition: 'A' }),
    indexRow('us-1852-x', { unit_id: 'US-1877', disposition: 'A' }), indexRow('us-1852-w', { unit_id: 'US-1852%', disposition: 'A' })]]]);
  assert.deepEqual((await q(db, `SELECT candidate_id, index_grade, packet_grade, problem FROM research.index_packet_mismatch ORDER BY 1`)),
    [{ candidate_id: 'us-1852-d', index_grade: 'A', packet_grade: null, problem: 'grade differs' },
     { candidate_id: 'us-1852-n', index_grade: 'A', packet_grade: null, problem: 'no live packet' },
     { candidate_id: 'us-1852-w', index_grade: 'A', packet_grade: null, problem: 'unit_id does not match candidate' },
     { candidate_id: 'us-1852-x', index_grade: 'A', packet_grade: null, problem: 'unit_id does not match candidate' }]);
});

test('plan 40: a 1,500-row INDEX imports inside the statement time limit', async () => {
  const db = await freshDb(); const w = world(db);
  const rows = Array.from({ length: 1500 }, (_, i) => indexRow(`us-1852-p${i}`, { address_in_year: `${i} East 14th St`, interests: 'a, b' }));
  tabManifestFor(w, 'INDEX', csvOf(TAB_HEADERS.INDEX, rows));
  const t = Date.now();
  const r = await go(w);
  assert.equal(r.status, 'PASS', r.error);
  assert.equal(r.counts.tab_rows, 1500);
  assert.ok(Date.now() - t < 300000, `took ${Date.now() - t} ms`);
});

test('plan 40: lib.mjs lists equal 0005 lists', () => {
  const sql = REPO_MIG('0005_import_build_40.sql');
  const kinds = /run_file_kind_check CHECK \(kind IN\s*\(([^)]*)\)\)/.exec(sql)[1].match(/'([^']+)'/g).map(x => x.slice(1, -1));
  assert.deepEqual([...kinds].sort(), [...KINDS].sort());
  const retry = /run_file_retry_check[\s\S]*?kind IN \(([^)]*)\)/.exec(sql)[1].match(/'([^']+)'/g).map(x => x.slice(1, -1));
  assert.deepEqual([...retry].sort(), [...RETRY_KINDS].sort());
  const unit = /import_batch_unit_check_0005\s+CHECK \(unit_id ~ '([^']+)'/.exec(sql)[1];
  assert.equal(unit, UNIT_PATTERN);
  for (const re of Object.values(KEY_PATTERNS)) assert.ok(sql.includes(`'${re}'`), `0005 lacks key pattern ${re}`);
  const tabs = /tab IN \(([^)]*)\)/.exec(sql)[1].match(/'([^']+)'/g).map(x => x.slice(1, -1));
  assert.deepEqual([...tabs].sort(), Object.keys(TAB_HEADERS).sort());
});

test('plan 40: 0005 keeps the 0004 function settings; its down file undoes it on an empty database', async () => {
  const db = await freshDb();
  const settings = async () => q(db, `SELECT p.oid::regprocedure::text f, p.prosecdef, p.proconfig FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'research' ORDER BY 1`);
  const withFive = await settings();
  await q(db, REPO_MIG('0005_import_build_40.down.sql'));
  const withFour = await settings();
  assert.deepEqual(withFive, withFour);
  assert.equal((await q(db, `SELECT count(*)::int n FROM core.schema_migrations WHERE version='0005'`))[0].n, 0);
  assert.equal((await q(db, `SELECT count(*)::int n FROM pg_views WHERE schemaname='research' AND viewname='story_ready'`))[0].n, 0);
  await q(db, REPO_MIG('0005_import_build_40.sql'));
  assert.deepEqual(await settings(), withFive);
});

test('plan 40: the first real holds file (Nov 15, Huber\'s Museum) imports as a C restore', async () => {
  const db = await freshDb(); const w = world(db);
  const text = fs.readFileSync(path.join(import.meta.dirname, 'fixtures', 'US-1902__holds-20261115.jsonl'));
  manifest(w, { unit: 'US-1902', files: [putAt(w, 'US-1902__holds-20261115.jsonl', text, '2026-11-15T17:04:11.831Z')] });
  const r = await go(w); assert.equal(r.status, 'PASS', r.error);
  assert.deepEqual(await q(db, `SELECT candidate_id, place_id_db, disposition_final::text d, skeptic_changed, run_id FROM research.packet`),
    [{ candidate_id: 'us-1902-hubers-museum', place_id_db: 'nyc-hubers-museum-106-east-14th-street', d: 'C', skeptic_changed: null, run_id: 'holds-20261115' }]);
  assert.equal((await q(db, `SELECT packet->>'skeptic_file_id' s FROM research.packet`))[0].s, '1bRu7TaZR3WwKux8Fc_rCyyToufl_f_As');
});

test('plan 40: the 0005 down file runs after the new batches are undone', async () => {
  const db = await freshDb(); const w = world(db);
  tabManifestFor(w, 'INDEX', csvOf(TAB_HEADERS.INDEX, [indexRow('us-1852-a')]));
  const r = await go(w); assert.equal(r.status, 'PASS', r.error);
  await assert.rejects(q(db, REPO_MIG('0005_import_build_40.down.sql')), /undo those batches first/);
  await q(db, `SELECT research.undo_import($1)`, [r.batchId]);
  await q(db, REPO_MIG('0005_import_build_40.down.sql'));
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.import_batch WHERE unit_id = 'TAB-INDEX'`))[0].n, 0);
  await q(db, REPO_MIG('0005_import_build_40.sql'));
});

test('plan 40: 0005 stops when a check it replaces is not exactly the 0003 definition (schema drift)', async () => {
  await dropTestDbs();
  const name = `imp_t_${process.pid}_${++dbCount}`;
  await superQuery('postgres', `CREATE DATABASE ${ident(name)}`); made.push(name);
  for (const m of MIGRATIONS.slice(0, 4)) await q(name, m);
  await q(name, `ALTER TABLE research.tab_row DROP CONSTRAINT tab_row_tab_check`);
  await q(name, `ALTER TABLE research.tab_row ADD CONSTRAINT custom_tab_check CHECK (tab = ANY (ARRAY['STORIES'::text, 'DELIGHTS'::text, 'X'::text]))`);
  await assert.rejects(q(name, REPO_MIG('0005_import_build_40.sql')), /expected one check/);
  assert.equal((await q(name, `SELECT count(*)::int n FROM core.schema_migrations WHERE version='0005'`))[0].n, 0);
});

test('plan 40: inventory reports research-like names it cannot read, and lists every other file', async () => {
  const { execFileSync } = await import('node:child_process');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-'));
  fs.writeFileSync(path.join(dir, `US-1852__${RUN1}.md`), 'notes\n');
  fs.writeFileSync(path.join(dir, `us-1852__${RUN1}.jsonl`), pk('us-1852-a') + '\n');
  fs.writeFileSync(path.join(dir, 'nyc-decisions-20261115.md'), 'x\n');
  fs.writeFileSync(path.join(dir, 'US-1852_run-20261104.jsonl'), 'x\n');               // one underscore
  fs.writeFileSync(path.join(dir, 'MN01-1852 run.md'), 'x\n');                        // unit-like start, no __
  for (let i = 0; i < 45; i++) fs.writeFileSync(path.join(dir, `other-${String(i).padStart(2, '0')}.txt`), 'x\n');
  const out = path.join(dir, 'report.md');
  execFileSync(process.execPath, [path.join(import.meta.dirname, '..', 'inventory.mjs'), dir, out]);
  const rep = fs.readFileSync(out, 'utf8');
  assert.match(rep, /looks like a research file but its name is not understood: 3 \(3 files\)/);
  assert.match(rep, /3 have at least one refusal/);
  assert.match(rep, /Other files \(not research, 46\): .*nyc-decisions-20261115\.md/);
  assert.match(rep, /other-44\.txt/);                                                     // every other file is listed
  assert.doesNotMatch(rep, /\.\.\./);
});
