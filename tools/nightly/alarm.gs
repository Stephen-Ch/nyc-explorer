/**
 * NYC nightly alarm (plan 47). Standalone Apps Script project, owned by schurchville@gmail.com, time zone
 * America/New_York. It has NO key and never calls the database: it reads the status sheet that the export
 * script fills from the database's own answer (api.tonight).
 *
 * Script Properties:
 *   STATUS_SHEET_ID  the "NYC nightly status" spreadsheet id (tabs: status, alarm)
 *   EXPECTED_TABS    comma list of the stage 1 tabs, set at install; changed only when a tab is added or removed
 *   ALERT_TO         optional; default the script owner
 *
 * Triggers: dailyCheck() every day at 7:00am; weeklyAlive() every day at 7:05am (does its work on Mondays only).
 *
 * Every check writes a row to the "alarm" tab (checked / mail error / weekly). NYC session start reads BOTH the
 * "status" and "alarm" tabs (ChatGPT 6): a mail error, or no "checked" row today, means the alarm is not working.
 */

var GOOD = ['PASS', 'ALREADY', 'NOTHING_NEW'];
var TZ = 'America/New_York';
var STALE_HOURS = 36;
var COPY_PREFIX = 'nyc-export-copy-';

function dailyCheck() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('STATUS_SHEET_ID'));
  var expected = String(props.getProperty('EXPECTED_TABS') || '').split(',').map(function (s) { return s.trim(); }).filter(String);
  var problems = check_(ss.getSheetByName('status').getDataRange().getDisplayValues(), expected, new Date());
  if (problems.length) {
    send_(ss, 'NYC nightly: ' + problems.length + ' problem' + (problems.length > 1 ? 's' : ''),
      'The nightly copy into the database needs a look.\n\n- ' + problems.join('\n- ') +
      '\n\nNext: open an NYC Explorer session ("session start"); Claude logs each incident in docs/INCIDENTS.md.');
  }
  log_(ss, 'checked', problems.length ? problems.join(' | ') : 'all good');
}

/** Returns a list of plain problem lines; empty means all good. */
function check_(values, expected, now) {
  var today = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
  var rows = values.slice(1).filter(function (r) { return r[0]; });
  var last = rows[rows.length - 1];
  var out = [];
  if (!expected.length) out.push('the alarm has no expected tab list (Script Property EXPECTED_TABS)');
  if (!last) return out.concat(['no status row today (the export did not run, or died before writing)']);
  var t = new Date(last[0]);
  if (isNaN(t.getTime()) || Utilities.formatDate(t, TZ, 'yyyy-MM-dd') !== today || Number(Utilities.formatDate(t, TZ, 'H')) < 1) {
    return out.concat(['no status row today (newest is ' + last[0] + ')']);
  }
  var group = last[1], tabs, note = last[7] || '';
  if (/database unreachable/.test(note)) out.push('database unreachable: ' + note.slice(0, 300));
  try { tabs = JSON.parse(last[3] || '{}'); } catch (e) { tabs = null; }
  if (!tabs) { out.push('status row tab list unreadable'); return out; }
  var names = Object.keys(tabs);
  if (!names.length) out.push('no tabs in the newest status row');
  if (group !== today) out.push('export group is ' + group + ', not today (' + today + ')');
  expected.forEach(function (tab) {
    var x = tabs[tab];
    if (!x) { if (names.length) out.push(tab + ': missing from the status row'); return; }
    if (GOOD.indexOf(x.s) < 0) out.push(tab + ': ' + x.s);
    if (x.h == null || Number(x.h) > STALE_HOURS) out.push(tab + ': no good import for over ' + STALE_HOURS + ' hours');
  });
  names.forEach(function (tab) { if (expected.indexOf(tab) < 0) out.push(tab + ': not expected'); });
  if (last[4]) out.push('stuck claim: ' + last[4]);
  var open = [];
  try { open = JSON.parse(last[5] || '[]'); } catch (e) { out.push('open batch list unreadable'); }
  if (open.length) out.push('open batch: ' + JSON.stringify(open).slice(0, 300));
  return out;
}

/** Mondays: one "still alive" email with last week's rows and any orphan copies older than a day (report only). */
function weeklyAlive() {
  var now = new Date();
  if (Utilities.formatDate(now, TZ, 'EEE') !== 'Mon') return;
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('STATUS_SHEET_ID'));
  var rows = ss.getSheetByName('status').getDataRange().getDisplayValues().slice(1).filter(function (r) { return r[0]; });
  var week = rows.filter(function (r) { return now - new Date(r[0]) <= 7 * 86400000; });
  var lines = week.map(function (r) { return r[0] + '  ' + r[1] + '  all good: ' + r[2] + (r[7] ? '  note: ' + String(r[7]).slice(0, 120) : ''); });
  var orphans = [], it = DriveApp.searchFiles('title contains "' + COPY_PREFIX + '" and trashed = false');
  while (it.hasNext()) {
    var f = it.next();
    if (f.getName().indexOf(COPY_PREFIX) === 0 && !f.isTrashed() && now - f.getDateCreated() > 86400000) orphans.push(f.getName() + ' (' + f.getId() + ')');
  }
  send_(ss, 'NYC nightly: still alive (weekly)',
    'Status rows in the last 7 days: ' + week.length + '\n' + lines.join('\n') +
    '\n\nOrphan copies older than a day: ' + (orphans.length ? '\n' + orphans.join('\n') : 'none'));
  log_(ss, 'weekly', week.length + ' rows, ' + orphans.length + ' orphans');
}

function send_(ss, subject, body) {
  var to = PropertiesService.getScriptProperties().getProperty('ALERT_TO') || Session.getEffectiveUser().getEmail();
  try { MailApp.sendEmail(to, subject, body); }
  catch (e) { log_(ss, 'mail error', e.message + ' | ' + subject); }
}

function log_(ss, what, detail) {
  var sh = ss.getSheetByName('alarm') || ss.insertSheet('alarm');
  sh.appendRow([new Date().toISOString(), what, String(detail).slice(0, 45000)]);
}
