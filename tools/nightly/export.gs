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
 *
 * Triggers: nightly() daily at 1, 2, 3, 4 and 5am. verifyNow() only by hand from the editor (done-proof).
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
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('another export run is going; try again in a few minutes');
  try { runExport_({ ignoreBusy: true }); } finally { lock.releaseLock(); }
  verifyRows_();
}

// ---------------------------------------------------------------- one run

function runExport_(opts) {
  var props = PropertiesService.getScriptProperties();
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
    st.todo = first.tabs.filter(function (t) { return GOOD.indexOf(t.status) < 0; }).map(function (t) { return t.tab; });
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
    var copyName = 'c-' + Utilities.formatDate(copyUtc, 'UTC', "yyyyMMdd'T'HHmmss'Z'") + '-' + Utilities.getUuid().slice(0, 8);

    for (var i = 0; i < st.todo.length; i++) {
      var tab = st.todo[i];
      if (Date.now() - st.start > BUDGET_MS.lastTabStart) { st.wait = st.todo.slice(i); st.notes.push('time budget: ' + st.wait.join(',') + ' wait'); break; }
      var p;
      try { p = readTab_(copy, tab); }
      catch (e) { st.fail = { tab: tab, message: 'read: ' + e.message }; st.wait = st.todo.slice(i + 1); break; }
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
  var key = props.getProperty('PRIVATE_KEY').trim();
  if (key.indexOf('BEGIN') < 0) {
    key = '-----BEGIN PRIVATE KEY-----\n' + key.replace(/\s+/g, '').replace(/(.{64})/g, '$1\n').replace(/\n$/, '') + '\n-----END PRIVATE KEY-----\n';
  }
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
      var t = Date.parse(v[i][ci]);
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
// trash only a stored id, only if the script owner owns it and its name starts with the copy prefix
function trashCopy_(props, id, st) {
  try {
    var f = DriveApp.getFileById(id);
    var me = Session.getEffectiveUser().getEmail();
    if (f.getOwner().getEmail() === me && f.getName().indexOf(COPY_PREFIX) === 0) f.setTrashed(true);
    else st.notes.push('copy ' + id + ' not trashed (owner or name not as expected)');
  } catch (e) {
    if (!/No item with the given ID/i.test(e.message)) st.notes.push('copy ' + id + ': ' + e.message);
  }
  props.setProperty('COPY_IDS', JSON.stringify(readIds_(props).filter(function (x) { return x !== id; })));
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
  SpreadsheetApp.openById(cfg.statusId).getSheetByName('status').appendRow(row);
}

// ---------------------------------------------------------------- verify (done-proof)

/** Read the live tracker through the Sheets API (not SpreadsheetApp) and write key + hash per row to "verify". */
function verifyRows_() {
  var cfg = config_(PropertiesService.getScriptProperties());
  var answer = callDb_(cfg, 'tonight', {});
  var out = SpreadsheetApp.openById(cfg.statusId).getSheetByName('verify');
  answer.tabs.forEach(function (t) {
    var res = Sheets.Spreadsheets.get(cfg.trackerId, { ranges: [t.tab], includeGridData: true,
      fields: 'sheets(properties.title,data.rowData.values(formattedValue,userEnteredValue.formulaValue,textFormatRuns(startIndex,format.link.uri)))' });
    var rows = (res.sheets[0].data[0].rowData || []).map(function (rd) {
      return (rd.values || []).map(function (v) {
        var urls = cellUrls_(v.userEnteredValue && v.userEnteredValue.formulaValue, { getRuns: function () {
          return (v.textFormatRuns || []).map(function (run) { return { getLinkUrl: function () { return run.format && run.format.link ? run.format.link.uri : null; } }; });
        } });
        return { text: v.formattedValue == null ? '' : String(v.formattedValue), urls: urls };
      });
    });
    var sheetHeaders = (rows[0] || []).map(function (c) { return c.text; });
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
      out.appendRow([t.tab, key, canonicalHash_(cells)]);
    }
  });
}

/** The one shared piece: sha256 hex of the row's cells in header order, each as <UTF-8 byte length>:<text>.
 *  verify.sql computes the same from research.tab_row. */
function canonicalHash_(cells) {
  var s = cells.map(function (c) { return Utilities.newBlob(c).getBytes().length + ':' + c; }).join('');
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}
