// Plan 47 test 11: alarm.gs under fake Apps Script services. The alarm has no key and never calls the database;
// it reads the status sheet the export script writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, load, cell } from './shim.mjs';

const EXPECTED = ['STORIES', 'DELIGHTS', 'INDEX'];
const good = (h = 0.5) => Object.fromEntries(EXPECTED.map(t => [t, { s: 'PASS', h }]));
// status row: run_utc, export_group, all_good, tabs_json, stuck_claims, open_batches_json, statement_timeout, note, client_version
const row = ({ utc = '2026-11-19T06:07:00Z', group = '2026-11-19', tabs = good(), stuck = '', open = '[]', note = '' } = {}) =>
  [utc, group, 'x', JSON.stringify(tabs), stuck, open, '8s', note, 'abc123'];

// 7:00am New York, Nov 19 2026 (a Thursday) = 12:00 UTC
function setup({ rows = [row()], now = '2026-11-19T12:00:00Z' } = {}) {
  const w = makeWorld({ now });
  const status = w.makeSpreadsheet('NYC nightly status', {
    status: [[cell('run_utc')], ...rows.map(r => r.map(v => cell(v)))], alarm: [[cell('time')]],
  });
  Object.assign(w.props, { STATUS_SHEET_ID: status.id, EXPECTED_TABS: EXPECTED.join(',') });
  const ctx = load(w, 'alarm.gs');
  return { w, ctx, status };
}
const mailed = (w, re) => { assert.equal(w.mail.length, 1, `mails: ${JSON.stringify(w.mail)}`); assert.match(w.mail[0].subject + '\n' + w.mail[0].body, re); };

test('11: silent on a good night (and logs that it checked)', () => {
  const { w, ctx, status } = setup();
  ctx.dailyCheck();
  assert.equal(w.mail.length, 0);
  assert.equal(status.sheets.alarm.length, 2);
  assert.equal(w.calls.length, 0, 'the alarm never calls the database');
});

test('11: ALREADY and NOTHING_NEW count as good', () => {
  const tabs = { STORIES: { s: 'ALREADY', h: 1 }, DELIGHTS: { s: 'NOTHING_NEW', h: 20 }, INDEX: { s: 'PASS', h: 0 } };
  const { w, ctx } = setup({ rows: [row({ tabs })] });
  ctx.dailyCheck();
  assert.equal(w.mail.length, 0);
});

test('11: no row today (none at all, only yesterday, or before 1am) emails', () => {
  for (const rows of [[], [row({ utc: '2026-11-18T06:07:00Z', group: '2026-11-18' })], [row({ utc: '2026-11-19T05:30:00Z' })]]) {
    const { w, ctx } = setup({ rows });
    ctx.dailyCheck();
    mailed(w, /no status row today/);
  }
});

test('11: empty, missing or extra tab list emails', () => {
  for (const [tabs, re] of [[{}, /no tabs/], [{ STORIES: { s: 'PASS', h: 0 }, DELIGHTS: { s: 'PASS', h: 0 } }, /INDEX: missing/],
                            [{ ...good(), PEOPLE: { s: 'PASS', h: 0 } }, /PEOPLE: not expected/]]) {
    const { w, ctx } = setup({ rows: [row({ tabs })] });
    ctx.dailyCheck();
    mailed(w, re);
  }
});

test('11: each bad status emails: WAIT, SKIPPED, STOPPED, FAIL, MISSING, UNDONE', () => {
  for (const s of ['WAIT', 'SKIPPED', 'STOPPED', 'FAIL', 'MISSING', 'UNDONE']) {
    const tabs = { ...good(), DELIGHTS: { s, h: 3 } };
    const { w, ctx } = setup({ rows: [row({ tabs })] });
    ctx.dailyCheck();
    mailed(w, new RegExp(`DELIGHTS: ${s}`));
  }
});

test('11: open batch, stuck claim, database unreachable, wrong export_group each email', () => {
  for (const [r, re] of [[row({ open: '[{"batch_id":7,"unit_id":"US-1852"}]' }), /open batch/], [row({ stuck: 'QUEUE US-1902 claimed 300 min ago' }), /stuck claim/],
                         [row({ tabs: {}, note: 'database unreachable' }), /database unreachable/], [row({ group: '2026-11-18' }), /export group/]]) {
    const { w, ctx } = setup({ rows: [r] });
    ctx.dailyCheck();
    mailed(w, re);
  }
});

test('11: a tab with no good import for over 36 hours emails (repeated partial nights)', () => {
  const { w, ctx } = setup({ rows: [row({ tabs: { ...good(), INDEX: { s: 'PASS', h: 37 } } })] });
  ctx.dailyCheck();
  mailed(w, /INDEX: no good import for over 36 hours/);
  const b = setup({ rows: [row({ tabs: { ...good(), INDEX: { s: 'PASS', h: null } } })] });
  b.ctx.dailyCheck();
  mailed(b.w, /INDEX: no good import/);
});

test('11: newest row decides (a later bad run after a good one emails)', () => {
  const { w, ctx } = setup({ rows: [row(), row({ utc: '2026-11-19T07:07:00Z', tabs: { ...good(), STORIES: { s: 'FAIL', h: 1 } } })] });
  ctx.dailyCheck();
  mailed(w, /STORIES: FAIL/);
});

test('11: mail error is written to the status sheet', () => {
  const { w, ctx, status } = setup({ rows: [] });
  w.mailError = 'Service invoked too many times for one day: email.';
  ctx.dailyCheck();
  assert.ok(status.sheets.alarm.some(r => /mail error/.test(r.map(c => c.v).join(' ')) && /too many times/.test(r.map(c => c.v).join(' '))));
});

test('11: Monday still-alive email with last week and orphan copies older than a day', () => {
  const { w, ctx } = setup({ now: '2026-11-23T12:05:00Z' });       // Monday
  const old = w.makeSpreadsheet('nyc-export-copy-20261120T060500Z'); old.created = Date.parse('2026-11-20T06:05:00Z');
  const fresh = w.makeSpreadsheet('nyc-export-copy-20261123T060500Z'); fresh.created = Date.parse('2026-11-23T06:05:00Z');
  const trashed = w.makeSpreadsheet('nyc-export-copy-20261119T060500Z'); trashed.created = Date.parse('2026-11-19T06:05:00Z'); trashed.trashed = true;
  ctx.weeklyAlive();
  assert.equal(w.mail.length, 1);
  assert.match(w.mail[0].subject, /still alive/);
  assert.match(w.mail[0].body, new RegExp(old.id));
  assert.doesNotMatch(w.mail[0].body, new RegExp(`${fresh.id}\\b`));
  assert.doesNotMatch(w.mail[0].body, new RegExp(`${trashed.id}\\b`));
  assert.ok(!old.trashed, 'report only, no trash');
});

test('11: weeklyAlive does nothing on other days', () => {
  const { w, ctx } = setup({ now: '2026-11-19T12:05:00Z' });
  ctx.weeklyAlive();
  assert.equal(w.mail.length, 0);
});
