// Plan 47 finish S2 (project doc plans/plan-47-finish-draft6.md): bulk verify writes (A4), verifyNow keeps the lock,
// verifyOnly (no export), monitorCheck (read-only), drillStop and drillStopRun (import-try only).
// Items refer to S2 "Code" 1-9. Fake Apps Script services and a fake clock (shim.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, load, tracker, cell, testKeys } from './shim.mjs';
import { sessionCheck } from '../session-check.mjs';

const KEYS = testKeys();
const IMPORT_TRY = 'https://ep-ancient-mode-b4mlcp2h.apirest.c-6.us-east-2.aws.neon.tech/neondb/rest/v1';
const GOOD = ['PASS', 'ALREADY', 'NOTHING_NEW'];
const EIGHT = ['STORIES', 'DELIGHTS', 'INDEX', 'STORY_TEXT', 'PLACE_HOOKS', 'PEOPLE', 'NAME_LINKS', 'NUMBER_MAP'];
const COPY = 'c-20261124T150000Z-abcd1234';
const idx = n => Array.from({ length: n }, (_, i) => [`us-1877-${String(i + 1).padStart(5, '0')}`, `name ${i + 1}`]);

// 10:00am New York, Nov 24 2026 = 15:00 UTC (S2 runs by hand in daytime)
function setup({ now = '2026-11-24T15:00:00Z', tabs = { INDEX: [['candidate_id', 'name'], ...idx(3)] }, dbUrl = 'https://db.example/rest/v1',
  tonight = null, put = null, verifySize = null } = {}) {
  const w = makeWorld({ now });
  const tr = tracker(w, { ...tabs, QUEUE: [['status', 'claimed_at_utc']], STORY_QUEUE: [['status', 'claimed_at_utc']], REWRITE_QUEUE: [['status', 'claimed_at_utc']] });
  const status = w.makeSpreadsheet('NYC nightly status', { status: [[cell('run_utc')]], verify: [[cell('run'), cell('tab'), cell('key'), cell('sha256')]],
    selftest: [[cell('time_utc'), cell('check'), cell('result'), cell('detail')]] });
  if (verifySize) { status.size = { verify: verifySize }; }
  Object.assign(w.props, { DB_URL: dbUrl, PRIVATE_KEY: KEYS.der64, TRACKER_ID: tr.id, STATUS_SHEET_ID: status.id });
  const names = Object.keys(tabs);
  const state = Object.fromEntries(names.map(t => [t, 'MISSING']));
  const puts = [];
  w.db = (fn, body) => {
    if (fn === 'tonight') {
      if (tonight) return { code: 200, json: tonight(state) };
      return { code: 200, json: { export_group: '2026-11-24', statement_timeout: '8s', open_batches: [],
        tabs: names.map(t => ({ tab: t, status: state[t], reason: null, copy_id: GOOD.includes(state[t]) ? COPY : null,
          hours_since_good: GOOD.includes(state[t]) ? 0.1 : null })) } };
    }
    if (fn === 'put_tab') {
      puts.push(body);
      const r = put ? put(body) : { code: 200, json: { status: 'PASS' } };
      if (r.code === 200 && GOOD.includes(r.json.status)) state[body.tab] = r.json.status;
      return r;
    }
    if (fn === 'record_result') return { code: 200, json: { status: 'LOGGED', count: body.entries.length } };
    return { code: 404, text: 'no such function' };
  };
  const ctx = load(w, 'export.gs');
  const verify = () => status.sheets.verify.slice(1).map(r => r.map(c => c.v));
  const complete = () => verify().filter(r => r[1] === '#complete');
  const selftest = () => status.sheets.selftest.slice(1).map(r => r.map(c => c.v));
  return { w, ctx, tr, status, puts, state, verify, complete, selftest };
}
const fns = w => w.calls.map(c => c.fn);
const copies = w => [...w.files.values()].filter(f => f.name.startsWith('nyc-export-copy-'));
const verifyWrites = w => (w.writes || []).filter(x => x.sheet === 'verify');

// ---------------------------------------------------------------- 1. bulk writes (A4)

test('S2-1: 922 rows: one bulk write plus one #complete, no appendRow per line; count matches; #complete last', () => {
  const s = setup({ tabs: { INDEX: [['candidate_id', 'name'], ...idx(922)] } });
  s.ctx.verifyNow();
  const writes = verifyWrites(s.w);
  assert.equal(writes.length, 2, JSON.stringify(writes.map(x => x.rows)));
  assert.equal(writes[0].rows, 922);
  assert.equal(writes[1].rows, 1); assert.equal(writes[1].last[1], "'#complete");
  const v = s.verify();
  assert.equal(v.length, 923);
  assert.equal(v[v.length - 1][1], '#complete'); assert.equal(v[v.length - 1][2], '922');
  assert.ok(v.slice(0, -1).every(r => r[1] === 'INDEX' && r[0] === v[0][0]));
});

test('S2-1: 12,001 rows over three tabs: chunks of at most 5,000 rows; sheet too short gets rows inserted first', () => {
  const s = setup({ tabs: { INDEX: [['candidate_id', 'name'], ...idx(7000)], DELIGHTS: [['delight_id', 'hook'], ...Array.from({ length: 5001 }, (_, i) => [`D${i + 1}`, 'h'])] } });
  s.ctx.verifyNow();
  const writes = verifyWrites(s.w);
  assert.deepEqual(writes.map(x => x.rows), [5000, 5000, 2001, 1]);
  assert.ok(s.w.logs.some(l => /^insertRowsAfter verify /.test(l)), 'rows inserted');
  assert.equal(s.complete()[0][2], '12001');
  assert.equal(s.verify().length, 12002);
});

test('S2-1: zero rows gives #complete 0', () => {
  const s = setup({ tabs: { INDEX: [['candidate_id', 'name']] } });
  s.ctx.verifyNow();
  assert.deepEqual(s.verify().map(r => [r[1], r[2]]), [['#complete', '0']]);
});

test('S2-1 must-fail: a failing bulk write leaves no #complete (and the error comes back)', () => {
  const s = setup({ tabs: { INDEX: [['candidate_id', 'name'], ...idx(6000)] } });
  s.w.failWriteAt = 2;
  assert.throws(() => s.ctx.verifyNow(), /Spreadsheets failed/);
  assert.equal(s.complete().length, 0);
  assert.ok(!s.w.lockHeld, 'lock released after the error');
});

test('S2-1: values keep the leading quote (keys that look like numbers or dates stay text)', () => {
  const s = setup({ tabs: { INDEX: [['candidate_id', 'name'], ['0012', 'a'], ['2026-11-24', 'b']] } });
  s.ctx.verifyNow();
  assert.deepEqual(s.verify().slice(0, 2).map(r => r[2]), ['0012', '2026-11-24']);
});

test('S2-1: a second run appends below the first, never over it', () => {
  const s = setup();
  s.ctx.verifyNow(); s.w.clock.t += 60000; s.ctx.verifyNow();
  const c = s.complete();
  assert.equal(c.length, 2); assert.notEqual(c[0][0], c[1][0]);
  assert.equal(s.verify().length, 8);
});

// ---------------------------------------------------------------- 2. headers

test('S2-2: trailing blank header columns are dropped (same hashes as without them)', () => {
  const plain = setup({ tabs: { INDEX: [['candidate_id', 'name'], ['a-1', 'x'], ['a-2', 'y']] } });
  plain.ctx.verifyNow();
  const wide = setup({ tabs: { INDEX: [['candidate_id', 'name', '', ''], ['a-1', 'x', '', ''], ['a-2', 'y', '', '']] } });
  wide.ctx.verifyNow();
  assert.deepEqual(wide.verify().slice(0, 2).map(r => r[3]), plain.verify().slice(0, 2).map(r => r[3]));
});

test('S2-2 must-fail: an all-blank header row (or an empty tab) stops with an error; no #complete', () => {
  for (const rows of [[['', ''], ['a-1', 'x']], []]) {
    const s = setup({ tabs: { INDEX: rows } });
    s.w.db = (fn) => (fn === 'tonight' ? { code: 200, json: { export_group: '2026-11-24', open_batches: [],
      tabs: [{ tab: 'INDEX', status: 'PASS', copy_id: COPY, hours_since_good: 0 }] } } : { code: 500, text: 'no' });
    assert.throws(() => s.ctx.verifyOnly(), /no header row/, JSON.stringify(rows));
    assert.equal(s.complete().length, 0);
  }
});

test('S2-2 must-fail: a blank header between real ones stops with an error; no #complete', () => {
  const s = setup({ tabs: { INDEX: [['candidate_id', '', 'name'], ['a-1', '', 'x']] } });
  assert.throws(() => s.ctx.verifyNow(), /blank header/);
  assert.equal(s.complete().length, 0);
  assert.equal(s.verify().length, 0);
});

// ---------------------------------------------------------------- 3. lock

test('S2-3: verifyNow holds the script lock until #complete is written', () => {
  const s = setup();
  s.ctx.verifyNow();
  const writes = verifyWrites(s.w);
  assert.ok(writes.length >= 1 && writes.every(x => x.lockHeld), JSON.stringify(writes));
  assert.ok(!s.w.lockHeld, 'released at the end');
});

// ---------------------------------------------------------------- 7. verifyOnly

function allGood(copyFor = () => COPY) {
  return st => ({ export_group: '2026-11-24', statement_timeout: '8s', open_batches: [],
    tabs: Object.keys(st).map(t => ({ tab: t, status: 'NOTHING_NEW', copy_id: copyFor(t), hours_since_good: 1 })) });
}

test('S2-7: verifyOnly hashes the live tracker with NO export, labelled with the copy of the newest good rows', () => {
  const s = setup({ tonight: allGood() });
  s.ctx.verifyOnly();
  assert.deepEqual(fns(s.w), ['tonight']);
  assert.equal(copies(s.w).length, 0, 'no copy');
  assert.equal(s.puts.length, 0);
  const c = s.complete();
  assert.equal(c.length, 1); assert.match(c[0][0], new RegExp(`^v-\\d{8}T\\d{6}Z-[0-9a-f-]{8}@${COPY}$`));
  assert.equal(c[0][2], '3');
  assert.equal(s.status.sheets.status.length, 1, 'no status row');
});

test('S2-7 must-fail: verifyOnly never calls put_tab or record_result, also when a tab is not good (it stops instead)', () => {
  for (const bad of ['STOPPED', 'FAIL', 'WAIT', 'MISSING', 'UNDONE']) {
    const s = setup({ tonight: st => ({ export_group: '2026-11-24', open_batches: [],
      tabs: Object.keys(st).map(t => ({ tab: t, status: bad, copy_id: COPY, hours_since_good: 1 })) }) });
    assert.throws(() => s.ctx.verifyOnly(), /not good/, bad);
    assert.ok(!fns(s.w).some(f => f === 'put_tab' || f === 'record_result'), bad);
    assert.equal(s.verify().length, 0, bad);
  }
});

test('S2-7: tabs from different copies: the label names each copy once; a copy id not from the export stops', () => {
  const s = setup({ tabs: { INDEX: [['candidate_id', 'name'], ...idx(1)], DELIGHTS: [['delight_id', 'hook'], ['D1', 'h']] },
    tonight: allGood(t => (t === 'INDEX' ? COPY : 'c-20261124T070000Z-ffff0000')) });
  s.ctx.verifyOnly();
  assert.match(s.complete()[0][0], /@c-20261124T070000Z-ffff0000\+c-20261124T150000Z-abcd1234$/);
  const t = setup({ tonight: allGood(() => 'drill-20261124T150000Z-abcd1234') });
  assert.throws(() => t.ctx.verifyOnly(), /INDEX good copy drill-.* was not made by the export/);
  assert.equal(t.verify().length, 0);
});

test('S2-7: verifyOnly runs while paused (it writes nothing to the database) and holds the lock to the end', () => {
  const s = setup({ tonight: allGood() });
  s.w.props.paused = 'yes';
  s.ctx.verifyOnly();
  assert.ok(verifyWrites(s.w).every(x => x.lockHeld));
  assert.ok(!s.w.lockHeld);
  s.w.lockHeld = true;
  assert.throws(() => s.ctx.verifyOnly(), /another export run/);
});

// ---------------------------------------------------------------- 8. monitorCheck

function monitorWorld(stateFor) {
  return setup({ tabs: Object.fromEntries(EIGHT.map(t => [t, [['x']]])),
    tonight: () => ({ export_group: '2026-11-24', statement_timeout: '8s', open_batches: [],
      tabs: EIGHT.map(t => ({ tab: t, ...stateFor(t) })) }) });
}

test('S2-8: monitorCheck writes every tab status, reason and hours to selftest; only tonight() is called', () => {
  const s = monitorWorld(t => (t === 'NUMBER_MAP' ? { status: 'STOPPED', reason: 'removed keys without approval: NM0001', hours_since_good: 0.5 }
    : { status: 'PASS', reason: null, hours_since_good: 0.1 }));
  s.ctx.monitorCheck();
  assert.deepEqual(fns(s.w), ['tonight']);
  const rows = s.selftest();
  const per = rows.filter(r => r[1].startsWith('monitor '));
  assert.equal(per.length, 8);
  const nm = per.find(r => r[1] === 'monitor NUMBER_MAP');
  assert.equal(nm[2], 'STOPPED'); assert.match(nm[3], /removed keys without approval: NM0001/); assert.match(nm[3], /hours 0.5/);
  const done = rows.find(r => r[1] === '#monitor');
  assert.equal(done[2], '1');
  assert.ok(!s.w.lockHeld);
});

test('S2-8 must-fail: monitorCheck makes no write call to the database (put_tab, record_result) whatever the state', () => {
  for (const st of ['MISSING', 'WAIT', 'STOPPED']) {
    const s = monitorWorld(() => ({ status: st, reason: 'x', hours_since_good: null }));
    s.ctx.monitorCheck();
    assert.deepEqual(fns(s.w), ['tonight'], st);
    assert.equal(copies(s.w).length, 0);
    assert.equal(s.status.sheets.status.length, 1, 'no status row');
  }
});

test('S2-8 + drill 2: the #monitor answer fed through the session-check rules gives a NUMBER_MAP problem line', () => {
  const s = monitorWorld(t => (t === 'NUMBER_MAP' ? { status: 'STOPPED', reason: 'removed keys without approval: NM0001', hours_since_good: 0.5 }
    : { status: 'NOTHING_NEW', reason: null, hours_since_good: 0.2 }));
  s.ctx.monitorCheck();
  const done = s.selftest().find(r => r[1] === '#monitor');
  const row = JSON.parse(done[3]);
  assert.equal(row.length, 9, 'a full status row');
  assert.equal(row[2], 'no'); assert.equal(row[7], 'monitorCheck');
  const alarm = [['t'], ['2026-11-24T12:48:33Z', 'checked', 'all good']];
  assert.deepEqual(sessionCheck({ status: [['run_utc'], row], alarm, expected: EIGHT, now: '2026-11-24T15:05:00Z' }), ['NUMBER_MAP: STOPPED']);
  // and an all-good answer gives no problem line
  const g = monitorWorld(() => ({ status: 'PASS', reason: null, hours_since_good: 0.2 }));
  g.ctx.monitorCheck();
  const row2 = JSON.parse(g.selftest().find(r => r[1] === '#monitor')[3]);
  assert.equal(row2[2], 'yes');
  assert.deepEqual(sessionCheck({ status: [['run_utc'], row2], alarm, expected: EIGHT, now: '2026-11-24T15:05:00Z' }), []);
});

test('S2-8: monitorCheck makes the selftest tab if it is missing', () => {
  const s = monitorWorld(() => ({ status: 'PASS', hours_since_good: 0 }));
  delete s.status.sheets.selftest;
  s.ctx.monitorCheck();
  assert.equal(s.status.sheets.selftest[0].map(c => c.v).join(','), 'time_utc,check,result,detail');
});

// ---------------------------------------------------------------- 4. drillStop

const NM = [['map_id', 'street', 'number'], ['NM0001', 'Broadway', '1'], ['NM0002', 'Broadway', '2'], ['NM0003', 'Bowery', '3']];

test('S2-4 must-fail: drillStop refuses any DB_URL but the exact import-try one (no call made)', () => {
  const bad = ['https://ep-prod.example/neondb/rest/v1', IMPORT_TRY + '/', IMPORT_TRY + 'x', 'https://evil.example/?u=' + IMPORT_TRY,
    IMPORT_TRY.toUpperCase(), ' ' + IMPORT_TRY, IMPORT_TRY.replace('/rest/v1', '/rest/v1/rpc')];
  for (const url of bad) {
    const s = setup({ tabs: { NUMBER_MAP: NM }, dbUrl: url });
    assert.throws(() => s.ctx.drillStop('NUMBER_MAP', 'NM0002'), /import-try/, url);
    assert.deepEqual(s.w.calls, [], url);
  }
});

test('S2-4: drillStop sends the tab minus one key, fresh copy id, copy_utc now, New York date; logs the answer', () => {
  const s = setup({ tabs: { NUMBER_MAP: NM }, dbUrl: IMPORT_TRY,
    put: () => ({ code: 200, json: { status: 'STOPPED', reason: 'removed keys without approval: NM0002' } }) });
  s.ctx.drillStop('NUMBER_MAP', 'NM0002');
  assert.deepEqual(fns(s.w), ['put_tab']);
  const b = s.puts[0];
  assert.deepEqual(Object.keys(b).sort(), ['client_version', 'copy_id', 'copy_utc', 'export_group', 'headers', 'rows', 'tab']);
  assert.equal(b.tab, 'NUMBER_MAP');
  assert.deepEqual(b.headers, ['map_id', 'street', 'number']);
  assert.deepEqual(b.rows.map(r => r.c[0]), ['NM0001', 'NM0003']);
  assert.deepEqual(b.rows.map(r => r.r), [2, 4], 'sheet rows kept');
  assert.equal(b.copy_utc, '2026-11-24T15:00:00.000Z');
  assert.equal(b.export_group, '2026-11-24');
  assert.match(b.copy_id, /^drill-\d{8}T\d{6}Z-[0-9a-f]{8}$/);
  const log = s.selftest().find(r => r[1] === 'drillStop NUMBER_MAP');
  assert.equal(log[2], 'STOPPED'); assert.match(log[3], /removed keys without approval: NM0002/); assert.match(log[3], /drop NM0002/);
  assert.ok(!s.w.lockHeld);
});

test('S2-4: two drillStops: different copy ids, the second copy time newer; New York date near midnight', () => {
  const s = setup({ tabs: { NUMBER_MAP: NM }, dbUrl: IMPORT_TRY, now: '2026-11-25T04:30:00Z' });   // 11:30pm Nov 24 New York
  s.ctx.drillStop('NUMBER_MAP', 'NM0002');
  s.w.clock.t += 61000;
  s.ctx.drillStop('NUMBER_MAP', 'NM0002');
  assert.notEqual(s.puts[0].copy_id, s.puts[1].copy_id);
  assert.ok(Date.parse(s.puts[1].copy_utc) > Date.parse(s.puts[0].copy_utc));
  assert.equal(s.puts[0].export_group, '2026-11-24');
});

test('S2-4: drillStop refuses an unknown key, a key found twice, a tab not on the list, and while paused (no call)', () => {
  const cases = [
    [NM, 'NUMBER_MAP', 'NM9999', /not found/],
    [[...NM, ['NM0002', 'dup', '9']], 'NUMBER_MAP', 'NM0002', /more than once/],
    [NM, 'SELFTEST', 'NM0002', /not a door tab/],
    [NM, 'constructor', 'NM0002', /not a door tab/],
    [NM, 'toString', 'NM0002', /not a door tab/],
  ];
  for (const [rows, tab, key, re] of cases) {
    const s = setup({ tabs: { NUMBER_MAP: rows }, dbUrl: IMPORT_TRY });
    assert.throws(() => s.ctx.drillStop(tab, key), re, key);
    assert.deepEqual(s.w.calls, []);
  }
  const p = setup({ tabs: { NUMBER_MAP: NM }, dbUrl: IMPORT_TRY });
  p.w.props.paused = 'yes';
  assert.throws(() => p.ctx.drillStop('NUMBER_MAP', 'NM0002'), /paused/);
  assert.deepEqual(p.w.calls, []);
});

test('S2-4: drillStop works with a two-column key (STORY_TEXT story_id@run_id)', () => {
  const ST = [['story_id', 'run_id', 'text'], ['ST001', 'run-20261101T010000Z', 'a'], ['ST001', 'run-20261102T010000Z', 'b']];
  const s = setup({ tabs: { STORY_TEXT: ST }, dbUrl: IMPORT_TRY });
  s.ctx.drillStop('STORY_TEXT', 'ST001@run-20261101T010000Z');
  assert.deepEqual(s.puts[0].rows.map(r => r.c[2]), ['b']);
});

// ---------------------------------------------------------------- 9. drillStopRun

test('S2-9: drillStopRun refuses with no DRILL_KEY or no DRILL_TAB (no call); with both it runs drillStop', () => {
  for (const props of [{ DRILL_TAB: 'NUMBER_MAP' }, { DRILL_KEY: 'NM0002' }, {}, { DRILL_TAB: 'NUMBER_MAP', DRILL_KEY: '' }]) {
    const s = setup({ tabs: { NUMBER_MAP: NM }, dbUrl: IMPORT_TRY });
    Object.assign(s.w.props, props);
    assert.throws(() => s.ctx.drillStopRun(), /DRILL_TAB and DRILL_KEY/, JSON.stringify(props));
    assert.deepEqual(s.w.calls, []);
  }
  const s = setup({ tabs: { NUMBER_MAP: NM }, dbUrl: IMPORT_TRY });
  Object.assign(s.w.props, { DRILL_TAB: 'NUMBER_MAP', DRILL_KEY: 'NM0002' });
  s.ctx.drillStopRun();
  assert.deepEqual(s.puts[0].rows.map(r => r.c[0]), ['NM0001', 'NM0003']);
});
