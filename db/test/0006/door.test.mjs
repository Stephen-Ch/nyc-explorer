// Plan 47 (nightly door) tests: what api.put_tab, api.record_result and api.tonight do.
// Numbers refer to plan 47 draft 10 tests, amendment A1 (13q-13v) and A2 (23a, 23b, 18a).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { requireIsolated, freshDb, cleanup, q, withLoader, loader, putTab, tonight, recordResult, tabStatus,
  rowsFor, rowObj, payloadRows, headersFor, TABS, ago, nyDate, HOST } from './helpers.mjs';

before(requireIsolated);
after(cleanup);

const live = async (db, tab) => (await q(db, `SELECT row_key, row_raw, import_batch_id FROM research.tab_row WHERE tab = $1 AND live ORDER BY row_key`, [tab])).rows;
const runs = async (db, tab) => (await q(db, `SELECT * FROM research.nightly_run WHERE tab IS NOT DISTINCT FROM $1 ORDER BY run_row_id`, [tab])).rows;
const batches = async db => (await q(db, `SELECT batch_id, unit_id, state FROM research.import_batch ORDER BY batch_id`)).rows;
const stopped = (r, re) => { assert.equal(r.status, 'STOPPED', JSON.stringify(r)); assert.match(r.reason, re); };

test('1, 7: put_tab imports each stage 1 tab from a valid payload, as nyc_loader', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    for (const tab of TABS) {
      const r = await putTab(c, { group: g, tab, rows: rowsFor(tab, 3) });
      assert.equal(r.status, 'PASS', `${tab}: ${JSON.stringify(r)}`);
      assert.equal(r.counts.tab_rows, 3);
    }
  });
  for (const tab of TABS) assert.equal((await live(db, tab)).length, 3, tab);
  const pr = await live(db, 'PLACE_HOOKS');
  assert.deepEqual(pr.map(x => x.row_key), ['PH0001@plan42-pilot-20261117', 'PH0002@plan42-pilot-20261117', 'PH0003@plan42-pilot-20261117']);
  assert.ok((await batches(db)).every(b => b.state === 'applied'));
});

test('2, 13b: same content in a newer copy is NOTHING_NEW and leaves no batch; identical re-send is ALREADY', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    const rows = rowsFor('STORIES', 5);
    const a = await putTab(c, { group: g, tab: 'STORIES', rows, utc: ago(30) });
    assert.equal(a.status, 'PASS');
    const again = await putTab(c, { group: g, tab: 'STORIES', rows, utc: ago(30), copy: a.copy });
    assert.equal(again.status, 'ALREADY');
    const b = await putTab(c, { group: g, tab: 'STORIES', rows, utc: ago(20) });
    assert.equal(b.status, 'NOTHING_NEW');
  });
  assert.equal((await batches(db)).length, 1);
  const r = await runs(db, 'STORIES');
  assert.deepEqual(r.map(x => x.status), ['PASS', 'ALREADY', 'NOTHING_NEW']);
  assert.ok(r.every(x => x.base_batch_id === r[0].batch_id && x.row_count === 5 && /^[0-9a-f]{64}$/.test(x.keyset_sha256)));
});

test('3: one cell changed: one new version, old superseded', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    const objs = [1, 2, 3].map(i => rowObj('DELIGHTS', i));
    assert.equal((await putTab(c, { group: g, tab: 'DELIGHTS', rows: payloadRows('DELIGHTS', objs), utc: ago(30) })).status, 'PASS');
    objs[1].hook = 'a better hook';
    const r = await putTab(c, { group: g, tab: 'DELIGHTS', rows: payloadRows('DELIGHTS', objs), utc: ago(20) });
    assert.equal(r.status, 'PASS');
    assert.equal(r.counts.tab_rows, 1); assert.equal(r.counts.tab_rows_retired, 1);
  });
  const all = (await q(db, `SELECT row_key, live, removed_from_tab FROM research.tab_row WHERE row_key = 'D002' ORDER BY tab_row_id`)).rows;
  assert.deepEqual(all.map(x => [x.live, x.removed_from_tab]), [[false, false], [true, false]]);
});

test('4, 16: removed key needs an unused approval from the batch it was live in', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  let b1;
  await withLoader(db, async c => {
    const r = await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 3), utc: ago(60) });
    b1 = r.counts.batch_id;
    const s = await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(50) });
    stopped(s, /removed/);
    assert.deepEqual(s.removed_keys, ['ST003']);
  });
  assert.deepEqual((await runs(db, 'STORIES')).at(-1).removed_keys, ['ST003']);
  // approval from another batch: still STOPPED
  await q(db, `INSERT INTO research.import_batch (city_id, unit_id, inputs, core_print, state, finished_utc) VALUES ('nyc','TAB-DELIGHTS','{}','{}','undone',now())`);
  const other = (await q(db, `SELECT max(batch_id) b FROM research.import_batch`)).rows[0].b;
  await q(db, `INSERT INTO research.removal_approval (city_id, tab, row_key, live_batch_id, note) VALUES ('nyc','STORIES','ST003',$1,'wrong batch')`, [other]);
  await withLoader(db, async c => stopped(await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(40) }), /removed/));
  // right batch: imported, approval used
  await q(db, `INSERT INTO research.removal_approval (city_id, tab, row_key, live_batch_id, note) VALUES ('nyc','STORIES','ST003',$1,'Stephen yes')`, [b1]);
  let b2;
  await withLoader(db, async c => {
    const r = await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(30) });
    assert.equal(r.status, 'PASS'); b2 = r.counts.batch_id;
  });
  const ap = (await q(db, `SELECT used_by_batch_id FROM research.removal_approval WHERE note = 'Stephen yes'`)).rows[0];
  assert.equal(ap.used_by_batch_id, b2);
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.tab_row WHERE row_key='ST003' AND removed_from_tab`)).rows[0].n, 1);
  // approval already used: the key comes back and goes again -> STOPPED
  await withLoader(db, async c => {
    assert.equal((await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 3), utc: ago(20) })).status, 'PASS');
    stopped(await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(10) }), /removed/);
  });
});

test('5, 6: tonight lists every enabled tab (MISSING too), not disabled ones; record_result rows show; PASS then WAIT stays good', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await q(db, `UPDATE research.tab_schema SET enabled = false WHERE tab = 'PEOPLE'`);
  await withLoader(db, async c => {
    assert.equal((await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(30) })).status, 'PASS');
    await recordResult(c, g, [{ tab: 'STORIES', status: 'WAIT', message: 'later run' }, { tab: 'DELIGHTS', status: 'SKIPPED', message: 'busy' },
      { tab: 'INDEX', status: 'FAIL', message: 'http 500' }]);
    const t = await tonight(c);
    assert.deepEqual(t.tabs.map(x => x.tab).sort(), TABS.filter(x => x !== 'PEOPLE').sort());
    assert.equal(tabStatus(t, 'STORIES'), 'PASS');
    assert.equal(tabStatus(t, 'DELIGHTS'), 'SKIPPED');
    assert.equal(tabStatus(t, 'INDEX'), 'FAIL');
    assert.equal(tabStatus(t, 'NAME_LINKS'), 'MISSING');
    assert.equal(t.tabs.find(x => x.tab === 'NAME_LINKS').last_good_utc, null);
    assert.equal(t.statement_timeout, '8s');
    assert.equal(t.export_group, g);
  });
  // newly enabled tab appears
  await q(db, `UPDATE research.tab_schema SET enabled = true WHERE tab = 'PEOPLE'`);
  await withLoader(db, async c => assert.equal(tabStatus(await tonight(c), 'PEOPLE'), 'MISSING'));
});

test('5: hours since last good counts NOTHING_NEW nights', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    const rows = rowsFor('INDEX', 2);
    await putTab(c, { group: g, tab: 'INDEX', rows, utc: ago(600) });
    await putTab(c, { group: g, tab: 'INDEX', rows, utc: ago(5) });
  });
  await q(db, `UPDATE research.nightly_run SET logged_utc = now() - interval '30 hours' WHERE status = 'PASS'`);
  await withLoader(db, async c => {
    const t = (await tonight(c)).tabs.find(x => x.tab === 'INDEX');
    assert.equal(t.status, 'NOTHING_NEW'); assert.ok(t.hours_since_good < 1, JSON.stringify(t));
  });
});

test('13a, 14: copy time checks: future, too old, not newer than the newest accepted copy', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    stopped(await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 1), utc: '2099-01-01T00:00:00Z' }), /copy time/);
    stopped(await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 1), utc: ago(11 * 60 + 1 + 60) }), /copy time/);
    stopped(await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 1), utc: new Date(Date.now() + 11 * 60000).toISOString() }), /copy time/);
    assert.equal((await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 1), utc: ago(10) })).status, 'PASS');
    stopped(await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 2), utc: ago(20) }), /older/);
  });
  const r = await runs(db, 'DELIGHTS');
  assert.equal(r.filter(x => x.status === 'STOPPED').length, 4, 'every STOPPED is logged');
});

test('13b, 13l: re-send after STOPPED is checked again; ALREADY only in the same night, inside 12 h, not undone', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    const s = await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 1), utc: '2099-01-01T00:00:00Z' });
    stopped(s, /copy time/);
    stopped(await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 1), utc: '2099-01-01T00:00:00Z', copy: s.copy }), /copy time/);
    // same copy id, other payload: STOPPED
    const a = await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 2), utc: ago(30) });
    assert.equal(a.status, 'PASS');
    stopped(await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 3), utc: ago(30), copy: a.copy }), /same copy/);
    // other export group: not ALREADY (and older than newest accepted: STOPPED)
    stopped(await putTab(c, { group: '2026-01-01', tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 2), utc: ago(30), copy: a.copy }), /older|copy time/);
  });
  // 13 hours later: not ALREADY
  await q(db, `UPDATE research.nightly_run SET copy_utc = copy_utc - interval '13 hours' WHERE status = 'PASS'`);
  await withLoader(db, async c => {
    const r = await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 2), utc: ago(30 + 13 * 60) , copy: (await runs(db, 'DELIGHTS')).find(x => x.status === 'PASS').copy_id });
    stopped(r, /copy time/);
  });
});

test('13l, 13k: after an undo, a re-send is not ALREADY and tonight shows UNDONE (PASS and NOTHING_NEW)', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  let a;
  await withLoader(db, async c => {
    a = await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(30) });
    assert.equal(a.status, 'PASS');
  });
  await q(db, `SELECT research.undo_import($1)`, [a.counts.batch_id]);
  await withLoader(db, async c => {
    assert.equal(tabStatus(await tonight(c), 'STORIES'), 'UNDONE');
    const r = await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(30), copy: a.copy });
    assert.notEqual(r.status, 'ALREADY');
  });
  // NOTHING_NEW whose base batch is undone
  const db2 = await freshDb(); const g2 = await nyDate(db2);
  let b;
  await withLoader(db2, async c => {
    b = await putTab(c, { group: g2, tab: 'INDEX', rows: rowsFor('INDEX', 2), utc: ago(30) });
    assert.equal((await putTab(c, { group: g2, tab: 'INDEX', rows: rowsFor('INDEX', 2), utc: ago(20) })).status, 'NOTHING_NEW');
  });
  await q(db2, `SELECT research.undo_import($1)`, [b.counts.batch_id]);
  await withLoader(db2, async c => assert.equal(tabStatus(await tonight(c), 'INDEX'), 'UNDONE'));
});

test('13n: two good imports tonight, the newer undone: UNDONE, no fallback to the older', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  let b2;
  await withLoader(db, async c => {
    await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(60) });
    b2 = await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 3), utc: ago(30) });
    assert.equal(b2.status, 'PASS');
  });
  await q(db, `SELECT research.undo_import($1)`, [b2.counts.batch_id]);
  await withLoader(db, async c => assert.equal(tabStatus(await tonight(c), 'STORIES'), 'UNDONE'));
});

test('13o: C1 then newer C2 accepted; identical resend of C1 is not ALREADY but STOPPED (older copy)', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    const c1 = await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(60) });
    assert.equal((await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 3), utc: ago(30) })).status, 'PASS');
    stopped(await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(60), copy: c1.copy }), /older/);
  });
});

test('13j: a committed PASS wins over a later FAIL for the same tab', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    assert.equal((await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(30) })).status, 'PASS');
    await recordResult(c, g, [{ tab: 'STORIES', status: 'FAIL', message: 'reply lost, retry failed' }]);
    assert.equal(tabStatus(await tonight(c), 'STORIES'), 'PASS');
  });
  assert.deepEqual((await runs(db, 'STORIES')).map(x => x.status), ['PASS', 'FAIL']);
});

test('13e: a failure after old rows were retired restores everything and logs STOPPED', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    assert.equal((await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 3), utc: ago(30) })).status, 'PASS');
  });
  const before = await live(db, 'DELIGHTS');
  // a test-only trigger that fails on the first insert of the second batch (after the retire step)
  await q(db, `CREATE FUNCTION research.t_fail() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN
      IF NEW.import_batch_id > 1 THEN RAISE EXCEPTION 'boom after retire'; END IF; RETURN NEW; END$$;
    CREATE TRIGGER zz_t_fail BEFORE INSERT ON research.tab_row FOR EACH ROW EXECUTE FUNCTION research.t_fail();`);
  await withLoader(db, async c => {
    const objs = [1, 2, 3].map(i => rowObj('DELIGHTS', i, { hook: 'changed' }));
    stopped(await putTab(c, { group: g, tab: 'DELIGHTS', rows: payloadRows('DELIGHTS', objs), utc: ago(20) }), /boom after retire/);
  });
  assert.deepEqual(await live(db, 'DELIGHTS'), before);
  assert.equal((await batches(db)).length, 1);
  // the import lock was released: a plain import works again
  await q(db, `DROP TRIGGER zz_t_fail ON research.tab_row`);
  await withLoader(db, async c => assert.equal((await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 4), utc: ago(10) })).status, 'PASS'));
});

test('15, 6 (zero rows): header-only payload over live rows is STOPPED', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    await putTab(c, { group: g, tab: 'INDEX', rows: rowsFor('INDEX', 2), utc: ago(30) });
    stopped(await putTab(c, { group: g, tab: 'INDEX', rows: [], utc: ago(20) }), /zero rows/);
  });
});

test('17: key A replaced by key B, same count: STOPPED', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2), utc: ago(30) });
    const s = await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 2, 2), utc: ago(20) });
    stopped(s, /removed/); assert.deepEqual(s.removed_keys, ['ST001']);
  });
});

test('18: wrong headers, duplicate key, bad key, missing key, unknown or disabled tab: STOPPED', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await q(db, `UPDATE research.tab_schema SET enabled = false WHERE tab = 'NUMBER_MAP'`);
  await withLoader(db, async c => {
    const h = headersFor('STORIES');
    stopped(await putTab(c, { group: g, tab: 'STORIES', headers: h.slice(1), rows: [], utc: ago(30) }), /headers/);
    stopped(await putTab(c, { group: g, tab: 'STORIES', headers: [...h.slice(0, 2), h[3], h[2], ...h.slice(4)], rows: [], utc: ago(30) }), /headers/);
    const dup = payloadRows('STORIES', [rowObj('STORIES', 1), { ...rowObj('STORIES', 1), __r: 3 }]);
    stopped(await putTab(c, { group: g, tab: 'STORIES', rows: dup, utc: ago(30) }), /duplicate key/);
    stopped(await putTab(c, { group: g, tab: 'STORIES', rows: payloadRows('STORIES', [rowObj('STORIES', 1, { story_id: 'st1' })]), utc: ago(30) }), /key pattern/);
    stopped(await putTab(c, { group: g, tab: 'STORIES', rows: payloadRows('STORIES', [rowObj('STORIES', 1, { story_id: '' })]), utc: ago(30) }), /no key/);
    stopped(await putTab(c, { group: g, tab: 'NOPE', headers: ['a'], rows: [], utc: ago(30) }), /not on the list|disabled/);
    stopped(await putTab(c, { group: g, tab: 'NUMBER_MAP', rows: rowsFor('NUMBER_MAP', 1), utc: ago(30) }), /disabled/);
    // row with the wrong number of cells, duplicate sheet row
    stopped(await putTab(c, { group: g, tab: 'STORIES', rows: [{ r: 2, c: ['ST001'] }], utc: ago(30) }), /cells/);
    const dr = payloadRows('STORIES', [rowObj('STORIES', 1), { ...rowObj('STORIES', 2), __r: 2 }]);
    stopped(await putTab(c, { group: g, tab: 'STORIES', rows: dr, utc: ago(30) }), /sheet row/);
  });
  assert.equal((await batches(db)).length, 0);
});

test('18a: over a size limit (rows, columns, cell, 2,000,000 bytes): STOPPED', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    const many = Array.from({ length: 5001 }, (_, k) => ({ r: k + 2, c: [] }));
    stopped(await putTab(c, { group: g, tab: 'INDEX', rows: many, utc: ago(30) }), /size limit: rows/);
    stopped(await putTab(c, { group: g, tab: 'INDEX', headers: Array.from({ length: 61 }, (_, k) => `h${k}`), rows: [], utc: ago(30) }), /size limit: columns/);
    stopped(await putTab(c, { group: g, tab: 'INDEX', rows: payloadRows('INDEX', [rowObj('INDEX', 1, { name: 'x'.repeat(50001) })]), utc: ago(30) }), /size limit: cell/);
    const big = payloadRows('INDEX', Array.from({ length: 45 }, (_, k) => rowObj('INDEX', k + 1, { name: 'y'.repeat(45000) })));
    stopped(await putTab(c, { group: g, tab: 'INDEX', rows: big, utc: ago(30) }), /size limit: payload/);
  });
});

test('18b: an open batch from another path: STOPPED "open batch"', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await q(db, `SELECT research.begin_import('nyc', 'US-1852', '{"files":{}}', NULL)`);
  await withLoader(db, async c => stopped(await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 1), utc: ago(30) }), /open batch/));
  await withLoader(db, async c => {
    const t = await tonight(c);
    assert.equal(t.open_batches.length, 0, 'not older than 2 hours yet');
  });
  await q(db, `UPDATE research.import_batch SET started_utc = now() - interval '3 hours'`);
  await withLoader(db, async c => assert.equal((await tonight(c)).open_batches.length, 1));
});

test('18c: SQL text in a header, key pattern or key column name is data, never run', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await q(db, `UPDATE research.tab_schema SET headers = array_append(headers, 'x''); DROP TABLE research.nightly_run; --'),
    key_pattern = '^ST[0-9]{3,}$''); DROP TABLE research.tab_row; --' WHERE tab = 'STORIES'`);
  await q(db, `UPDATE research.tab_schema SET key_col1 = 'story_id''); DROP TABLE research.tab_row; --' WHERE tab = 'DELIGHTS'`);
  await withLoader(db, async c => {
    stopped(await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 1), utc: ago(30) }), /headers/);
    stopped(await putTab(c, { group: g, tab: 'DELIGHTS', rows: rowsFor('DELIGHTS', 1), utc: ago(30) }), /no key/);
  });
  assert.equal((await q(db, `SELECT count(*)::int n FROM pg_tables WHERE schemaname='research' AND tablename IN ('tab_row','nightly_run')`)).rows[0].n, 2);
});

test('13d data side, 14a, 18e: record_result refuses good statuses and caps messages at 2,000 characters', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    for (const s of ['PASS', 'ALREADY', 'NOTHING_NEW', 'STOPPED', 'BOGUS']) {
      await assert.rejects(recordResult(c, g, [{ tab: 'STORIES', status: s, message: 'x' }]), /record_result/);
    }
    await recordResult(c, g, [{ tab: 'STORIES', status: 'WAIT', message: 'm'.repeat(5000) }]);
  });
  const r = await runs(db, 'STORIES');
  assert.equal(r.length, 1); assert.equal(r[0].reason.length, 2000);
});

test('13i: __urls columns: exact names and places pass; missing or moved is STOPPED; stored as sent', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  const h = headersFor('STORIES');
  assert.equal(h[h.indexOf('original_link') + 1], 'original_link__urls');
  await withLoader(db, async c => {
    stopped(await putTab(c, { group: g, tab: 'STORIES', headers: h.filter(x => x !== 'original_link__urls'), rows: [], utc: ago(40) }), /headers/);
    const moved = h.filter(x => x !== 'original_link__urls'); moved.push('original_link__urls');
    stopped(await putTab(c, { group: g, tab: 'STORIES', headers: moved, rows: [], utc: ago(40) }), /headers/);
    const objs = [rowObj('STORIES', 1, { original_link__urls: '[]' }),
      rowObj('STORIES', 2, { original_link__urls: '["https://a.example/1"]' }),
      rowObj('STORIES', 3, { original_link__urls: '["https://a.example/1","https://b.example/2"]' })];
    assert.equal((await putTab(c, { group: g, tab: 'STORIES', rows: payloadRows('STORIES', objs), utc: ago(30) })).status, 'PASS');
  });
  const got = (await live(db, 'STORIES')).map(x => x.row_raw.original_link__urls);
  assert.deepEqual(got, ['[]', '["https://a.example/1"]', '["https://a.example/1","https://b.example/2"]']);
});

test('9 data side: awkward text arrives cell for cell', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  const odd = ['a, "quoted"', 'line1\nline2\r\nline3', '1.5E+10', '1852-10', '=HYPERLINK("x")', ' leading space', 'tab\there', 'é ü 中', ''];
  const objs = odd.map((v, k) => rowObj('DELIGHTS', k + 1, { notes: v, quote: v }));
  await withLoader(db, async c => assert.equal((await putTab(c, { group: g, tab: 'DELIGHTS', rows: payloadRows('DELIGHTS', objs), utc: ago(30) })).status, 'PASS'));
  const got = (await live(db, 'DELIGHTS')).map(x => x.row_raw.notes);
  assert.deepEqual(got, odd);
});

test('13q: PLACE_HOOKS two rows for one hook_id with different run_ids; next night and re-sorted: NOTHING_NEW', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  const objs = [rowObj('PLACE_HOOKS', 11, { hook_ok: 'no' }), rowObj('PLACE_HOOKS', 11, { run_id: 'plan42-A1-recheck-20261117', hook_ok: 'yes' }), rowObj('PLACE_HOOKS', 12)];
  await withLoader(db, async c => {
    assert.equal((await putTab(c, { group: g, tab: 'PLACE_HOOKS', rows: payloadRows('PLACE_HOOKS', objs), utc: ago(60) })).status, 'PASS');
    assert.equal((await putTab(c, { group: g, tab: 'PLACE_HOOKS', rows: payloadRows('PLACE_HOOKS', objs), utc: ago(40) })).status, 'NOTHING_NEW');
    const resorted = [objs[2], objs[0], objs[1]];
    assert.equal((await putTab(c, { group: g, tab: 'PLACE_HOOKS', rows: payloadRows('PLACE_HOOKS', resorted), utc: ago(20) })).status, 'NOTHING_NEW');
  });
  assert.deepEqual((await live(db, 'PLACE_HOOKS')).map(x => x.row_key),
    ['PH0011@plan42-A1-recheck-20261117', 'PH0011@plan42-pilot-20261117', 'PH0012@plan42-pilot-20261117']);
});

test('13r: same hook_id and run_id twice; blank run_id; run_id with @, spaces, NBSP or newline: STOPPED', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => {
    stopped(await putTab(c, { group: g, tab: 'PLACE_HOOKS', rows: payloadRows('PLACE_HOOKS', [rowObj('PLACE_HOOKS', 1), rowObj('PLACE_HOOKS', 1)]), utc: ago(30) }), /duplicate key/);
    stopped(await putTab(c, { group: g, tab: 'PLACE_HOOKS', rows: payloadRows('PLACE_HOOKS', [rowObj('PLACE_HOOKS', 1, { run_id: '' })]), utc: ago(30) }), /no key/);
    for (const bad of ['plan42@x-20261117', 'plan42 pilot-20261117', 'plan42-pilot-20261117 ', 'plan42-pilot-20261117 ', 'plan42-pilot-20261117\n']) {
      stopped(await putTab(c, { group: g, tab: 'PLACE_HOOKS', rows: payloadRows('PLACE_HOOKS', [rowObj('PLACE_HOOKS', 1, { run_id: bad })]), utc: ago(30) }), /key pattern/);
    }
  });
});

test('13s: a run_id edited on one row: old key removed, STOPPED; with an approval: PASS', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  let b1;
  await withLoader(db, async c => {
    b1 = (await putTab(c, { group: g, tab: 'PLACE_HOOKS', rows: rowsFor('PLACE_HOOKS', 2), utc: ago(60) })).counts.batch_id;
    const edited = payloadRows('PLACE_HOOKS', [rowObj('PLACE_HOOKS', 1), rowObj('PLACE_HOOKS', 2, { run_id: 'plan42-A2-20261118' })]);
    const s = await putTab(c, { group: g, tab: 'PLACE_HOOKS', rows: edited, utc: ago(40) });
    stopped(s, /removed/); assert.deepEqual(s.removed_keys, ['PH0002@plan42-pilot-20261117']);
  });
  await q(db, `INSERT INTO research.removal_approval (city_id, tab, row_key, live_batch_id) VALUES ('nyc','PLACE_HOOKS','PH0002@plan42-pilot-20261117',$1)`, [b1]);
  await withLoader(db, async c => {
    const edited = payloadRows('PLACE_HOOKS', [rowObj('PLACE_HOOKS', 1), rowObj('PLACE_HOOKS', 2, { run_id: 'plan42-A2-20261118' })]);
    assert.equal((await putTab(c, { group: g, tab: 'PLACE_HOOKS', rows: edited, utc: ago(20) })).status, 'PASS');
  });
});

test('13t: STORY_TEXT keys are story_id@run_id; swapped key columns in tab_schema: STOPPED (key pattern)', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => assert.equal((await putTab(c, { group: g, tab: 'STORY_TEXT', rows: rowsFor('STORY_TEXT', 2), utc: ago(60) })).status, 'PASS'));
  assert.deepEqual((await live(db, 'STORY_TEXT')).map(x => x.row_key), ['ST001@run-20261116T141651Z', 'ST002@run-20261116T141651Z']);
  await q(db, `UPDATE research.tab_schema SET key_col1 = 'run_id', key_col2 = 'story_id' WHERE tab = 'STORY_TEXT'`);
  await withLoader(db, async c => stopped(await putTab(c, { group: g, tab: 'STORY_TEXT', rows: rowsFor('STORY_TEXT', 3), utc: ago(30) }), /key pattern/));
});

test('13v: key-set hash sorts with COLLATE "C"', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  const objs = [rowObj('INDEX', 1, { candidate_id: 'a-b' }), rowObj('INDEX', 2, { candidate_id: 'ab' }), rowObj('INDEX', 3, { candidate_id: 'a' })];
  await withLoader(db, async c => assert.equal((await putTab(c, { group: g, tab: 'INDEX', rows: payloadRows('INDEX', objs), utc: ago(30) })).status, 'PASS'));
  const want = (await q(db, `SELECT encode(sha256(convert_to(string_agg(k, E'\\n' ORDER BY k COLLATE "C"), 'UTF8')), 'hex') h
                             FROM unnest(ARRAY['a-b','ab','a']) k`)).rows[0].h;
  assert.equal((await runs(db, 'INDEX'))[0].keyset_sha256, want);
});

test('23a: the time-limit guard: 0, 16s, 1min, 2h STOPPED with one log row and nothing else; 8s, 15s, 500ms pass', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  for (const t of ['0', '16s', '60s', '2h']) {
    await withLoader(db, async c => {
      const r = await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 1), utc: ago(30) });
      stopped(r, /time limit/);
      const rr = await recordResult(c, g, [{ tab: 'STORIES', status: 'WAIT', message: 'x' }]);
      stopped(rr, /time limit/);
    }, { timeout: t });
  }
  assert.equal((await batches(db)).length, 0);
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.nightly_run WHERE status <> 'STOPPED'`)).rows[0].n, 0);
  assert.equal((await q(db, `SELECT count(*)::int n FROM research.nightly_run`)).rows[0].n, 8);
  let k = 0;
  for (const t of ['8s', '15s', '500ms']) {
    await withLoader(db, async c => {
      k++;
      const r = await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', k), utc: ago(40 - k) });
      assert.equal(r.status, 'PASS', `${t}: ${JSON.stringify(r)}`);
    }, { timeout: t });
  }
});

test('23b: put_tab while another session holds the import lock: STOPPED in about 3 s, logged', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  const holder = new pg.Client({ host: HOST, user: 'postgres', database: db });
  await holder.connect();
  await holder.query(`BEGIN; SELECT pg_advisory_xact_lock(hashtext('research.import'))`);
  try {
    await withLoader(db, async c => {
      const t0 = Date.now();
      const r = await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 1), utc: ago(30) });
      const ms = Date.now() - t0;
      stopped(r, /lock/);
      assert.ok(ms >= 2500 && ms < 6000, `took ${ms} ms`);
    });
  } finally { await holder.query('ROLLBACK'); await holder.end(); }
  assert.equal((await runs(db, 'STORIES')).length, 1);
});

test('put_tab: a token whose sub is not nightly-export is STOPPED (defense in depth)', async () => {
  const db = await freshDb(); const g = await nyDate(db);
  await withLoader(db, async c => stopped(await putTab(c, { group: g, tab: 'STORIES', rows: rowsFor('STORIES', 1), utc: ago(30) }), /token/), { sub: 'someone-else' });
});
