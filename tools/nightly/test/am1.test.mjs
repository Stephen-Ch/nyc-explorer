// Plan 47 finish, amendment 1 (project doc plans/plan-47-finish-amendment-1-verify-speed-draft2.md): make verify faster.
// 1. a timing row in the selftest tab after each verify run; 2. utf8Len_ (plain JavaScript UTF-8 byte count) in place of
// one Utilities.newBlob call per cell, with every hash unchanged. Fake Apps Script services and a fake clock (shim.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { makeWorld, load, tracker, cell, testKeys } from './shim.mjs';

const KEYS = testKeys();
const GOOD = ['PASS', 'ALREADY', 'NOTHING_NEW'];
const EIGHT = ['STORIES', 'DELIGHTS', 'INDEX', 'STORY_TEXT', 'PLACE_HOOKS', 'PEOPLE', 'NAME_LINKS', 'NUMBER_MAP'];
const COPY = 'c-20261124T150000Z-abcd1234';

// the real tracker headers, read from the db test helpers as text (that file imports pg, which CI does not install here)
const HELPERS = fs.readFileSync(path.resolve(import.meta.dirname, '../../../db/test/0006/helpers.mjs'), 'utf8');
const SHEET_HEADERS = vm.runInNewContext('(' + /export const SHEET_HEADERS = (\{[\s\S]*?\n\});/.exec(HELPERS)[1] + ')');

// ---------------------------------------------------------------- worlds

function setup({ tabs, now = '2026-11-24T15:00:00Z' }) {
  const w = makeWorld({ now });
  const tr = tracker(w, { ...tabs, QUEUE: [['status', 'claimed_at_utc']], STORY_QUEUE: [['status', 'claimed_at_utc']], REWRITE_QUEUE: [['status', 'claimed_at_utc']] });
  const status = w.makeSpreadsheet('NYC nightly status', { status: [[cell('run_utc')]], verify: [[cell('run'), cell('tab'), cell('key'), cell('sha256')]],
    selftest: [[cell('time_utc'), cell('check'), cell('result'), cell('detail')]] });
  Object.assign(w.props, { DB_URL: 'https://db.example/rest/v1', PRIVATE_KEY: KEYS.der64, TRACKER_ID: tr.id, STATUS_SHEET_ID: status.id });
  const names = Object.keys(tabs);
  const state = Object.fromEntries(names.map(t => [t, 'MISSING']));
  w.db = (fn, body) => {
    if (fn === 'tonight') return { code: 200, json: { export_group: '2026-11-24', statement_timeout: '8s', open_batches: [],
      tabs: names.map(t => ({ tab: t, status: state[t], reason: null, copy_id: GOOD.includes(state[t]) ? COPY : null,
        hours_since_good: GOOD.includes(state[t]) ? 0.1 : null })) } };
    if (fn === 'put_tab') { state[body.tab] = 'PASS'; return { code: 200, json: { status: 'PASS' } }; }
    return { code: 200, json: { status: 'LOGGED', count: (body.entries || []).length } };
  };
  const ctx = load(w, 'export.gs');
  const verify = () => status.sheets.verify.slice(1).map(r => r.map(c => c.v));
  const complete = () => verify().filter(r => r[1] === '#complete');
  const selftest = () => status.sheets.selftest.slice(1).map(r => r.map(c => c.v));
  return { w, ctx, tr, status, verify, complete, selftest };
}

// all 8 tabs, the real headers, two rows each
function eightTabs(extra = {}) {
  const tabs = {};
  for (const t of EIGHT) {
    const h = SHEET_HEADERS[t];
    tabs[t] = [h, ...[1, 2].map(n => h.map((c, k) => (k === 0 ? `${t}-${n}` : c === 'run_id' ? `run-${n}` : `${c} ${n}`)))];
  }
  return { ...tabs, ...extra };
}

// the db test fixture (test/db.test.mjs sampleWorld) plus one emoji cell and one ZWJ sequence (amendment 1 item 4)
const EMOJI = 'Grand 🎭 opening 🗽';
const ZWJ = 'family 👨‍👩‍👧‍👦 and flag 🏳️‍🌈';
function fixtureTabs() {
  const row = (id, over = {}) => SHEET_HEADERS.STORIES.map(h => h === 'story_id' ? id : (over[h] ?? cell(`${h} of ${id}`)));
  return {
    STORIES: [SHEET_HEADERS.STORIES,
      row('ST001', { place: 'a, "quoted", comma', notes: 'line1\nline2\r\nline3', story_date: '1852-10-03', added: '1.5E+10',
        original_link: cell('see', { f: '=HYPERLINK("https://h.example/1","see")', links: ['https://h.example/1'] }) }),
      row('ST002', { original_link: cell('two', { links: ['https://a.example/1', null, 'https://b.example/2'] }),
        'pointer_source (modern, credit only)': cell('https://p.example', { links: ['https://p.example'] }), notes: 'é ü 中 \u2028 tab\tend', grade: '' }),
      row('ST003', { notes: ' leading and trailing ', original_link: cell('https://whole.example', { links: ['https://whole.example'], apiHyperlinkOnly: true }) }),
      row('ST004', { 'hook (fresh wording)': EMOJI, notes: ZWJ, original_quote: '﻿bom � replacement \u0000 nul' })],
    DELIGHTS: [SHEET_HEADERS.DELIGHTS, SHEET_HEADERS.DELIGHTS.map(h => h === 'delight_id' ? 'D001' : `${h} 1`)],
    PLACE_HOOKS: [SHEET_HEADERS.PLACE_HOOKS,
      SHEET_HEADERS.PLACE_HOOKS.map(h => h === 'hook_id' ? 'PH0011' : h === 'run_id' ? 'plan42-pilot-20261117' : `${h} a`),
      SHEET_HEADERS.PLACE_HOOKS.map(h => h === 'hook_id' ? 'PH0011' : h === 'run_id' ? 'plan42-A1-recheck-20261117' : `${h} b`)],
  };
}

// ---------------------------------------------------------------- utf8Len_

function utf8Len(ctx) {
  assert.equal(typeof ctx.utf8Len_, 'function', 'export.gs has no utf8Len_');
  return ctx.utf8Len_;
}

test('am1-2: utf8Len_ equals Buffer.byteLength for every code point except surrogate halves, alone and inside text', () => {
  const len = utf8Len(load(makeWorld(), 'export.gs'));
  let n = 0, chunk = [], bad = [];
  const flush = () => {
    const s = chunk.join('');
    if (len('ab' + s + 'z') !== Buffer.byteLength('ab' + s + 'z', 'utf8')) bad.push(`chunk ending ${chunk.length && chunk[chunk.length - 1].codePointAt(0).toString(16)}`);
    chunk = [];
  };
  for (let cp = 0; cp <= 0x10FFFF; cp++) {
    if (cp >= 0xD800 && cp <= 0xDFFF) continue;
    const ch = String.fromCodePoint(cp);
    if (len(ch) !== Buffer.byteLength(ch, 'utf8')) { bad.push(cp.toString(16)); if (bad.length > 5) break; }
    chunk.push(ch); n++;
    if (chunk.length === 4096) flush();
  }
  flush();
  assert.deepEqual(bad, []);
  assert.equal(n, 1112064);
});

test('am1-2: utf8Len_ edge cases: empty, U+0000, BOM, U+FFFD, a 15,000-byte string, emoji and ZWJ', () => {
  const len = utf8Len(load(makeWorld(), 'export.gs'));
  const long = 'é'.repeat(7000) + 'x'.repeat(1000);
  assert.equal(Buffer.byteLength(long), 15000);
  for (const s of ['', '\u0000', '﻿', '�', long, EMOJI, ZWJ, '中文 tab\tend\r\n']) assert.equal(len(s), Buffer.byteLength(s, 'utf8'), JSON.stringify(s.slice(0, 20)));
});

test('am1-2 must-fail: a lone high, lone low, high at the end, or reversed pair throws', () => {
  const len = utf8Len(load(makeWorld(), 'export.gs'));
  for (const s of ['a\uD83Db', 'a\uDE00b', 'abc\uD83D', 'a\uDE00\uD83Db', '\uDC00', '\uD800']) {
    assert.throws(() => len(s), Error, JSON.stringify(s));
  }
});

// ---------------------------------------------------------------- hash pin

// the hash as it was before amendment 1 (export.gs at acce971), kept here to pin "every hash stays the same"
// Note (review): under the shim, newBlob is Node's own byte count, so (i) and (ii) are close to one check. Neither proves
// the match with real Apps Script or PostgreSQL: npm run test:db (13h, emoji in the db fixture) and the live compare do.
function oldCanonicalHash(Utilities, cells) {
  const s = cells.map(c => Utilities.newBlob(c).getBytes().length + ':' + c).join('');
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}
const nodeHash = cells => crypto.createHash('sha256').update(cells.map(c => Buffer.byteLength(c, 'utf8') + ':' + c).join(''), 'utf8').digest('hex');

test('am1-4 hash pin: on the db fixture plus emoji and ZWJ, every hash equals the old newBlob hash and a Node sha256', () => {
  const s = setup({ tabs: fixtureTabs() });
  const seen = [];
  const orig = s.ctx.canonicalHash_;
  s.ctx.canonicalHash_ = cells => { const h = orig(cells); seen.push({ cells: cells.slice(), h }); return h; };
  s.ctx.verifyNow();
  assert.equal(seen.length, 7);
  assert.ok(seen.some(x => x.cells.includes(EMOJI)) && seen.some(x => x.cells.includes(ZWJ)), 'emoji and ZWJ rows hashed');
  for (const { cells, h } of seen) {
    assert.equal(h, oldCanonicalHash(s.w.global.Utilities, cells));
    assert.equal(h, nodeHash(cells));
  }
  // the verify tab holds the same hashes
  assert.deepEqual(s.verify().filter(r => r[1] !== '#complete').map(r => r[3]).sort(), seen.map(x => x.h).sort());
});

test('am1-2: verify makes no Utilities.newBlob call per cell', () => {
  const s = setup({ tabs: fixtureTabs() });
  let blobs = 0;
  const nb = s.ctx.Utilities.newBlob;
  s.ctx.Utilities.newBlob = d => { blobs++; return nb(d); };
  s.ctx.verifyRows_(COPY, undefined, { tabs: ['STORIES', 'DELIGHTS', 'PLACE_HOOKS'].map(tab => ({ tab, status: 'PASS', copy_id: COPY })) });
  assert.equal(s.complete().length, 1);
  assert.equal(blobs, 0);
});

test('am1-2 must-fail: a lone surrogate in a cell stops verify with its tab and key; no #complete', () => {
  const tabs = fixtureTabs();
  tabs.STORIES.push(SHEET_HEADERS.STORIES.map(h => h === 'story_id' ? 'ST009' : h === 'notes' ? 'broken \uD83D here' : 'x'));
  const s = setup({ tabs });
  assert.throws(() => s.ctx.verifyRows_(COPY, undefined, { tabs: [{ tab: 'STORIES', status: 'PASS', copy_id: COPY }] }),
    /verify: STORIES ST009 has a broken character \(sheet row 6\)/);
  assert.equal(s.complete().length, 0);
  assert.equal(s.verify().length, 0);
});

// ---------------------------------------------------------------- timing row

const timingRows = s => s.selftest().filter(r => r[1] === 'verify-timing');

test('am1-1: one 4-cell verify-timing row per verify run, after #complete, naming the run and all 8 tabs', () => {
  const s = setup({ tabs: eightTabs() });
  let completeAtWrite = null;
  const orig = s.ctx.writeSelftest_;
  s.ctx.writeSelftest_ = (id, rows) => { completeAtWrite = s.complete().length; return orig(id, rows); };
  s.ctx.verifyNow();
  const rows = timingRows(s);
  assert.equal(rows.length, 1);
  assert.equal(completeAtWrite, 1, 'timing row written after #complete');
  const [time, check, run, detail] = rows[0];
  assert.equal(s.status.sheets.selftest.slice(-1)[0].length, 4);
  assert.match(time, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.equal(check, 'verify-timing');
  assert.equal(run, s.complete()[0][0]);
  assert.match(detail, /^tonight=\d+ read /);
  for (const t of EIGHT) assert.match(detail, new RegExp(`(read |,)${t}=\\d+(,| )`), t);
  assert.match(detail, / hash=\d+ write=\d+ total=\d+ rows=16$/);
  // a second run gets its own row
  s.w.clock.t += 60000; s.ctx.verifyNow();
  assert.equal(timingRows(s).length, 2);
  assert.deepEqual(timingRows(s).map(r => r[2]), s.complete().map(r => r[0]));
});

test('am1-1: the timer measures the time spent (fake clock: reads and the tonight call)', () => {
  const s = setup({ tabs: eightTabs() });
  const get = s.ctx.Sheets.Spreadsheets.get;
  s.ctx.Sheets = { Spreadsheets: { get: (id, o) => { s.w.clock.t += o.ranges[0] === 'STORIES' ? 7000 : 1000; return get(id, o); } } };
  s.w.callMs = 400;
  s.ctx.verifyRows_(COPY, undefined, undefined);
  const detail = timingRows(s)[0][3];
  assert.match(detail, /^tonight=400 read /);
  assert.match(detail, /read STORIES=7000,DELIGHTS=1000,/);
  const total = Number(/total=(\d+)/.exec(detail)[1]);
  assert.ok(total >= 400 + 7000 + 7 * 1000, detail);
});

test('am1-1: tonight= says given when the caller passed the answer (verifyOnly)', () => {
  const s = setup({ tabs: eightTabs() });
  s.ctx.verifyRows_(COPY, undefined, { tabs: EIGHT.map(tab => ({ tab, status: 'PASS', copy_id: COPY })) });
  assert.match(timingRows(s)[0][3], /^tonight=given read /);
});

test('am1-1: no timing row when verify throws before #complete', () => {
  const s = setup({ tabs: eightTabs() });
  let n = 0;
  const get = s.ctx.Sheets.Spreadsheets.get;
  s.ctx.Sheets = { Spreadsheets: { get: (id, o) => { if (++n === 3) throw new Error('Sheets API 500'); return get(id, o); } } };
  assert.throws(() => s.ctx.verifyNow(), /500/);
  assert.equal(s.complete().length, 0);
  assert.equal(timingRows(s).length, 0);
});

test('am1-1: a failing timing write is logged and never makes verify throw after a good #complete', () => {
  const s = setup({ tabs: eightTabs() });
  s.ctx.writeSelftest_ = () => { throw new Error('selftest tab is locked'); };
  s.ctx.verifyNow();
  assert.equal(s.complete().length, 1);
  assert.ok(s.w.logs.some(l => /verify-timing/.test(l) && /selftest tab is locked/.test(l)), s.w.logs.join('\n'));
});
