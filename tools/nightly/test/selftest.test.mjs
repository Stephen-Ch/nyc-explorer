// Plan 47 amendment A3: selfTest() for live test 13g, under fake Apps Script services and a fake clock.
// T1-T6c refer to plans/plan-47-amendment-A3-draft2.md. T7 (through the real door) is in db.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, load, tracker, cell, testKeys } from './shim.mjs';

const KEYS = testKeys();
const EIGHT = ['STORIES', 'DELIGHTS', 'INDEX', 'STORY_TEXT', 'PLACE_HOOKS', 'PEOPLE', 'NAME_LINKS', 'NUMBER_MAP'];
const PUT_ARGS = ['client_version', 'copy_id', 'copy_utc', 'export_group', 'headers', 'rows', 'tab'];
const RESULT_ARGS = ['client_version', 'entries', 'export_group'];

// 2:15pm New York on Nov 18 2026 = 19:15 UTC (daytime: selfTest is run by hand, any hour)
function setup({ now = '2026-11-18T19:15:00Z', tabs = EIGHT, put = null, result = null, storiesRows = null, tonightCode = 200 } = {}) {
  const w = makeWorld({ now });
  const sH = ['story_id', 'place', 'original_link', 'pointer_source (modern, credit only)', 'notes'];
  const tr = tracker(w, {
    STORIES: [sH, ...(storiesRows || [['ST001', 'Union Square', cell('https://loc.gov/a', { links: ['https://loc.gov/a'] }), '', 'n1']])],
    QUEUE: [['status']], STORY_QUEUE: [['status']], REWRITE_QUEUE: [['status']],
  });
  const status = w.makeSpreadsheet('NYC nightly status', { status: [[cell('run_utc')]], verify: [[cell('run')]],
    selftest: [[cell('time_utc'), cell('check'), cell('result'), cell('detail')]] });
  Object.assign(w.props, { DB_URL: 'https://db.example/rest/v1', PRIVATE_KEY: KEYS.der64, TRACKER_ID: tr.id, STATUS_SHEET_ID: status.id });
  const bodies = {};
  w.db = (fn, body) => {
    bodies[fn] = body;
    if (fn === 'tonight') {
      if (tonightCode !== 200) return { code: tonightCode, text: 'Could not find the function api.tonight' };
      return { code: 200, json: { export_group: '2026-11-18', statement_timeout: '15s', open_batches: [],
        tabs: tabs.map(t => ({ tab: t, status: 'MISSING' })) } };
    }
    if (fn === 'put_tab') return put || { code: 200, json: { status: 'STOPPED', reason: `tab ${body.tab} is not on the list` } };
    if (fn === 'record_result') return result || { code: 200, json: { status: 'LOGGED', count: 1 } };
    return { code: 404, text: 'no such function' };
  };
  const ctx = load(w, 'export.gs');
  const rows = () => status.sheets.selftest.slice(1).map(r => r.map(c => c.v));
  return { w, ctx, tr, status, rows, bodies };
}
const fns = w => w.calls.map(c => c.fn);
const copies = w => [...w.files.values()].filter(f => f.name.startsWith('nyc-export-copy-'));
const byCheck = rows => Object.fromEntries(rows.filter(r => r[1] !== '#done').map(r => [r[1], r]));
const done = rows => rows.find(r => r[1] === '#done');

test('A3 T1: a good self-test: tonight, put_tab, record_result in order; all PASS; #done 0; no copy, no status or verify row', () => {
  const { w, ctx, status, rows } = setup();
  ctx.selfTest();
  assert.deepEqual(fns(w), ['tonight', 'put_tab', 'record_result']);
  for (const c of w.calls) assert.equal(typeof c.opts.timeoutSeconds, 'number', c.fn);
  const r = rows();
  for (const x of r.filter(x => x[1] !== '#done')) assert.equal(x[2], 'PASS', x[1] + ': ' + x[3]);
  assert.deepEqual(Object.keys(byCheck(r)).sort(), ['put_tab', 'record_result', 'stories_size', 'tonight']);
  assert.equal(done(r)[2], '0');
  assert.equal(copies(w).length, 0, 'no copy');
  assert.equal(status.sheets.status.length, 1, 'no status row');
  assert.equal(status.sheets.verify.length, 1, 'no verify row');
  assert.ok(!w.lockHeld, 'lock released');
  assert.match(byCheck(r).tonight[3], /15s/, 'statement_timeout recorded');
  assert.match(byCheck(r).stories_size[3], /bytes/);
});

test('A3 T2: tonight() tab list missing a tab, or with an extra one: that check FAIL and the run throws', () => {
  for (const tabs of [EIGHT.slice(1), [...EIGHT, 'EXTRA']]) {
    const { ctx, rows } = setup({ tabs });
    assert.throws(() => ctx.selfTest(), /selfTest: 1 check failed/);
    assert.equal(byCheck(rows()).tonight[2], 'FAIL');
    assert.equal(done(rows())[2], '1');
  }
});

test('A3 T3: put_tab STOPPED for the wrong reason (the guard), or PASS: FAIL', () => {
  for (const put of [{ code: 200, json: { status: 'STOPPED', reason: 'time limit missing: 0' } },
                     { code: 200, json: { status: 'STOPPED', reason: 'token sub is not nightly-export' } },
                     { code: 200, json: { status: 'PASS' } }]) {
    const { ctx, rows } = setup({ put });
    assert.throws(() => ctx.selfTest(), /check failed/);
    assert.equal(byCheck(rows()).put_tab[2], 'FAIL', JSON.stringify(put));
  }
});

test('A3 T4: record_result HTTP 400: FAIL; the run still writes #done and throws', () => {
  const { ctx, rows } = setup({ result: { code: 400, text: 'bad' } });
  assert.throws(() => ctx.selfTest(), /check failed/);
  assert.equal(byCheck(rows()).record_result[2], 'FAIL');
  assert.match(byCheck(rows()).record_result[3], /HTTP 400/);
  assert.equal(done(rows())[2], '1');
});

test('A3 T4b: tonight() 404 (stale schema cache): FAIL says so; the other checks still run', () => {
  const { ctx, rows, w } = setup({ tonightCode: 404 });
  assert.throws(() => ctx.selfTest(), /check failed/);
  assert.match(byCheck(rows()).tonight[3], /schema cache/);
  assert.deepEqual(fns(w), ['tonight', 'put_tab', 'record_result']);
});

test('A3 T4c: put_tab 404 after tonight() 200: FAIL says wrong argument names, not the cache', () => {
  const { ctx, rows } = setup({ put: { code: 404, text: 'Could not find the function api.put_tab' } });
  assert.throws(() => ctx.selfTest(), /check failed/);
  assert.match(byCheck(rows()).put_tab[3], /argument names/);
});

test('A3 T5: paused: no call at all; lock held: throws, no call', () => {
  const a = setup();
  a.w.props.paused = 'yes';
  assert.throws(() => a.ctx.selfTest(), /paused/);
  assert.deepEqual(a.w.calls, []);
  const b = setup();
  b.w.lockHeld = true;
  assert.throws(() => b.ctx.selfTest(), /another export run/);
  assert.deepEqual(b.w.calls, []);
});

test('A3 T6: exact argument names; tab SELFTEST_13G; copy_id shape; New York date; client_version sent', () => {
  // 11:30pm New York on Nov 18 = 04:30 UTC Nov 19: the date must be the New York one
  const { ctx, bodies } = setup({ now: '2026-11-19T04:30:00Z' });
  ctx.selfTest();
  assert.deepEqual(Object.keys(bodies.put_tab).sort(), PUT_ARGS);
  assert.deepEqual(Object.keys(bodies.record_result).sort(), RESULT_ARGS);
  assert.equal(bodies.put_tab.tab, 'SELFTEST_13G');
  assert.match(bodies.put_tab.copy_id, /^selftest-\d{8}T\d{6}Z-[0-9a-f]{8}$/);
  assert.match(bodies.put_tab.copy_id, /^[A-Za-z0-9._:-]{1,200}$/, "the door's copy_id rule");
  assert.equal(bodies.put_tab.export_group, '2026-11-18');
  assert.equal(bodies.record_result.export_group, '2026-11-18');
  assert.deepEqual(bodies.put_tab.headers, ['x']); assert.deepEqual(bodies.put_tab.rows, []);
  assert.equal(bodies.put_tab.client_version, 'dev'); assert.equal(bodies.record_result.client_version, 'dev');
  assert.equal(bodies.record_result.entries.length, 1);
  assert.equal(bodies.record_result.entries[0].tab, 'NUMBER_MAP');
  assert.equal(bodies.record_result.entries[0].status, 'WAIT');
  assert.match(bodies.record_result.entries[0].message, /^selftest 13g /);
});

test('A3 T6b: STORIES over 1 MB: FAIL; size counts UTF-8 bytes plus 2 per cell, not characters', () => {
  const big = Array.from({ length: 30 }, (_, i) => [`ST${String(i + 1).padStart(3, '0')}`, 'x'.repeat(40000), '', '', 'n']);
  const a = setup({ storiesRows: big });
  assert.throws(() => a.ctx.selfTest(), /check failed/);
  assert.equal(byCheck(a.rows()).stories_size[2], 'FAIL');
  // one row of 3-byte characters: bytes are about 3x the characters
  const b = setup({ storiesRows: [['ST001', '中'.repeat(1000), '', '', '']] });
  b.ctx.selfTest();
  const n = Number(/(\d+) bytes/.exec(byCheck(b.rows()).stories_size[3])[1]);
  assert.ok(n > 3000, `bytes ${n}`);
  // the database measures the jsonb text, which adds a space after each , and : : 2 bytes per cell (7 cells with the 2 __urls)
  const plain = JSON.stringify([{ r: 2, c: ['ST001', '中'.repeat(1000), '', '[]', '', '[]', ''] }]);
  assert.equal(n, Buffer.byteLength(plain) + 2 * 7);
});

test('A3 T6c: put_tab STOPPED "lock wait": FAIL with detail re-run selfTest', () => {
  const { ctx, rows } = setup({ put: { code: 200, json: { status: 'STOPPED', reason: 'lock wait: canceling statement due to lock timeout' } } });
  assert.throws(() => ctx.selfTest(), /check failed/);
  assert.match(byCheck(rows()).put_tab[3], /re-run selfTest/);
});

test('A3: every selftest value is written as text (no retyping of dates or numbers)', () => {
  const { ctx, status } = setup();
  ctx.selfTest();
  const t = status.sheets.selftest[1][0].v;
  assert.match(t, /^\d{4}-\d{2}-\d{2}T/);
});

test('A3 code review m1, m3: config fails (DB_URL missing): one setup FAIL row naming it, #done 1, throws, no call, lock released', () => {
  const { ctx, rows, w } = setup();
  delete w.props.DB_URL;
  assert.throws(() => ctx.selfTest(), /check failed/);
  assert.deepEqual(w.calls, []);
  assert.ok(!w.lockHeld);
  const r = rows();
  assert.equal(r[0][1], 'setup'); assert.equal(r[0][2], 'FAIL'); assert.match(r[0][3], /DB_URL is not set/);
  assert.equal(done(r)[2], '1');
  assert.ok(w.logs.some(l => /DB_URL is not set/.test(l)), 'results logged before the sheet write');
});

test('A3 code review m1: STATUS_SHEET_ID missing: the error names it and carries the results', () => {
  const { ctx, w } = setup();
  delete w.props.STATUS_SHEET_ID;
  assert.throws(() => ctx.selfTest(), /STATUS_SHEET_ID is not set.*setup/s);
});

test('A3 code review m2: selftest tab missing: inserted with its header row first', () => {
  const { ctx, status } = setup();
  delete status.sheets.selftest;
  ctx.selfTest();
  assert.equal(status.sheets.selftest[0].map(c => c.v).join(','), 'time_utc,check,result,detail');
  assert.equal(status.sheets.selftest.length, 6);
});

test('A3 Copilot: tonight() and put_tab both 404: put_tab hint says stale cache, not wrong argument names', () => {
  const { ctx, rows } = setup({ tonightCode: 404, put: { code: 404, text: 'Could not find the function api.put_tab' } });
  assert.throws(() => ctx.selfTest(), /checks? failed/);
  assert.match(byCheck(rows()).put_tab[3], /schema cache/);
  assert.doesNotMatch(byCheck(rows()).put_tab[3], /argument names/);
});
