// ChatGPT round 2 finding 3: the session-start check of the status sheet catches a broken alarm.
// session-check.mjs reads both tabs (as the Sheets connector returns them) and lists problems in plain words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionCheck } from '../session-check.mjs';

const EXPECTED = ['STORIES', 'DELIGHTS'];
const tabs = JSON.stringify({ STORIES: { s: 'PASS', h: 1 }, DELIGHTS: { s: 'NOTHING_NEW', h: 2 } });
const status = (utc = '2026-11-19T06:07:00Z') => [['run_utc'], [utc, '2026-11-19', 'yes', tabs, '', '[]', '8s', '', 'abc']];
const alarm = rows => [['time', 'what', 'detail'], ...rows];
const NOW = '2026-11-19T14:00:00Z';   // 9am New York

test('all good: export row today, alarm checked today, no mail error', () => {
  assert.deepEqual(sessionCheck({ status: status(), alarm: alarm([['2026-11-19T12:00:05Z', 'checked', 'all good']]), expected: EXPECTED, now: NOW }), []);
});

test('a mail error in the last 7 days is reported', () => {
  const p = sessionCheck({ status: status(), expected: EXPECTED, now: NOW,
    alarm: alarm([['2026-11-17T12:00:05Z', 'mail error', 'Service invoked too many times'], ['2026-11-19T12:00:05Z', 'checked', 'all good']]) });
  assert.match(p.join('\n'), /alarm could not send email.*too many times/);
});

test('no checked row in the last 26 hours: the alarm is not running', () => {
  for (const rows of [[], [['2026-11-18T10:00:05Z', 'checked', 'all good']]]) {
    const p = sessionCheck({ status: status(), alarm: alarm(rows), expected: EXPECTED, now: NOW });
    assert.match(p.join('\n'), /alarm has not checked/);
  }
});

test('before 7am, yesterday 7am counts as recent; the export row problems still show', () => {
  const p = sessionCheck({ status: status('2026-11-18T06:07:00Z'), alarm: alarm([['2026-11-18T12:00:05Z', 'checked', 'all good']]),
    expected: EXPECTED, now: '2026-11-19T10:30:00Z' });   // 5:30am New York
  assert.doesNotMatch(p.join('\n'), /alarm has not checked/);
  assert.match(p.join('\n'), /no status row today/);
});

test('missing alarm tab is reported', () => {
  assert.match(sessionCheck({ status: status(), alarm: null, expected: EXPECTED, now: NOW }).join('\n'), /alarm tab missing/);
});
