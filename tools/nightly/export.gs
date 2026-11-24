/**
 * NYC nightly export (plan 47, with amendments A1 and A2). Standalone Apps Script project owned by
 * schurchville@gmail.com, time zone America/New_York. Not attached to the tracker.
 *
 * Every night (triggers at 1, 2, 3, 4 and 5am) it copies the research tabs of the tracker into the Neon database
 * through the door: three functions in schema api, reached through the Neon Data API with a short signed token.
 * The database is the record of what is done (api.tonight); Script Properties only hold settings and copy ids.
 *
 * Script Properties (set by Stephen, never in code):
 *   DB_URL          Data API base URL, ending in /rest/v1 (no trailing slash)
 *   PRIVATE_KEY     the private key from tools/keys/keygen.mjs (one line of base64, or PEM)
 *   TRACKER_ID      the tracker spreadsheet id
 *   STATUS_SHEET_ID the "NYC nightly status" spreadsheet id (tabs: status, verify)
 *   paused          any value stops every run (way back: pause first)
 *   COPY_IDS        kept by the script: ids of copies it made and has not trashed yet
 *   DRILL_TAB, DRILL_KEY  only during the plan 47 drills, for drillStopRun(); Stephen deletes both after the drills
 *
 * Triggers: nightly() daily at 1, 2, 3, 4 and 5am. By hand from the editor only: verifyNow() (export, then the
 * done-proof), verifyOnly() (the proof with no export), monitorCheck() (read-only status per tab), selfTest(),
 * drillStopRun() (import-try only).
 */

var CLIENT_VERSION = 'dev';   // replaced by the git commit of this file at install time (step 4)
var TIMEOUT_SECONDS = { put_tab: 20, record_result: 20, tonight: 20 };   // A2: script timeout >= guard ceiling (15 s) + 5 s
var BUDGET_MS = {
  lastTabStart: 270000,       // 4:30 elapsed: a put_tab may start only by then (A2 section 2)
  lastRetryWait: 240000,      // 4:00: a retry may start its 30-second wait only by then
  retryWait: 30000,
};
var WINDOW_HOURS = { from: 1, to: 6 };        // 1:00 to 5:59am New York
var SKIP_HOUR = 5;                            // the 5am run records SKIPPED if still busy
var DEAD_CLAIM_MINUTES = 90;                  // step 0a: longest task run 27 minutes
var CLAIM_TABS = ['QUEUE', 'STORY_QUEUE', 'REWRITE_QUEUE'];
var GOOD = ['PASS', 'ALREADY', 'NOTHING_NEW'];
var COPY_PREFIX = 'nyc-export-copy-';
var TZ = 'America/New_York';
// link columns (A1 section 6): each gets a <column>__urls column straight after it
var LINK_COLUMNS = {
  STORIES: ['original_link', 'pointer_source (modern, credit only)'],
  DELIGHTS: ['loc_link'],
  PEOPLE: ['wikipedia_url'],
};
// key columns, for the verify rows only (the database builds its own keys from research.tab_schema)
var KEY_COLUMNS = {
  STORIES: ['story_id'], DELIGHTS: ['delight_id'], INDEX: ['candidate_id'], STORY_TEXT: ['story_id', 'run_id'],
  PLACE_HOOKS: ['hook_id', 'run_id'], PEOPLE: ['person_id'], NAME_LINKS: ['link_id'], NUMBER_MAP: ['map_id'],
};
var TOKEN = { role: 'nyc_loader', sub: 'nightly-export', aud: 'nyc-explorer-nightly', kid: 'export-1', lifetime: 300 };
// plan 47 finish S2: the only DB_URL drillStop accepts (exact match, not a substring)
var IMPORT_TRY_URL = 'https://ep-ancient-mode-b4mlcp2h.apirest.c-6.us-east-2.aws.neon.tech/neondb/rest/v1';
var VERIFY_CHUNK_ROWS = 5000;                 // rows per verify write: 20,000 cells per call (S2 item 1)
var COPY_LABEL = /^c-\d{8}T\d{6}Z-[A-Za-z0-9-]+$/;   // the copy name runExport_ makes and the database keeps as copy_id

// ---------------------------------------------------------------- entry points

function nightly() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('paused')) return;
  var hour = Number(Utilities.formatDate(new Date(), TZ, 'H'));
  if (hour < WINDOW_HOURS.from || hour >= WINDOW_HOURS.to) return;           // before any Neon call
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) return;                                              // another run holds it
  try { runExport_({ ignoreBusy: false }); } finally { lock.releaseLock(); }
}

/** Done-proof (plan 47): Stephen runs this from the editor in a quiet hour. Export now, then hash the live tracker
 *  through the Sheets API (a separate read path) into the status sheet's "verify" tab. */
function verifyNow() {
  if (PropertiesService.getScriptProperties().getProperty('paused')) throw new Error('paused: remove the Script Property paused first');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('another export run is going; try again in a few minutes');
  // the lock is kept until #complete is written, so no other run can change the database in between (S2 item 3)
  try {
    var st = runExport_({ ignoreBusy: true, allTabs: true });
    // the proof needs a fresh copy and a good answer for every enabled tab; otherwise no verify rows at all (ChatGPT r2-1)
    var bad = !st || !st.copyId || !st.todo.length || st.fail || st.wait.length || st.skipped.length ||
              Object.keys(st.stopped).length || st.todo.some(function (t) { return GOOD.indexOf(st.done[t]) < 0; });
    if (bad) throw new Error('verify not run: the fresh export did not finish good for every tab (see the status sheet)');
    verifyRows_(st.copyName);
  } finally {
    lock.releaseLock();
  }
}

/** Plan 47 finish S2 item 7: the done-proof with NO export first, so the check can never repair what it checks.
 *  Hashes the live tracker into "verify", labelled with the copy id(s) of the database's newest good rows (tonight()).
 *  Stops, with no verify rows, unless every enabled tab is good tonight. Makes no write call to the database, so it
 *  also runs while paused. Pause the tracker-writing tasks first, so the tracker still equals the night's copy. */
function verifyOnly() {
  var props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('another export run is going; try again in a few minutes');
  try {
    var cfg = config_(props);
    var answer = callDb_(cfg, 'tonight', {});
    var tabs = answer.tabs || [];
    var notGood = tabs.filter(function (t) { return GOOD.indexOf(t.status) < 0; });
    if (!tabs.length || notGood.length) {
      throw new Error('verifyOnly not run: tabs not good tonight: ' +
        (tabs.length ? notGood.map(function (t) { return t.tab + ' ' + t.status; }).join(', ') : 'none listed'));
    }
    var ids = [];
    tabs.forEach(function (t) { if (ids.indexOf(t.copy_id) < 0) ids.push(t.copy_id); });
    ids.sort();
    verifyRows_(ids.join('+'), cfg, answer);
  } finally {
    lock.releaseLock();
  }
}

/** Plan 47 finish S2 item 8: read-only monitoring check. Calls tonight() only (no put_tab, no record_result) and writes
 *  every tab's status, reason and hours to the "selftest" tab, then a "#monitor" row: the number of tabs not good and
 *  the answer in the status row's shape, ready for session-check.mjs (drill 2). */
function monitorCheck() {
  var cfg = config_(PropertiesService.getScriptProperties());
  var answer = callDb_(cfg, 'tonight', {});
  var t = new Date().toISOString(), tabs = {}, notGood = 0;
  var rows = (answer.tabs || []).map(function (x) {
    var h = x.hours_since_good == null ? null : Number(x.hours_since_good);
    tabs[x.tab] = { s: x.status, h: h };
    if (GOOD.indexOf(x.status) < 0) notGood++;
    return [t, 'monitor ' + x.tab, x.status, 'reason ' + (x.reason == null ? '-' : x.reason) + '; hours ' + (h == null ? '-' : h) +
      '; copy ' + (x.copy_id || '-')];
  });
  rows.push([t, '#monitor', notGood, JSON.stringify({ export_group: answer.export_group, statement_timeout: answer.statement_timeout || '',
    tabs: tabs, open_batches: answer.open_batches || [] })]);
  writeSelftest_(cfg.statusId, rows);
}

/** Plan 47 finish S2 item 4: drills 2 and 3 on import-try. Sends the tab's current rows minus one key through put_tab
 *  with a fresh copy id, copy_utc now and tonight's New York date, and logs the answer to the "selftest" tab.
 *  Refuses unless DB_URL is exactly the import-try URL. Editor only; the Run button uses drillStopRun(). */
function drillStop(tab, dropKey) {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('paused')) throw new Error('paused: remove the Script Property paused first');
  if (props.getProperty('DB_URL') !== IMPORT_TRY_URL) {
    throw new Error('drillStop runs only on import-try: Script Property DB_URL must be exactly ' + IMPORT_TRY_URL);
  }
  if (!KEY_COLUMNS[tab]) throw new Error('drillStop: ' + tab + ' is not a door tab');
  if (!dropKey) throw new Error('drillStop: no key to drop');
  var cfg = config_(props);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('another export run is going; try again in a few minutes');
  var body, answer, error;
  try {
    var p = readTab_(SpreadsheetApp.openById(cfg.trackerId), tab);
    var cols = KEY_COLUMNS[tab].map(function (k) { return p.headers.indexOf(k); });
    if (cols.some(function (i) { return i < 0; })) throw new Error('drillStop: ' + tab + ' has no ' + KEY_COLUMNS[tab].join(' or ') + ' column');
    var hits = p.rows.filter(function (row) { return cols.map(function (i) { return row.c[i]; }).join('@') === dropKey; });
    if (!hits.length) throw new Error('drillStop: key ' + dropKey + ' not found in ' + tab);
    if (hits.length > 1) throw new Error('drillStop: key ' + dropKey + ' is in ' + tab + ' more than once');
    var now = new Date();
    var hex = Utilities.getUuid().replace(/[^0-9a-f]/gi, '').slice(0, 8).toLowerCase();
    body = { export_group: Utilities.formatDate(now, TZ, 'yyyy-MM-dd'),
      copy_id: 'drill-' + Utilities.formatDate(now, 'UTC', "yyyyMMdd'T'HHmmss'Z'") + '-' + hex, copy_utc: now.toISOString(),
      tab: tab, client_version: CLIENT_VERSION, headers: p.headers, rows: p.rows.filter(function (row) { return row !== hits[0]; }) };
    try { answer = callDb_(cfg, 'put_tab', body); } catch (e) { error = e; }
  } finally {
    lock.releaseLock();
  }
  var detail = 'drop ' + dropKey + '; copy ' + body.copy_id + '; ' + body.rows.length + ' rows sent; answer ' +
    (error ? error.message : JSON.stringify(answer));
  writeSelftest_(cfg.statusId, [[new Date().toISOString(), 'drillStop ' + tab, error ? 'ERROR' : String(answer && answer.status), detail]]);
  if (error) throw error;
}

/** The editor's Run button passes no arguments: tab and key come from Script Properties DRILL_TAB and DRILL_KEY. */
function drillStopRun() {
  var props = PropertiesService.getScriptProperties();
  var tab = props.getProperty('DRILL_TAB'), key = props.getProperty('DRILL_KEY');
  if (!tab || !key) throw new Error('drillStopRun needs Script Properties DRILL_TAB and DRILL_KEY');
  drillStop(tab, key);
}

// rows [time, check, result, detail] to the status sheet's "selftest" tab (made with its header row if missing), as text
function writeSelftest_(sheetId, rows) {
  var ss = SpreadsheetApp.openById(sheetId);
  var out = ss.getSheetByName('selftest');
  if (!out) { out = ss.insertSheet('selftest'); out.appendRow(['time_utc', 'check', 'result', 'detail']); }
  rows.forEach(function (r) { out.appendRow(r.map(function (v) { return "'" + String(v).slice(0, 45000); })); });
}

/** Live test 13g (amendment A3): Stephen runs this from the editor, never on a trigger. Three real calls through the
 *  door with real tokens: tonight() (the 8 tabs), put_tab for a tab not on the list (STOPPED by the tab check, not the
 *  guard) and record_result (one WAIT for NUMBER_MAP). Plus the STORIES size, read only. No copy, no real put_tab.
 *  Results go to the "selftest" tab of the status sheet; throws at the end if any check failed. */
function selfTest() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('paused')) throw new Error('paused: remove the Script Property paused first');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('another export run is going; try again in a few minutes');
  var results = [], cfg;
  try {
    cfg = config_(props);
    var now = new Date();
    var group = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
    var stamp = Utilities.formatDate(now, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
    var hex = Utilities.getUuid().replace(/[^0-9a-f]/gi, '').slice(0, 8).toLowerCase();
    var check = function (name, fn) {
      try { var d = fn(); results.push([name, d.ok ? 'PASS' : 'FAIL', d.detail]); }
      catch (e) { results.push([name, 'FAIL', selfTestHint_(name, e.message, results.length > 0 && results[0][1] === 'PASS')]); }
    };
    check('tonight', function () {
      var a = callDb_(cfg, 'tonight', {});
      var got = (a.tabs || []).map(function (t) { return t.tab; }).sort();
      var want = Object.keys(KEY_COLUMNS).sort();
      var ok = got.join(',') === want.join(',');
      return { ok: ok, detail: 'tabs ' + got.join(',') + (ok ? '' : ' (expected ' + want.join(',') + ')') +
        '; statement_timeout ' + a.statement_timeout + '; export_group ' + a.export_group };
    });
    check('put_tab', function () {
      var r = callDb_(cfg, 'put_tab', { export_group: group, copy_id: 'selftest-' + stamp + '-' + hex, copy_utc: now.toISOString(),
        tab: 'SELFTEST_13G', client_version: CLIENT_VERSION, headers: ['x'], rows: [] });
      var reason = String(r.reason || '');
      if (r.status === 'STOPPED' && reason.indexOf('is not on the list') >= 0) return { ok: true, detail: 'STOPPED: ' + reason };
      if (r.status === 'STOPPED' && reason.indexOf('lock wait') === 0) return { ok: false, detail: reason + ' (another import held the lock: re-run selfTest)' };
      return { ok: false, detail: 'expected STOPPED "is not on the list", got ' + JSON.stringify(r).slice(0, 300) };
    });
    check('record_result', function () {
      var r = callDb_(cfg, 'record_result', { export_group: group, client_version: CLIENT_VERSION,
        entries: [{ tab: 'NUMBER_MAP', status: 'WAIT', message: 'selftest 13g ' + stamp }] });
      return { ok: r.status === 'LOGGED' && Number(r.count) === 1, detail: JSON.stringify(r).slice(0, 300) };
    });
    check('stories_size', function () {
      var p = readTab_(SpreadsheetApp.openById(cfg.trackerId), 'STORIES');
      var cells = 0;
      p.rows.forEach(function (row) { cells += row.c.length; });
      // the database measures the jsonb text form, which adds a space after each , and : (about 2 bytes per cell)
      var bytes = Utilities.newBlob(JSON.stringify(p.rows)).getBytes().length + 2 * cells;
      return { ok: bytes <= 1000000, detail: bytes + ' bytes, ' + p.rows.length + ' rows' + (bytes > 1000000 ? ' (over 1 MB: review the cap before verifyNow)' : '') };
    });
  } catch (e) {
    results.push(['setup', 'FAIL', e.message]);
  } finally {
    lock.releaseLock();
  }
  var fails = results.filter(function (r) { return r[1] === 'FAIL'; }).length;
  console.log('selfTest results: ' + JSON.stringify(results));    // in the execution log even if the sheet write fails
  var sheetId = cfg ? cfg.statusId : props.getProperty('STATUS_SHEET_ID');
  if (!sheetId) throw new Error('selfTest: Script Property STATUS_SHEET_ID is not set; results: ' + JSON.stringify(results));
  var t = new Date().toISOString();
  writeSelftest_(sheetId, results.map(function (r) { return [t, r[0], r[1], r[2]]; }).concat([[t, '#done', fails, CLIENT_VERSION]]));
  if (fails) throw new Error('selfTest: ' + fails + ' check' + (fails > 1 ? 's' : '') + ' failed (see the selftest tab)');
}

// a 404 means different things depending on whether tonight() worked in this run (A3 review M1, Copilot)
function selfTestHint_(name, message, tonightWorked) {
  if (!/HTTP 404/.test(message)) return message;
  if (name !== 'tonight' && tonightWorked) {
    return message + ' (tonight() worked, so the argument names sent do not match the function: a code bug, not the cache)';
  }
  return message + ' (stale schema cache: change one Data API setting in Neon, then re-run)';
}

// ---------------------------------------------------------------- one run

function runExport_(opts) {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('paused')) return null;                              // pause stops every path (ChatGPT 1)
  var cfg = config_(props);
  var st = {
    start: Date.now(), group: Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'),
    todo: [], done: {}, stopped: {}, fail: null, wait: [], skipped: [], stuck: [], notes: [], copyId: null,
  };
  try {
    trashStoredCopies_(props, st);
    var first;
    try { first = callDb_(cfg, 'tonight', {}); }
    catch (e) { st.notes.push('database unreachable (first tonight): ' + e.message); return; }
    // verifyNow sends every enabled tab from a fresh copy, so the proof compares against a new snapshot (ChatGPT 2)
    st.todo = first.tabs.filter(function (t) { return opts.allTabs || GOOD.indexOf(t.status) < 0; }).map(function (t) { return t.tab; });
    var tracker = SpreadsheetApp.openById(cfg.trackerId);
    var busy = isBusy_(tracker, st);              // also lists stuck claims for the status row on a done night
    if (!st.todo.length) return;
    if (busy && !opts.ignoreBusy) return busyExit_(st);
    var copyUtc = new Date();
    var file = DriveApp.getFileById(cfg.trackerId).makeCopy(COPY_PREFIX + Utilities.formatDate(copyUtc, 'UTC', "yyyyMMdd'T'HHmmss'Z'"));
    st.copyId = file.getId();
    addCopyId_(props, st.copyId);                                            // before reading it (F18)
    if (isBusy_(tracker, st) && !opts.ignoreBusy) return busyExit_(st);     // a claim appeared during the copy
    var copy = SpreadsheetApp.openById(st.copyId);
    var copyName = st.copyName = 'c-' + Utilities.formatDate(copyUtc, 'UTC', "yyyyMMdd'T'HHmmss'Z'") + '-' + Utilities.getUuid().slice(0, 8);

    for (var i = 0; i < st.todo.length; i++) {
      var tab = st.todo[i];
      if (Date.now() - st.start > BUDGET_MS.lastTabStart) { st.wait = st.todo.slice(i); st.notes.push('time budget: ' + st.wait.join(',') + ' wait'); break; }
      var p;
      try { p = readTab_(copy, tab); }
      catch (e) { st.fail = { tab: tab, message: 'read: ' + e.message }; st.wait = st.todo.slice(i + 1); break; }
      // checked again right before the call: reading a big tab takes real seconds (review M1)
      if (Date.now() - st.start > BUDGET_MS.lastTabStart) { st.wait = st.todo.slice(i); st.notes.push('time budget: ' + st.wait.join(',') + ' wait'); break; }
      var body = { export_group: st.group, copy_id: copyName, copy_utc: copyUtc.toISOString(), tab: tab,
                   client_version: CLIENT_VERSION, headers: p.headers, rows: p.rows };
      var r = putWithRetry_(cfg, body, st);
      if (r.done) st.done[tab] = r.status;
      else if (r.stopped) st.stopped[tab] = r.reason;
      else { st.fail = { tab: tab, message: r.error }; st.wait = st.todo.slice(i + 1); break; }   // T3: no more tabs this run
    }
  } finally {
    finish_(cfg, props, st);
  }
  return st;
}

function busyExit_(st) {
  var hour = Number(Utilities.formatDate(new Date(), TZ, 'H'));
  if (hour >= SKIP_HOUR) st.skipped = st.todo.slice();
  st.notes.push('busy: a live claim' + (st.skipped.length ? '; SKIPPED at the last run' : '; next hour'));
}

// at most ONE record_result per run; copy trashed; tonight(); status row (every exit path)
function finish_(cfg, props, st) {
  var entries = [];
  if (st.fail) entries.push({ tab: st.fail.tab, status: 'FAIL', message: String(st.fail.message).slice(0, 2000) });
  st.wait.forEach(function (t) { entries.push({ tab: t, status: 'WAIT', message: 'not reached this run' }); });
  st.skipped.forEach(function (t) { entries.push({ tab: t, status: 'SKIPPED', message: 'tracker busy at the last run' }); });
  if (entries.length) {
    try { callDb_(cfg, 'record_result', { export_group: st.group, entries: entries, client_version: CLIENT_VERSION }); }
    catch (e) { st.notes.push('record_result failed: ' + e.message); }
  }
  if (st.copyId) trashCopy_(props, st.copyId, st);
  var answer = null;
  try { answer = callDb_(cfg, 'tonight', {}); }
  catch (e) { st.notes.push('database unreachable: ' + e.message); }
  writeStatus_(cfg, st, answer);
}

// ---------------------------------------------------------------- the door

function putWithRetry_(cfg, body, st) {
  var r = tryCall_(cfg, 'put_tab', body);
  if (!r.ok && Date.now() - st.start <= BUDGET_MS.lastRetryWait) {
    Utilities.sleep(BUDGET_MS.retryWait);
    if (Date.now() - st.start <= BUDGET_MS.lastTabStart) r = tryCall_(cfg, 'put_tab', body);
  }
  if (!r.ok) return { error: r.error };
  var s = r.body && r.body.status;
  if (GOOD.indexOf(s) >= 0) return { done: true, status: s };
  if (s === 'STOPPED') return { stopped: true, reason: r.body.reason };    // the database logged it (F12, 13d)
  return { error: 'unexpected reply: ' + JSON.stringify(r.body).slice(0, 300) };
}

function tryCall_(cfg, fn, body) {
  try { return { ok: true, body: callDb_(cfg, fn, body) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

// One web call. Done only on HTTP 200 with a readable JSON reply. A fresh token for every call (S4).
function callDb_(cfg, fn, body) {
  var resp = UrlFetchApp.fetch(cfg.url + '/rpc/' + fn, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body),
    headers: { Authorization: 'Bearer ' + token_(cfg), 'Content-Profile': 'api', 'Accept-Profile': 'api' },
    muteHttpExceptions: true, followRedirects: false, timeoutSeconds: TIMEOUT_SECONDS[fn],
  });
  var code = resp.getResponseCode(), text = resp.getContentText();
  if (code !== 200) throw new Error(fn + ' HTTP ' + code + ': ' + String(text).slice(0, 500));
  try { return JSON.parse(text); } catch (e) { throw new Error(fn + ': unreadable reply'); }
}

function token_(cfg) {
  var now = Math.floor(Date.now() / 1000);
  var head = { alg: 'RS256', typ: 'JWT', kid: TOKEN.kid };
  var claims = { role: TOKEN.role, sub: TOKEN.sub, aud: TOKEN.aud, iat: now, exp: now + TOKEN.lifetime };
  var input = b64url_(JSON.stringify(head)) + '.' + b64url_(JSON.stringify(claims));
  var sig = Utilities.computeRsaSha256Signature(input, cfg.key);
  return input + '.' + b64url_(sig);
}

function b64url_(data) {
  var bytes = typeof data === 'string' ? Utilities.newBlob(data).getBytes() : data;
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function config_(props) {
  var need = ['DB_URL', 'PRIVATE_KEY', 'TRACKER_ID', 'STATUS_SHEET_ID'];
  need.forEach(function (k) { if (!props.getProperty(k)) throw new Error('Script Property ' + k + ' is not set'); });
  // one line of base64 (keygen) or PEM, even with its line breaks flattened by the Script Properties editor (review m6)
  var body = props.getProperty('PRIVATE_KEY').replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  var key = '-----BEGIN PRIVATE KEY-----\n' + body.replace(/(.{64})/g, '$1\n').replace(/\n$/, '') + '\n-----END PRIVATE KEY-----\n';
  return { url: props.getProperty('DB_URL').replace(/\/+$/, ''), key: key,
           trackerId: props.getProperty('TRACKER_ID'), statusId: props.getProperty('STATUS_SHEET_ID') };
}

// ---------------------------------------------------------------- reading a tab

/** headers (sheet headers plus <column>__urls) and rows [{r: sheet row, c: [shown text...]}]; blank rows dropped. */
function readTab_(ss, tab) {
  var sheet = ss.getSheetByName(tab);
  if (!sheet) throw new Error('tab ' + tab + ' not found in the copy');
  var range = sheet.getDataRange();
  var shown = range.getDisplayValues(), formulas = range.getFormulas(), rich = range.getRichTextValues();
  var sheetHeaders = shown[0] || [];
  var links = LINK_COLUMNS[tab] || [];
  var headers = [], linkAt = {};
  sheetHeaders.forEach(function (h, k) {
    headers.push(h);
    if (links.indexOf(h) >= 0) { headers.push(h + '__urls'); linkAt[k] = true; }
  });
  var rows = [];
  for (var i = 1; i < shown.length; i++) {
    var cells = [], any = false;
    for (var k = 0; k < sheetHeaders.length; k++) {
      var v = shown[i][k];
      if (v !== '') any = true;
      cells.push(v);
      if (linkAt[k]) {
        var urls = cellUrls_(formulas[i][k], rich[i][k]);
        if (urls.length) any = true;
        cells.push(JSON.stringify(urls));
      }
    }
    if (any) rows.push({ r: i + 1, c: cells });
  }
  return { headers: headers, rows: rows };
}

// every link in a cell, in order: HYPERLINK formula first, then each text run's link; duplicates kept (F13, R2)
function cellUrls_(formula, richValue) {
  var out = [];
  var m = /^=HYPERLINK\(\s*"([^"]*)"/i.exec(formula || '');
  if (m) out.push(m[1]);
  if (richValue) richValue.getRuns().forEach(function (run) { var u = run.getLinkUrl(); if (u) out.push(u); });
  return out;
}

// ---------------------------------------------------------------- the busy rule

function isBusy_(tracker, st) {
  var busy = false, now = Date.now();
  CLAIM_TABS.forEach(function (name) {
    var sheet = tracker.getSheetByName(name);
    if (!sheet) { busy = true; addOnce_(st.notes, 'claim tab ' + name + ' missing'); return; }
    var v = sheet.getDataRange().getDisplayValues();
    var si = v[0].indexOf('status'), ci = v[0].indexOf('claimed_at_utc');
    if (si < 0 || ci < 0) { busy = true; addOnce_(st.notes, name + ' has no status or claimed_at_utc column'); return; }
    for (var i = 1; i < v.length; i++) {
      if (String(v[i][si]).trim() !== 'claimed') continue;
      var raw = String(v[i][ci]).trim();
      // only ISO time with Z or an offset: shown text without a zone would be read as local time (review m3)
      var t = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(raw) ? Date.parse(raw) : NaN;
      var label = name + ' ' + (v[i][0] || ('row ' + (i + 1)));
      if (isNaN(t)) { busy = true; addOnce_(st.notes, label + ': unreadable claimed_at_utc'); continue; }
      var minutes = Math.round((now - t) / 60000);
      if (minutes < DEAD_CLAIM_MINUTES) busy = true;
      else addOnce_(st.stuck, label + ' claimed ' + minutes + ' min ago');
    }
  });
  return busy;
}

function addOnce_(list, s) { if (list.indexOf(s) < 0) list.push(s); }

// ---------------------------------------------------------------- copies (F18)

function addCopyId_(props, id) {
  var ids = readIds_(props); ids.push(id); props.setProperty('COPY_IDS', JSON.stringify(ids));
}
function readIds_(props) {
  try { var v = JSON.parse(props.getProperty('COPY_IDS') || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}
function trashStoredCopies_(props, st) {
  readIds_(props).forEach(function (id) { trashCopy_(props, id, st); });
}
// trash only a stored id, only if the script owner owns it and its name starts with the copy prefix.
// The id leaves the list only when the copy is trashed or no longer exists; otherwise it stays, is retried and
// reported every run (ChatGPT 4).
function trashCopy_(props, id, st) {
  var gone = false;
  try {
    var f = DriveApp.getFileById(id);
    var me = Session.getEffectiveUser().getEmail();
    if (f.getOwner().getEmail() === me && f.getName().indexOf(COPY_PREFIX) === 0) { f.setTrashed(true); gone = true; }
    else st.notes.push('copy ' + id + ' not trashed (owner or name not as expected)');
  } catch (e) {
    // a failed lookup can mean gone OR no access: never proof of deletion (ChatGPT r2-2); kept, retried, reported
    st.notes.push('copy ' + id + ' not trashed: ' + e.message);
  }
  if (gone) props.setProperty('COPY_IDS', JSON.stringify(readIds_(props).filter(function (x) { return x !== id; })));
}

// ---------------------------------------------------------------- status sheet

// one row per run: run_utc, export_group, all_good, tabs_json, stuck_claims, open_batches_json, statement_timeout, note, client_version
function writeStatus_(cfg, st, answer) {
  var tabs = {}, open = [], limit = '', allGood = false;
  if (answer) {
    answer.tabs.forEach(function (t) { tabs[t.tab] = { s: t.status, h: t.hours_since_good == null ? null : Number(t.hours_since_good) }; });
    open = answer.open_batches || [];
    limit = answer.statement_timeout || '';
    allGood = answer.tabs.length > 0 && answer.tabs.every(function (t) { return GOOD.indexOf(t.status) >= 0; }) && !open.length && !st.stuck.length;
  }
  Object.keys(st.stopped).forEach(function (t) { st.notes.push(t + ' STOPPED: ' + st.stopped[t]); });
  var row = [new Date().toISOString(), answer ? answer.export_group : st.group, allGood ? 'yes' : 'no', JSON.stringify(tabs),
             st.stuck.join('; '), JSON.stringify(open), limit, st.notes.join(' | ').slice(0, 45000), CLIENT_VERSION];
  // a leading ' keeps each value as text, so Sheets does not retype dates and numbers (review m4)
  SpreadsheetApp.openById(cfg.statusId).getSheetByName('status').appendRow(row.map(function (v) { return "'" + v; }));
}

// ---------------------------------------------------------------- verify (done-proof)

/** Read the live tracker through the Sheets API (not SpreadsheetApp) and write run id, tab, key and hash per row to
 *  "verify". Every run has its own id; a run counts only once its last row "#complete" (with the row count) is written,
 *  so an older run or a half-written one is never read as the result (ChatGPT 3). */
function verifyRows_(copyName, cfg, answer) {
  // only verifyNow (the copy the database was just filled from, ChatGPT r3-1) and verifyOnly (the copies of tonight's
  // good rows, joined by +) call this
  var parts = String(copyName || '').split('+');
  if (!copyName || parts.some(function (c) { return !COPY_LABEL.test(c); })) {
    throw new Error('verifyRows_ needs the copy it checks; run verifyNow or verifyOnly instead');
  }
  cfg = cfg || config_(PropertiesService.getScriptProperties());
  answer = answer || callDb_(cfg, 'tonight', {});
  var out = SpreadsheetApp.openById(cfg.statusId).getSheetByName('verify');
  // the run id names the copy the database was just filled from (ChatGPT r2-1)
  var run = 'v-' + Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'") + '-' + Utilities.getUuid().slice(0, 8) + '@' + copyName;
  var lines = [];
  answer.tabs.forEach(function (t) {
    var res = Sheets.Spreadsheets.get(cfg.trackerId, { ranges: [t.tab], includeGridData: true,
      fields: 'sheets(properties.title,data.rowData.values(formattedValue,hyperlink,userEnteredValue.formulaValue,textFormatRuns(startIndex,format.link.uri)))' });
    var rows = (res.sheets[0].data[0].rowData || []).map(function (rd) {
      return (rd.values || []).map(function (v) {
        var urls = cellUrls_(v.userEnteredValue && v.userEnteredValue.formulaValue, { getRuns: function () {
          return (v.textFormatRuns || []).map(function (run) { return { getLinkUrl: function () { return run.format && run.format.link ? run.format.link.uri : null; } }; });
        } });
        // a whole-cell link may come back only as `hyperlink`, with no runs (review M3); the export path sees it as one run.
        // INFERRED from the Sheets API reference; checked on the real tracker in step 4 (13g) and the done-proof.
        if (!urls.length && v.hyperlink) urls.push(v.hyperlink);
        return { text: v.formattedValue == null ? '' : String(v.formattedValue), urls: urls };
      });
    });
    var sheetHeaders = (rows[0] || []).map(function (c) { return c.text; });
    // formatted but empty columns at the right come back as blank headers: drop them; a blank one in between stops
    // (S2 item 2). The database insists the headers match exactly, so no header list is kept here.
    var lastReal = -1;
    sheetHeaders.forEach(function (h, k) { if (h !== '') lastReal = k; });
    for (var b = 0; b < lastReal; b++) {
      if (sheetHeaders[b] === '') throw new Error('verify: ' + t.tab + ' has a blank header in column ' + (b + 1) + ' between real ones');
    }
    sheetHeaders = sheetHeaders.slice(0, lastReal + 1);
    var links = LINK_COLUMNS[t.tab] || [];
    for (var i = 1; i < rows.length; i++) {
      var cells = [], named = {}, any = false;
      sheetHeaders.forEach(function (h, k) {
        var c = rows[i][k] || { text: '', urls: [] };
        cells.push(c.text); named[h] = c.text; if (c.text !== '') any = true;
        if (links.indexOf(h) >= 0) { cells.push(JSON.stringify(c.urls)); if (c.urls.length) any = true; }
      });
      if (!any) continue;
      var key = (KEY_COLUMNS[t.tab] || []).map(function (k) { return named[k]; }).join('@');
      lines.push([run, t.tab, key, canonicalHash_(cells)]);
    }
  });
  // bulk writes (S2 item 1, A4): one appendRow per line took about 0.37 s and hit the 6-minute cap at 922 rows.
  // Chunks of VERIFY_CHUNK_ROWS rows, rows inserted first if the sheet is too short; #complete written last, alone.
  var quote = function (l) { return l.map(function (v) { return "'" + v; }); };
  var start = out.getLastRow() + 1, need = start + lines.length;           // the last row #complete goes in
  if (need > out.getMaxRows()) out.insertRowsAfter(out.getMaxRows(), need - out.getMaxRows());
  for (var i = 0; i < lines.length; i += VERIFY_CHUNK_ROWS) {
    var chunk = lines.slice(i, i + VERIFY_CHUNK_ROWS).map(quote);
    out.getRange(start + i, 1, chunk.length, 4).setValues(chunk);
  }
  out.getRange(start + lines.length, 1, 1, 4).setValues([quote([run, '#complete', lines.length, ''])]);
}

/** The one shared piece: sha256 hex of the row's cells in header order, each as <UTF-8 byte length>:<text>.
 *  verify.sql computes the same from research.tab_row. */
function canonicalHash_(cells) {
  var s = cells.map(function (c) { return Utilities.newBlob(c).getBytes().length + ':' + c; }).join('');
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}
