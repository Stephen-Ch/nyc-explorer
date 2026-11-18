// Plan 47 tests 9 and 13h end to end: the payload export.gs sends is fed to the real door (local PostgreSQL 16 with
// 0001-0006) and must arrive cell for cell; verifyNow()'s hashes must equal the SQL hashes in verify.sql.
// Needs the same throwaway server as db/test (DB_TEST_ISOLATED=1); run from tools/nightly with npm run test:db.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeWorld, load, tracker, cell, testKeys } from './shim.mjs';
import { requireIsolated, freshDb, cleanup, q, withLoader, nyDate, SHEET_HEADERS } from '../../../db/test/0006/helpers.mjs';

before(requireIsolated);
after(cleanup);
const KEYS = testKeys();
const VERIFY_SQL = fs.readFileSync(path.resolve(import.meta.dirname, '../verify.sql'), 'utf8');
// rows of the newest COMPLETE verify run: [run, tab, key, sha256]; a run counts only with its #complete row (ChatGPT 3)
function latestVerify(status) {
  const rows = status.sheets.verify.slice(1).map(r => r.map(c => c.v));
  const done = rows.filter(r => r[1] === '#complete');
  const run = done.length ? done[done.length - 1][0] : null;
  const body = rows.filter(r => r[0] === run && r[1] !== '#complete');
  assert.equal(String(body.length), done[done.length - 1][2], 'complete row counts the run');
  return body.map(([, tab, key, sha]) => `${tab}|${key}|${sha}`);
}

// a sample STORIES sheet with every awkward case, plus DELIGHTS and PLACE_HOOKS
function sampleWorld() {
  const w = makeWorld({ now: '2026-11-19T06:05:00Z' });
  const row = (id, over = {}) => SHEET_HEADERS.STORIES.map(h => h === 'story_id' ? id : (over[h] ?? cell(`${h} of ${id}`)));
  const tr = tracker(w, {
    STORIES: [SHEET_HEADERS.STORIES,
      row('ST001', { place: 'a, "quoted", comma', notes: 'line1\nline2\r\nline3', story_date: '1852-10-03', added: '1.5E+10',
        original_link: cell('see', { f: '=HYPERLINK("https://h.example/1","see")', links: ['https://h.example/1'] }) }),
      row('ST002', { original_link: cell('two', { links: ['https://a.example/1', null, 'https://b.example/2'] }),
        'pointer_source (modern, credit only)': cell('https://p.example', { links: ['https://p.example'] }), notes: 'é ü 中   tab\tend', grade: '' }),
      row('ST003', { notes: ' leading and trailing ', original_link: cell('https://whole.example', { links: ['https://whole.example'], apiHyperlinkOnly: true }) })],
    DELIGHTS: [SHEET_HEADERS.DELIGHTS, SHEET_HEADERS.DELIGHTS.map(h => h === 'delight_id' ? 'D001' : `${h} 1`)],
    PLACE_HOOKS: [SHEET_HEADERS.PLACE_HOOKS,
      SHEET_HEADERS.PLACE_HOOKS.map(h => h === 'hook_id' ? 'PH0011' : h === 'run_id' ? 'plan42-pilot-20261117' : `${h} a`),
      SHEET_HEADERS.PLACE_HOOKS.map(h => h === 'hook_id' ? 'PH0011' : h === 'run_id' ? 'plan42-A1-recheck-20261117' : `${h} b`)],
    QUEUE: [['status', 'claimed_at_utc']], STORY_QUEUE: [['status', 'claimed_at_utc']], REWRITE_QUEUE: [['status', 'claimed_at_utc']],
  });
  const status = w.makeSpreadsheet('NYC nightly status', { status: [[cell('run_utc')]], verify: [[cell('tab')]] });
  Object.assign(w.props, { DB_URL: 'https://db.example/rest/v1', PRIVATE_KEY: KEYS.der64, TRACKER_ID: tr.id, STATUS_SHEET_ID: status.id });
  const puts = [];
  w.db = (fn, body) => {
    if (fn === 'tonight') return { code: 200, json: { export_group: '2026-11-19', statement_timeout: '8s', open_batches: [],
      tabs: ['STORIES', 'DELIGHTS', 'PLACE_HOOKS'].map(t => ({ tab: t, status: puts.some(p => p.tab === t) ? 'PASS' : 'MISSING' })) } };
    if (fn === 'put_tab') { puts.push(body); return { code: 200, json: { status: 'PASS' } }; }
    return { code: 200, json: { status: 'LOGGED' } };
  };
  return { w, tr, status, puts, ctx: load(w, 'export.gs') };
}
// send a captured body through the real door, as nyc_loader via authenticator
async function sendToDoor(db, body, group) {
  return withLoader(db, async c => (await c.query(`SELECT api.put_tab($1::date, $2, now() - interval '1 minute', $3, $4, $5::jsonb, $6::jsonb) AS r`,
    [group, body.copy_id, body.tab, body.client_version, JSON.stringify(body.headers), JSON.stringify(body.rows)])).rows[0].r);
}

test('9: the payload export.gs sends arrives in tab_row identical, cell for cell; __urls holds both hand links', async () => {
  const { ctx, puts, w, tr } = sampleWorld();
  ctx.nightly();
  assert.deepEqual(puts.map(p => p.tab), ['STORIES', 'DELIGHTS', 'PLACE_HOOKS']);
  const db = await freshDb(); const g = await nyDate(db);
  for (const p of puts) assert.equal((await sendToDoor(db, p, g)).status, 'PASS', p.tab);
  const stored = (await q(db, `SELECT row_key, row_raw FROM research.tab_row WHERE tab = 'STORIES' AND live ORDER BY row_key`)).rows;
  const sheet = tr.sheets.STORIES;
  for (let i = 1; i < sheet.length; i++) {
    const raw = stored[i - 1].row_raw;
    SHEET_HEADERS.STORIES.forEach((h, k) => assert.equal(raw[h], sheet[i][k].v, `row ${i + 1} ${h}`));
  }
  assert.equal(stored[1].row_raw.original_link__urls, '["https://a.example/1","https://b.example/2"]');
  assert.equal(stored[0].row_raw.original_link__urls, '["https://h.example/1","https://h.example/1"]');
  assert.equal(stored[1].row_raw['pointer_source (modern, credit only)__urls'], '["https://p.example"]');
  assert.equal(stored[2].row_raw.original_link__urls, '["https://whole.example"]');
  const ph = (await q(db, `SELECT row_key FROM research.tab_row WHERE tab = 'PLACE_HOOKS' AND live ORDER BY row_key`)).rows.map(r => r.row_key);
  assert.deepEqual(ph, ['PH0011@plan42-A1-recheck-20261117', 'PH0011@plan42-pilot-20261117']);
  assert.ok(w.calls.length > 0);
});

test('13h: verifyNow() hashes (separate Sheets API read) equal the SQL hashes from verify.sql', async () => {
  const { ctx, puts, status } = sampleWorld();
  ctx.verifyNow();
  const db = await freshDb(); const g = await nyDate(db);
  for (const p of puts) assert.equal((await sendToDoor(db, p, g)).status, 'PASS', p.tab);
  const fromSheet = latestVerify(status).sort();
  const fromDb = (await q(db, VERIFY_SQL)).rows.map(r => `${r.tab}|${r.row_key}|${r.sha256}`).sort();
  assert.equal(fromSheet.length, 6);
  assert.deepEqual(fromSheet, fromDb);
});

test('13h: a changed cell in the tracker after the export shows as a different hash', async () => {
  const { ctx, puts, status, tr } = sampleWorld();
  ctx.verifyNow();
  const db = await freshDb(); const g = await nyDate(db);
  for (const p of puts) await sendToDoor(db, p, g);
  // verify again after a sheet edit: one row must differ
  tr.sheets.DELIGHTS[1][2] = cell('edited');
  ctx.verifyRows_('c-20261119T070000Z-second01');    // a second run on the same verify tab, no reset (ChatGPT 3)
  const fromSheet = new Set(latestVerify(status));
  const fromDb = (await q(db, VERIFY_SQL)).rows.map(r => `${r.tab}|${r.row_key}|${r.sha256}`);
  assert.deepEqual(fromDb.filter(x => !fromSheet.has(x)).map(x => x.split('|')[1]), ['D001']);
});

test('ChatGPT 2: verifyNow makes a fresh copy and sends every enabled tab even when all are good tonight', () => {
  const { ctx, puts, w } = sampleWorld();
  ctx.nightly();
  const first = puts.length;
  assert.equal(first, 3);
  w.clock.t += 3600000;
  ctx.verifyNow();
  assert.deepEqual(puts.slice(first).map(p => p.tab), ['STORIES', 'DELIGHTS', 'PLACE_HOOKS']);
  assert.notEqual(puts[first].copy_id, puts[0].copy_id);
});

test('ChatGPT 3: a run that fails half way is never read as complete', () => {
  const { ctx, status, w } = sampleWorld();
  ctx.verifyNow();
  const before = latestVerify(status);
  const orig = w.db;
  let n = 0;
  const get = w.global.Sheets.Spreadsheets.get;
  ctx.Sheets = { Spreadsheets: { get: (id, o) => { if (++n === 2) throw new Error('Sheets API 500'); return get(id, o); } } };
  assert.throws(() => ctx.verifyRows_('c-20261119T070000Z-halfrun1'), /500/);
  assert.deepEqual(latestVerify(status), before);
  w.db = orig;
});

test('ChatGPT r2-1: verifyNow writes no #complete unless a fresh copy was made and every enabled tab came back good', () => {
  for (const bad of [{ code: 200, json: { status: 'STOPPED', reason: 'removed keys without approval: D009' } }, { code: 500, text: 'boom' }]) {
    const { ctx, status, w } = sampleWorld();
    const db0 = w.db;
    w.db = (fn, body, ww, call) => (fn === 'put_tab' && body.tab === 'DELIGHTS' ? bad : db0(fn, body, ww, call));
    assert.throws(() => ctx.verifyNow(), /verify not run/);
    const rows = status.sheets.verify.slice(1).map(r => r.map(c => c.v));
    assert.equal(rows.length, 0, JSON.stringify(rows));
  }
  // all tabs already good and nothing new: still a fresh copy, and the run id carries its copy id
  const { ctx, status } = sampleWorld();
  ctx.verifyNow();
  const done = status.sheets.verify.slice(1).map(r => r.map(c => c.v)).filter(r => r[1] === '#complete');
  assert.equal(done.length, 1);
  assert.match(done[0][0], /^v-.*@c-\d{8}T\d{6}Z-/);
});

test('ChatGPT r3-1: verifyRows_ refuses to run without the copy it checks (no @no-copy runs)', () => {
  const { ctx, status } = sampleWorld();
  for (const bad of [undefined, '', 'no-copy']) assert.throws(() => ctx.verifyRows_(bad), /copy/);
  assert.equal(status.sheets.verify.length, 1);
});
