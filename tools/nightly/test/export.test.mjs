// Plan 47 tests for export.gs (the nightly export script) under fake Apps Script services and a fake clock.
// Numbers refer to plan 47 draft 10 tests (8, 8a, 9, 10, 13c, 13d, 13h, 13m, 13p) and amendment A2 (13c budget).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { makeWorld, load, tracker, cell, testKeys } from './shim.mjs';

const KEYS = testKeys();
const TABS = ['STORIES', 'DELIGHTS', 'INDEX'];
const GOOD = ['PASS', 'ALREADY', 'NOTHING_NEW'];
const H = {
  STORIES: ['story_id', 'place', 'original_link', 'pointer_source (modern, credit only)', 'notes'],
  DELIGHTS: ['delight_id', 'loc_link', 'hook'],
  INDEX: ['candidate_id', 'name'],
};
const CLAIM_H = ['unit_id', 'status', 'claimed_at_utc'];

// 1:05am New York on Nov 19 2026 = 06:05 UTC
function setup({ now = '2026-11-19T06:05:00Z', claims = {}, tabs = TABS, dbState = {} } = {}) {
  const w = makeWorld({ now });
  const tr = tracker(w, {
    STORIES: [H.STORIES, ['ST001', 'Union Square', cell('https://loc.gov/a', { links: ['https://loc.gov/a'] }), '', 'n1'], ['ST002', 'Tiffany', '', '', 'n2']],
    DELIGHTS: [H.DELIGHTS, ['D001', '', 'hook 1']],
    INDEX: [H.INDEX, ['us-1877-a', 'A'], ['us-1877-b', 'B']],
    QUEUE: [CLAIM_H, ...(claims.QUEUE || [])],
    STORY_QUEUE: [CLAIM_H, ...(claims.STORY_QUEUE || [])],
    REWRITE_QUEUE: [CLAIM_H, ...(claims.REWRITE_QUEUE || [])],
  });
  const status = w.makeSpreadsheet('NYC nightly status', { status: [[cell('run_utc')]], verify: [[cell('tab')]] });
  Object.assign(w.props, { DB_URL: 'https://db.example/rest/v1', PRIVATE_KEY: KEYS.der64, TRACKER_ID: tr.id, STATUS_SHEET_ID: status.id });
  // fake database: remembers each tab's status tonight
  const state = Object.fromEntries(tabs.map(t => [t, dbState[t] || 'MISSING']));
  const replies = {};          // tab -> list of replies for put_tab, used in order
  const db = { state, replies, failTonight: 0, puts: [], results: [] };
  w.db = (fn, body) => {
    if (fn === 'tonight') {
      if (db.failTonight > 0) { db.failTonight--; return { code: 503, text: 'unavailable' }; }
      return { code: 200, json: { export_group: '2026-11-19', statement_timeout: '8s', open_batches: [],
        tabs: Object.entries(state).map(([tab, status]) => ({ tab, status, hours_since_good: GOOD.includes(status) ? 0.1 : null })) } };
    }
    if (fn === 'put_tab') {
      db.puts.push(body);
      const r = (replies[body.tab] || []).shift() || { code: 200, json: { status: 'PASS' } };
      if (r.code === 200 && r.json && GOOD.includes(r.json.status)) state[body.tab] = r.json.status;
      return r;
    }
    if (fn === 'record_result') { db.results.push(body); for (const e of body.entries) state[e.tab] = e.status; return { code: 200, json: { status: 'LOGGED' } }; }
    return { code: 404, text: 'no such function' };
  };
  const ctx = load(w, 'export.gs');
  const statusRows = () => status.sheets.status.slice(1).map(r => r.map(c => c.v));
  return { w, ctx, tr, status, db, statusRows };
}
const fns = w => w.calls.map(c => c.fn);
const copies = w => [...w.files.values()].filter(f => f.name.startsWith('nyc-export-copy-'));

test('8: outside 1:00-5:59am New York: exits before any database call or copy', async () => {
  for (const now of ['2026-11-19T05:59:00Z', '2026-11-19T11:00:00Z', '2026-11-19T16:00:00Z']) {   // 12:59am, 6:00am, 11am
    const { w, ctx } = setup({ now });
    ctx.nightly();
    assert.deepEqual(w.calls, [], now); assert.equal(copies(w).length, 0);
  }
});

test('8: a good night: tonight, one copy, put_tab per tab, copy trashed, status row written', async () => {
  const { w, ctx, db, statusRows } = setup();
  ctx.nightly();
  assert.deepEqual(fns(w), ['tonight', 'put_tab', 'put_tab', 'put_tab', 'tonight']);
  assert.deepEqual(db.puts.map(p => p.tab), TABS);
  assert.equal(copies(w).length, 1); assert.ok(copies(w)[0].trashed);
  const rows = statusRows();
  assert.equal(rows.length, 1);
  assert.equal(rows[0][1], '2026-11-19'); assert.equal(rows[0][2], 'yes');
  assert.deepEqual(Object.keys(JSON.parse(rows[0][3])), TABS);
  assert.ok(!w.lockHeld, 'lock released');
  assert.equal(w.props.COPY_IDS, '[]');
  // every put_tab body is the door's signature
  for (const p of db.puts) assert.deepEqual(Object.keys(p).sort(), ['client_version', 'copy_id', 'copy_utc', 'export_group', 'headers', 'rows', 'tab']);
  assert.equal(new Set(db.puts.map(p => p.copy_id)).size, 1, 'one copy for the run');
});

test('8: tabs already done tonight (from tonight(), not Script Properties) are not sent again; all done: no copy', async () => {
  const { w, ctx, db } = setup({ dbState: { STORIES: 'PASS', DELIGHTS: 'NOTHING_NEW' } });
  ctx.nightly();
  assert.deepEqual(db.puts.map(p => p.tab), ['INDEX']);
  const s2 = setup({ dbState: { STORIES: 'PASS', DELIGHTS: 'ALREADY', INDEX: 'NOTHING_NEW' } });
  s2.ctx.nightly();
  assert.deepEqual(fns(s2.w), ['tonight', 'tonight']); assert.equal(copies(s2.w).length, 0);
  assert.equal(s2.statusRows().length, 1);
});

test('8: busy rule: a live claim waits (no copy, no record); a dead claim is ignored and reported; at 5am busy is SKIPPED', async () => {
  const live = { QUEUE: [['US-1852', 'claimed', '2026-11-19T05:30:00Z']] };                 // 35 min old
  const a = setup({ claims: live });
  a.ctx.nightly();
  assert.deepEqual(fns(a.w), ['tonight', 'tonight']); assert.equal(copies(a.w).length, 0); assert.equal(a.db.results.length, 0);
  assert.match(a.statusRows()[0][7], /busy/);
  const dead = { STORY_QUEUE: [['ST-N-1852', 'claimed', '2026-11-19T04:00:00Z']] };          // 125 min old
  const b = setup({ claims: dead });
  b.ctx.nightly();
  assert.equal(b.db.puts.length, 3);
  assert.match(b.statusRows()[0][4], /STORY_QUEUE.*ST-N-1852/);
  const five = setup({ now: '2026-11-19T10:10:00Z', claims: { REWRITE_QUEUE: [['RW-1', 'claimed', '2026-11-19T10:00:00Z']] } });  // 5:10am
  five.ctx.nightly();
  assert.equal(five.db.puts.length, 0);
  assert.equal(five.db.results.length, 1);
  assert.deepEqual(five.db.results[0].entries.map(e => [e.tab, e.status]), TABS.map(t => [t, 'SKIPPED']));
});

test('8: a claim that appears after the copy was made: copy trashed, try next hour', async () => {
  const s = setup();
  const orig = s.w.global.DriveApp.getFileById;
  // the claim lands while the copy is being made
  let firstRead = true;
  const ctx = s.ctx;
  ctx.DriveApp = { ...ctx.DriveApp, getFileById: id => {
    const f = orig(id);
    if (id === s.tr.id && firstRead) {
      firstRead = false;
      return { ...f, makeCopy: n => { s.tr.sheets.QUEUE.push([cell('US-1877'), cell('claimed'), cell('2026-11-19T06:04:00Z')]); return f.makeCopy(n); } };
    }
    return f;
  } };
  ctx.nightly();
  assert.equal(s.db.puts.length, 0);
  assert.equal(copies(s.w).length, 1); assert.ok(copies(s.w)[0].trashed);
});

test('8a: two runs at once: the second exits on the lock without any call', async () => {
  const { w, ctx } = setup();
  w.lockHeld = true;
  ctx.nightly();
  assert.deepEqual(w.calls, []);
});

test('8a: a run killed after importing a tab: the next run skips it because tonight() says done', async () => {
  const s = setup();
  s.db.replies.DELIGHTS = [{ code: 200, json: { status: 'PASS' } }];
  // first run "killed" after STORIES: simulate by marking STORIES done in the database only
  s.db.state.STORIES = 'PASS';
  s.ctx.nightly();
  assert.deepEqual(s.db.puts.map(p => p.tab), ['DELIGHTS', 'INDEX']);
});

test('9: payload: shown text, __urls after each link column as JSON text (HYPERLINK first, then each run link), blank rows dropped', async () => {
  const w = makeWorld();
  const tr = tracker(w, {
    STORIES: [H.STORIES,
      ['ST001', 'a, "quoted"', cell('see here', { f: '=HYPERLINK("https://h.example/1","see here")', links: ['https://h.example/1'] }), '', 'line1\nline2'],
      ['ST002', '1.5E+10', cell('two links', { links: ['https://a.example/1', null, 'https://b.example/2'] }), cell('https://p.example', { links: ['https://p.example'] }), ''],
      ['', '', '', '', ''],
      ['ST003', '1852-10', '', '', '=not a formula']],
    QUEUE: [CLAIM_H], STORY_QUEUE: [CLAIM_H], REWRITE_QUEUE: [CLAIM_H],
  });
  const ctx = load(w, 'export.gs');
  const p = JSON.parse(JSON.stringify(ctx.readTab_(w.files.get(tr.id), 'STORIES')));   // out of the script's realm
  assert.deepEqual(p.headers, ['story_id', 'place', 'original_link', 'original_link__urls', 'pointer_source (modern, credit only)',
    'pointer_source (modern, credit only)__urls', 'notes']);
  assert.deepEqual(p.rows, [
    { r: 2, c: ['ST001', 'a, "quoted"', 'see here', '["https://h.example/1","https://h.example/1"]', '', '[]', 'line1\nline2'] },
    { r: 3, c: ['ST002', '1.5E+10', 'two links', '["https://a.example/1","https://b.example/2"]', 'https://p.example', '["https://p.example"]', ''] },
    { r: 5, c: ['ST003', '1852-10', '', '[]', '', '[]', '=not a formula'] },
  ]);
});

test('10: RS256 token signed by export.gs verifies against the public key; claims as planned', async () => {
  const { w, ctx } = setup();
  ctx.nightly();
  const tok = w.calls[0].opts.headers.Authorization.replace(/^Bearer /, '');
  const [h, c, s] = tok.split('.');
  assert.ok(!/[=+/]/.test(tok), 'base64url without padding');
  const head = JSON.parse(Buffer.from(h, 'base64url')), claims = JSON.parse(Buffer.from(c, 'base64url'));
  assert.deepEqual(head, { alg: 'RS256', typ: 'JWT', kid: 'export-1' });
  assert.equal(claims.role, 'nyc_loader'); assert.equal(claims.sub, 'nightly-export'); assert.equal(claims.aud, 'nyc-explorer-nightly');
  assert.equal(claims.exp - claims.iat, 300);
  const pub = crypto.createPublicKey({ key: KEYS.jwk, format: 'jwk' });
  assert.ok(crypto.verify('RSA-SHA256', Buffer.from(`${h}.${c}`), pub, Buffer.from(s, 'base64url')));
  const other = testKeys();
  assert.ok(!crypto.verify('RSA-SHA256', Buffer.from(`${h}.${c}`), crypto.createPublicKey({ key: other.jwk, format: 'jwk' }), Buffer.from(s, 'base64url')));
});

test('10: the private key may be pasted as PEM or as one line of base64', async () => {
  const s = setup(); s.w.props.PRIVATE_KEY = KEYS.pem;
  s.ctx.nightly();
  assert.equal(s.db.puts.length, 3);
});

test('13m: a fresh token is signed just before every call, never reused', async () => {
  const s = setup();
  s.w.callMs = 70000;             // slow calls, so the run lasts minutes
  s.ctx.nightly();
  const toks = s.w.calls.map(c => c.opts.headers.Authorization);
  assert.equal(new Set(toks).size, toks.length);
  for (const c of s.w.calls) {
    const claims = JSON.parse(Buffer.from(c.opts.headers.Authorization.split('.')[1], 'base64url'));
    assert.ok(Math.abs(claims.iat * 1000 - c.at) <= 5000, `${c.fn} token issued ${c.at - claims.iat * 1000} ms before the call`);
  }
});

test('13c: every call hangs to its timeout: tab started by 4:30 fails at 4:50, no retry, one record_result, tonight, done by 5:45', async () => {
  const s = setup();
  const start = s.w.clock.t;
  let n = 0;
  s.w.db = (fn, body) => {
    n++;
    if (fn === 'tonight' && n === 1) return { code: 200, json: { export_group: '2026-11-19', statement_timeout: '8s', open_batches: [],
      tabs: TABS.map(t => ({ tab: t, status: 'MISSING' })) } };
    if (fn === 'put_tab' && body.tab === 'STORIES') { s.w.clock.t = start + 269000; return { code: 200, json: { status: 'PASS' } }; }  // ends just before 4:30
    return { hang: true };
  };
  s.ctx.nightly();
  const at = c => (c.at - start) / 1000, end = c => (c.end - start) / 1000;
  const calls = s.w.calls;
  assert.deepEqual(calls.map(c => c.fn), ['tonight', 'put_tab', 'put_tab', 'record_result', 'tonight']);
  assert.ok(at(calls[2]) <= 270, `DELIGHTS started at ${at(calls[2])}`);
  assert.ok(end(calls[2]) <= 290);
  assert.deepEqual(calls[3].body.entries.map(e => [e.tab, e.status]), [['DELIGHTS', 'FAIL'], ['INDEX', 'WAIT']]);
  assert.ok(end(calls[3]) <= 310); assert.ok(end(calls[4]) <= 330);
  assert.ok((s.w.clock.t - start) / 1000 <= 345, `run ended at ${(s.w.clock.t - start) / 1000} s`);
  assert.ok(copies(s.w)[0].trashed); assert.equal(s.statusRows().length, 1);
  assert.equal(calls.filter(c => c.fn === 'record_result').length, 1);
  for (const c of calls) assert.equal(c.opts.timeoutSeconds, 20);
});

test('13c: at 4:31 no new tab starts; a failure at 4:01 starts no retry wait', async () => {
  const s = setup();
  const start = s.w.clock.t;
  s.w.db = (fn, body) => {
    if (fn === 'tonight') return { code: 200, json: { export_group: '2026-11-19', statement_timeout: '8s', open_batches: [], tabs: TABS.map(t => ({ tab: t, status: 'MISSING' })) } };
    if (fn === 'put_tab') { s.w.clock.t = start + 271000; return { code: 200, json: { status: 'PASS' } }; }
    return { code: 200, json: { status: 'LOGGED' } };
  };
  s.ctx.nightly();
  assert.deepEqual(s.w.calls.map(c => c.fn), ['tonight', 'put_tab', 'record_result', 'tonight']);
  assert.deepEqual(s.w.calls[2].body.entries.map(e => [e.tab, e.status]), [['DELIGHTS', 'WAIT'], ['INDEX', 'WAIT']]);
  const t = setup();
  const st = t.w.clock.t;
  t.w.db = (fn, body) => {
    if (fn === 'tonight') return { code: 200, json: { export_group: '2026-11-19', statement_timeout: '8s', open_batches: [], tabs: TABS.map(x => ({ tab: x, status: 'MISSING' })) } };
    if (fn === 'put_tab') { t.w.clock.t = st + 241000; return { code: 500, text: 'boom' }; }
    return { code: 200, json: { status: 'LOGGED' } };
  };
  t.ctx.nightly();
  assert.ok(!t.w.logs.some(l => l.startsWith('sleep')), 'no retry wait after 4:00');
  assert.deepEqual(t.w.calls.map(c => c.fn), ['tonight', 'put_tab', 'record_result', 'tonight']);
});

test('13d: HTTP 200 with STOPPED is not done and not retried; other tabs go on; no WAIT for it', async () => {
  const s = setup();
  s.db.replies.STORIES = [{ code: 200, json: { status: 'STOPPED', reason: 'removed keys without approval: ST009' } }];
  s.ctx.nightly();
  assert.deepEqual(s.db.puts.map(p => p.tab), TABS);
  assert.equal(s.db.results.length, 0);
  const row = s.statusRows()[0];
  assert.equal(row[2], 'no');
});

test('13p, 13j: first tab fails twice: no more put_tab; exactly one record_result with FAIL plus WAIT for the rest', async () => {
  const s = setup();
  s.db.replies.STORIES = [{ hang: true }, { code: 502, text: 'bad gateway' }];
  s.ctx.nightly();
  assert.deepEqual(s.db.puts.map(p => p.tab), ['STORIES', 'STORIES']);
  assert.ok(s.w.logs.includes('sleep 30000'), 'one 30-second wait before the retry');
  assert.equal(s.db.results.length, 1);
  assert.deepEqual(s.db.results[0].entries.map(e => [e.tab, e.status]), [['STORIES', 'FAIL'], ['DELIGHTS', 'WAIT'], ['INDEX', 'WAIT']]);
  assert.match(s.db.results[0].entries[0].message, /502|bad gateway/);
});

test('13p: the first tonight() fails: no copy, no put_tab, status row says database unreachable', async () => {
  const s = setup();
  s.db.failTonight = 2;
  s.ctx.nightly();
  assert.deepEqual(fns(s.w), ['tonight', 'tonight']);
  assert.equal(copies(s.w).length, 0);
  assert.match(s.statusRows()[0][7], /database unreachable/);
  assert.equal(s.statusRows()[0][2], 'no');
});

test('copies: only stored ids are trashed, only if owned by the script owner and named nyc-export-copy-; others reported', async () => {
  const s = setup({ dbState: { STORIES: 'PASS', DELIGHTS: 'PASS', INDEX: 'PASS' } });
  const mine = s.w.makeSpreadsheet('nyc-export-copy-20261118T060500Z');
  const notMine = s.w.makeSpreadsheet('nyc-export-copy-x', {}, 'someone@example.com');
  const wrongName = s.w.makeSpreadsheet('Budget');
  s.w.props.COPY_IDS = JSON.stringify([mine.id, notMine.id, wrongName.id, 'file-gone']);
  s.ctx.nightly();
  assert.ok(mine.trashed); assert.ok(!notMine.trashed); assert.ok(!wrongName.trashed);
  assert.equal(s.w.props.COPY_IDS, '[]');
  assert.match(s.statusRows()[0][7], /not trashed/);
});

test('paused: the Script Property paused stops the run before anything', async () => {
  const s = setup(); s.w.props.paused = 'yes';
  s.ctx.nightly();
  assert.deepEqual(s.w.calls, []);
});

test('status row: stuck claims, open batches, statement_timeout and client version are written', async () => {
  const s = setup({ claims: { QUEUE: [['US-1902', 'claimed', '2026-11-18T20:00:00Z']] } });
  s.w.db = (fn) => fn === 'tonight'
    ? { code: 200, json: { export_group: '2026-11-19', statement_timeout: '8s', open_batches: [{ batch_id: 7, unit_id: 'US-1852' }], tabs: TABS.map(t => ({ tab: t, status: 'PASS', hours_since_good: 0.2 })) } }
    : { code: 200, json: { status: 'LOGGED' } };
  s.ctx.nightly();
  const r = s.statusRows()[0];
  assert.match(r[4], /QUEUE.*US-1902/); assert.match(r[5], /US-1852/); assert.equal(r[6], '8s');
  assert.equal(r[2], 'no', 'a stuck claim or open batch is not all good');
  assert.equal(r[8], s.ctx.CLIENT_VERSION);
  assert.deepEqual(JSON.parse(r[3]).STORIES, { s: 'PASS', h: 0.2 });
});

// ---- after Claude code review 1 ----
test('review M1: the 4:30 check is right before the put_tab call, after a slow tab read', () => {
  const s = setup();
  const start = s.w.clock.t;
  s.w.db = (fn, body) => {
    if (fn === 'tonight') return { code: 200, json: { export_group: '2026-11-19', statement_timeout: '8s', open_batches: [], tabs: TABS.map(t => ({ tab: t, status: 'MISSING' })) } };
    if (fn === 'put_tab' && body.tab === 'STORIES') { s.w.clock.t = start + 260000; s.w.readMs = 15000; return { code: 200, json: { status: 'PASS' } }; }
    if (fn === 'put_tab') return { code: 200, json: { status: 'PASS' } };
    return { code: 200, json: { status: 'LOGGED' } };
  };
  s.ctx.nightly();
  for (const c of s.w.calls.filter(c => c.fn === 'put_tab')) assert.ok(c.at - start <= 270000, `${c.body.tab} put_tab started at ${(c.at - start) / 1000} s`);
  assert.deepEqual(s.w.calls.filter(c => c.fn === 'put_tab').map(c => c.body.tab), ['STORIES']);
  assert.deepEqual(s.w.calls.find(c => c.fn === 'record_result').body.entries.map(e => [e.tab, e.status]), [['DELIGHTS', 'WAIT'], ['INDEX', 'WAIT']]);
});

test('review m3: a claimed_at_utc that is not ISO time with Z or an offset is unreadable: busy, and noted', () => {
  const s = setup({ claims: { QUEUE: [['US-1852', 'claimed', '2026-11-19 03:00:00']] } });
  s.ctx.nightly();
  assert.equal(s.db.puts.length, 0);
  assert.match(s.statusRows()[0][7], /unreadable claimed_at_utc/);
});

test('review m4: status row values are written as text (dates and numbers are not retyped by Sheets)', () => {
  const s = setup();
  s.ctx.CLIENT_VERSION = '1234567';
  s.ctx.nightly();
  const r = s.statusRows()[0];
  assert.equal(r[1], '2026-11-19');
  assert.match(r[0], /^2026-11-19T\d\d:\d\d:\d\d\.\d{3}Z$/);
  assert.equal(r[8], '1234567');
});

test('review m6: a PEM private key whose line breaks were flattened to spaces still signs', () => {
  const s = setup(); s.w.props.PRIVATE_KEY = KEYS.pem.replace(/\n/g, ' ');
  s.ctx.nightly();
  assert.equal(s.db.puts.length, 3);
});
