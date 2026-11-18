// Session-start check of the "NYC nightly status" sheet (plan 47; ChatGPT code review round 2, finding 3).
// Claude reads the sheet's two tabs with the Sheets connector at NYC session start and runs this on them:
//   node tools/nightly/session-check.mjs <file.json>      file = {"status": [[...]], "alarm": [[...]], "expected": [...]}
// It applies the alarm's own rules (alarm.gs check_) to the status tab, and checks the alarm itself is alive:
// a "checked" row in the last 26 hours, and no "mail error" row in the last 7 days. Prints one problem per line.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const DAY = 86400000;

function alarmRules() {
  const fmt = (d, tz, f) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', weekday: 'short' }).formatToParts(d).map(x => [x.type, x.value]));
    return f.replace(/yyyy|MM|dd|H|EEE/g, m => (m === 'yyyy' ? p.year : m === 'MM' ? p.month : m === 'dd' ? p.day : m === 'H' ? String(+p.hour) : p.weekday));
  };
  const ctx = vm.createContext({ Utilities: { formatDate: fmt }, JSON, Date, Number, String, Object, isNaN });
  vm.runInContext(fs.readFileSync(path.join(import.meta.dirname, 'alarm.gs'), 'utf8'), ctx);
  return ctx.check_;
}

export function sessionCheck({ status, alarm, expected, now = new Date().toISOString() }) {
  const t = new Date(now);
  const out = [...alarmRules()(status || [['run_utc']], expected, t)];
  if (!alarm) return out.concat(['alarm tab missing from the status sheet']);
  const rows = alarm.slice(1).filter(r => r[0]);
  const checked = rows.filter(r => r[1] === 'checked').map(r => Date.parse(r[0])).filter(x => !isNaN(x));
  if (!checked.length || t - Math.max(...checked) > 26 * 3600000) {
    out.push('the alarm has not checked in the last 26 hours (its 7am trigger may be off or failing)');
  }
  for (const r of rows.filter(r => r[1] === 'mail error' && t - Date.parse(r[0]) <= 7 * DAY)) {
    out.push(`the alarm could not send email on ${r[0]}: ${String(r[2]).slice(0, 200)}`);
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const p = sessionCheck(input);
  console.log(p.length ? p.map(x => '- ' + x).join('\n') : 'nightly copy and alarm: all good');
}
