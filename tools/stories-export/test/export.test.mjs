// Plan 41 step 3: stories exporter tests (red first). Synthetic fixtures only, no real data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { exportStories, lastHookOk, cleanLink } from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const STORIES_H = ['story_id', 'tier (delight/record)', 'place', 'hook (fresh wording)', 'original_source', 'original_link', 'notes'];
const TEXT_H = ['story_id', 'run_id', 'story_text', 'style_check'];
const POINTS_H = ['kind', 'id', 'place_id', 'name', 'confidence', 'in_box'];
const LATLON_H = ['kind', 'id', 'place_id', 'lat', 'lon', 'confidence'];

const q = v => (/[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
const csv = (h, rows) => [h, ...rows.map(r => h.map(k => r[k] ?? ''))].map(r => r.map(q).join(',')).join('\n') + '\n';

const story = (id, extra = {}) => ({ story_id: id, 'tier (delight/record)': 'delight', place: 'P ' + id,
  'hook (fresh wording)': 'Hook ' + id, original_source: 'Tribune, 1 May 1877, p. 5',
  original_link: 'https://www.loc.gov/item/' + id, notes: 'old hook kept; hook_ok yes', ...extra });

// Default world: ST001 + ST002 at place academy (high), ST003 at place store (medium).
function world({ list, stories, texts, points, latlon, era = '1877' } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'se-'));
  const ids = list ?? ['ST001', 'ST002', 'ST003'];
  fs.writeFileSync(path.join(dir, 'story-list.txt'), `${era} ${ids.length} ${ids.join(' ')}\n`);
  fs.writeFileSync(path.join(dir, 'stories.csv'), csv(STORIES_H, stories ?? ids.map(i => story(i))));
  fs.writeFileSync(path.join(dir, 'text.csv'), csv(TEXT_H, texts ?? ids.map(i => ({ story_id: i, run_id: 'r1', story_text: 'Text ' + i, style_check: 'ok' }))));
  const pts = points ?? [
    { kind: 'place', id: 'academy', place_id: 'academy', name: 'Academy of Music', confidence: 'high', in_box: 'yes' },
    { kind: 'place', id: 'store', place_id: 'store', name: 'A Store', confidence: 'medium', in_box: 'yes' },
    { kind: 'story', id: 'ST001', place_id: 'academy', name: 'Academy of Music', confidence: 'high', in_box: 'yes' },
    { kind: 'story', id: 'ST002', place_id: 'academy', name: 'Academy of Music', confidence: 'high', in_box: 'yes' },
    { kind: 'story', id: 'ST003', place_id: 'store', name: 'A Store', confidence: 'medium', in_box: 'yes' },
  ];
  fs.writeFileSync(path.join(dir, 'points.csv'), csv(POINTS_H, pts));
  const ll = latlon ?? pts.map(p => ({ kind: p.kind, id: p.id, place_id: p.place_id,
    lat: p.place_id === 'store' || p.id === 'store' ? '40.7351' : '40.7340', lon: '-73.9885', confidence: p.confidence }));
  fs.writeFileSync(path.join(dir, 'latlon.csv'), csv(LATLON_H, ll));
  return { storyList: path.join(dir, 'story-list.txt'), storiesCsv: path.join(dir, 'stories.csv'),
    storyTextCsv: path.join(dir, 'text.csv'), pointsCsv: path.join(dir, 'points.csv'), latlonCsv: path.join(dir, 'latlon.csv'), dir };
}

const allStories = out => out.groups.flatMap(g => g.stories);

test('happy path: groups per place, fields mapped, count = list minus dropped', () => {
  const out = exportStories(world());
  assert.equal(out.era, 1877);
  assert.equal(out.groups.length, 2);
  const a = out.groups.find(g => g.id === 'academy');
  assert.deepEqual({ ...a, stories: undefined }, { id: 'academy', name: 'Academy of Music', lat: 40.734, lng: -73.9885, approx: false, stories: undefined });
  assert.deepEqual(a.stories.map(s => s.id), ['ST001', 'ST002']);
  assert.deepEqual(a.stories[0], { id: 'ST001', hook: 'Hook ST001', text: 'Text ST001',
    source: 'Tribune, 1 May 1877, p. 5', link: 'https://www.loc.gov/item/ST001' });
  assert.equal(allStories(out).length, 3);
  assert.deepEqual(out.dropped, []);
});

test('lastHookOk takes the LAST marker in the cell', () => {
  assert.equal(lastHookOk('hook_ok no; rewritten; hook_ok yes'), 'yes');
  assert.equal(lastHookOk('hook_ok yes then re-checked: hook_ok no'), 'no');
  assert.equal(lastHookOk('no marker here'), null);
});

test('a story whose hook_ok changed to no is dropped and listed', () => {
  const out = exportStories(world({ stories: [story('ST001'), story('ST002', { notes: 'hook_ok yes; rewrite; hook_ok no' }), story('ST003')] }));
  assert.deepEqual(allStories(out).map(s => s.id), ['ST001', 'ST003']);
  assert.deepEqual(out.dropped, [{ id: 'ST002', reason: 'hook_ok not yes' }]);
});

test('a story with no hook_ok marker is dropped and listed', () => {
  const out = exportStories(world({ stories: [story('ST001'), story('ST002'), story('ST003', { notes: 'checked' })] }));
  assert.deepEqual(out.dropped, [{ id: 'ST003', reason: 'hook_ok not yes' }]);
  assert.equal(out.groups.length, 1);
});

test('empty required field stops the export', () => {
  assert.throws(() => exportStories(world({ stories: [story('ST001', { 'hook (fresh wording)': '  ' }), story('ST002'), story('ST003')] })), /ST001.*hook/);
  assert.throws(() => exportStories(world({ stories: [story('ST001'), story('ST002', { original_source: '' }), story('ST003')] })), /ST002.*source/);
});

test('missing header stops the export', () => {
  const w = world();
  fs.writeFileSync(w.storiesCsv, fs.readFileSync(w.storiesCsv, 'utf8').replace('hook (fresh wording)', 'hook'));
  assert.throws(() => exportStories(w), /missing header.*hook \(fresh wording\)/);
});

test('duplicate id stops the export (stories pull and story list)', () => {
  assert.throws(() => exportStories(world({ stories: [story('ST001'), story('ST002'), story('ST003'), story('ST002')] })), /duplicate.*ST002/);
  assert.throws(() => exportStories(world({ list: ['ST001', 'ST002', 'ST001'] })), /duplicate.*ST001/);
});

test('story list count must match its header', () => {
  const w = world();
  fs.writeFileSync(w.storyList, '1877 4 ST001 ST002 ST003\n');
  assert.throws(() => exportStories(w), /count/);
});

test('a listed story missing from the pull or the points stops the export', () => {
  assert.throws(() => exportStories(world({ stories: [story('ST001'), story('ST002')] })), /ST003.*not in STORIES/);
  const w = world();
  fs.writeFileSync(w.pointsCsv, fs.readFileSync(w.pointsCsv, 'utf8').split('\n').filter(l => !l.startsWith('story,ST003')).join('\n'));
  assert.throws(() => exportStories(w), /ST003.*point/);
  const w2 = world();
  fs.writeFileSync(w2.latlonCsv, fs.readFileSync(w2.latlonCsv, 'utf8').split('\n').filter(l => !l.startsWith('place,store')).join('\n'));
  assert.throws(() => exportStories(w2), /ST003.*point/);
});

test('story with no place gets its own point group', () => {
  const pts = [
    { kind: 'place', id: 'academy', place_id: 'academy', name: 'Academy of Music', confidence: 'high', in_box: 'yes' },
    { kind: 'story', id: 'ST001', place_id: 'academy', name: 'Academy of Music', confidence: 'high', in_box: 'yes' },
    { kind: 'story', id: 'ST002', place_id: 'academy', name: 'Academy of Music', confidence: 'high', in_box: 'yes' },
    { kind: 'story', id: 'ST003', place_id: '', name: 'Corner lamp post', confidence: 'low', in_box: 'yes' },
  ];
  const out = exportStories(world({ points: pts }));
  const own = out.groups.find(g => g.id === 'ST003');
  assert.ok(own, 'own-point group exists');
  assert.equal(own.name, 'Corner lamp post');
  assert.equal(own.approx, true);
  assert.deepEqual(own.stories.map(s => s.id), ['ST003']);
});

test('point outside the box is dropped and listed, never exported', () => {
  const pts = [
    { kind: 'place', id: 'academy', place_id: 'academy', name: 'Academy of Music', confidence: 'high', in_box: 'yes' },
    { kind: 'place', id: 'store', place_id: 'store', name: 'Bible House', confidence: 'medium', in_box: 'NO' },
    { kind: 'story', id: 'ST001', place_id: 'academy', name: 'Academy of Music', confidence: 'high', in_box: 'yes' },
    { kind: 'story', id: 'ST002', place_id: 'academy', name: 'Academy of Music', confidence: 'high', in_box: 'yes' },
    { kind: 'story', id: 'ST003', place_id: 'store', name: 'Bible House', confidence: 'medium', in_box: 'NO' },
  ];
  const out = exportStories(world({ points: pts }));
  assert.deepEqual(out.groups.map(g => g.id), ['academy']);
  assert.deepEqual(out.dropped, [{ id: 'ST003', reason: 'outside box' }]);
  assert.ok(!JSON.stringify(out.groups).includes('Bible House'));
});

test('cleanLink: loc.gov http prefix rewritten, other non-https dropped', () => {
  assert.equal(cleanLink('http://www.loc.gov/resource/x/?sp=5'), 'https://www.loc.gov/resource/x/?sp=5');
  assert.equal(cleanLink('https://archive.org/details/x'), 'https://archive.org/details/x');
  assert.equal(cleanLink('http://example.com/x'), null);
  assert.equal(cleanLink('http://loc.gov/x'), null);
  assert.equal(cleanLink('javascript:alert(1)'), null);
  assert.equal(cleanLink('data:text/html,<b>x</b>'), null);
  assert.equal(cleanLink('JAVASCRIPT:alert(1)'), null);
  assert.equal(cleanLink(''), null);
  assert.equal(cleanLink('not a url'), null);
});

test('dropped link: story kept with link null, link listed', () => {
  const out = exportStories(world({ stories: [story('ST001', { original_link: 'javascript:alert(1)' }), story('ST002', { original_link: 'http://www.loc.gov/item/2' }), story('ST003')] }));
  const s = Object.fromEntries(allStories(out).map(x => [x.id, x]));
  assert.equal(s.ST001.link, null);
  assert.equal(s.ST002.link, 'https://www.loc.gov/item/2');
  assert.deepEqual(out.linksDropped, [{ id: 'ST001', link: 'javascript:alert(1)' }]);
});

test('text: newest STORY_TEXT row used; style fail means hook only; <b> kept as plain text', () => {
  const texts = [
    { story_id: 'ST001', run_id: 'r1', story_text: 'Old text', style_check: 'ok' },
    { story_id: 'ST002', run_id: 'r1', story_text: 'Good text', style_check: 'ok' },
    { story_id: 'ST001', run_id: 'r2', story_text: 'New <b>bold</b> text', style_check: 'ok (re-checked)' },
    { story_id: 'ST002', run_id: 'r2', story_text: 'Failed text', style_check: 'fail rule 4' },
  ];
  const out = exportStories(world({ texts }));
  const s = Object.fromEntries(allStories(out).map(x => [x.id, x]));
  assert.equal(s.ST001.text, 'New <b>bold</b> text');
  assert.equal(s.ST002.text, null);
  assert.equal(s.ST003.text, null);
  assert.ok(!JSON.stringify(out).includes('Failed text'));
});

test('approx: medium and low are approx, high is not (D4)', () => {
  const out = exportStories(world());
  assert.equal(out.groups.find(g => g.id === 'academy').approx, false);
  assert.equal(out.groups.find(g => g.id === 'store').approx, true);
});

test('CLI writes the JSON file and prints the dropped list', () => {
  const w = world({ stories: [story('ST001'), story('ST002', { notes: 'hook_ok no' }), story('ST003')] });
  const outFile = path.join(w.dir, 'stories.v1.json');
  const log = execFileSync(process.execPath, [path.join(HERE, '..', 'export.mjs'),
    '--story-list', w.storyList, '--stories', w.storiesCsv, '--story-text', w.storyTextCsv,
    '--points', w.pointsCsv, '--latlon', w.latlonCsv, '--era-names', names(w, []), '--out', outFile], { encoding: 'utf8' });
  const data = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  assert.equal(data.version, 1);
  assert.equal(data.groups.flatMap(g => g.stories).length, 2);
  assert.match(log, /ST002.*hook_ok not yes/);
  assert.ok(!('dropped' in data), 'dropped list is printed, not shipped');
});

// Review round 1 fixes (diff review, Nov 16): red tests.
test('blank or out-of-area coordinates stop the export', () => {
  const w = world();
  fs.writeFileSync(w.latlonCsv, fs.readFileSync(w.latlonCsv, 'utf8').replace(/place,academy,academy,40\.7340,-73\.9885/, 'place,academy,academy,,'));
  assert.throws(() => exportStories(w), /academy.*lat\/lng/);
  const w2 = world();
  fs.writeFileSync(w2.latlonCsv, fs.readFileSync(w2.latlonCsv, 'utf8').replace(/place,store,store,40\.7351,-73\.9885/, 'place,store,store,0,0'));
  assert.throws(() => exportStories(w2), /store.*lat\/lng/);
});

test('hook_ok marker with punctuation is read; last marker still wins', () => {
  assert.equal(lastHookOk('hook_ok yes but later hook_ok: no'), 'no');
  assert.equal(lastHookOk('hook_ok yes; then hook_ok - no'), 'no');
  assert.equal(lastHookOk('hook_ok=yes'), 'yes');
  assert.equal(lastHookOk('nothook_ok yes'), null);
  assert.equal(lastHookOk('hook_ok yesterday'), null);
  const out = exportStories(world({ stories: [story('ST001', { notes: 'hook_ok yes; re-check hook_ok: no' }), story('ST002'), story('ST003')] }));
  assert.deepEqual(out.dropped, [{ id: 'ST001', reason: 'hook_ok not yes' }]);
});

test('duplicate header stops the export', () => {
  const w = world();
  fs.writeFileSync(w.storiesCsv, fs.readFileSync(w.storiesCsv, 'utf8').replace('notes\n', 'notes,notes\n'));
  assert.throws(() => exportStories(w), /duplicate header.*notes/);
});

test('cleanLink rejects whitespace, credentials and markup; returns the parsed URL', () => {
  assert.equal(cleanLink('https://x.com/a"><script>'), null);
  assert.equal(cleanLink('https://x.com/a b'), null);
  assert.equal(cleanLink('https://x.com/a\nb'), null);
  assert.equal(cleanLink('https://user:pass@host.com/x'), null);
  assert.equal(cleanLink('  https://archive.org/x  '), 'https://archive.org/x');
  assert.equal(cleanLink('https:/x.com'), null);
});

test('missing header in text, points or latlon file stops the export', () => {
  for (const [f, h] of [['storyTextCsv', 'style_check'], ['pointsCsv', 'in_box'], ['latlonCsv', 'confidence']]) {
    const w = world();
    fs.writeFileSync(w[f], fs.readFileSync(w[f], 'utf8').replace(h, h + '_x'));
    assert.throws(() => exportStories(w), new RegExp('missing header "' + h + '"'));
  }
});

test('missing place row in the points file stops the export', () => {
  const w = world();
  fs.writeFileSync(w.pointsCsv, fs.readFileSync(w.pointsCsv, 'utf8').split('\n').filter(l => !l.startsWith('place,store')).join('\n'));
  assert.throws(() => exportStories(w), /ST003: no point for group store/);
});

// Review round 2 (Nov 16): any hook_ok marker that can't be read means not approved.
test('unreadable hook_ok marker anywhere in the cell means not approved', () => {
  assert.equal(lastHookOk('hook_ok yes; later hook_ok — no'), 'no');
  assert.equal(lastHookOk('hook_ok yes; later hook_ok – no'), 'no');
  assert.equal(lastHookOk('hook_ok yes; then hook_ok pending'), null);
  assert.equal(lastHookOk('hook_ok yes/no pending'), null);
  assert.equal(lastHookOk('HOOK_OK Yes'), 'yes');
  const out = exportStories(world({ stories: [story('ST001', { notes: 'hook_ok yes; hook_ok ?' }), story('ST002'), story('ST003')] }));
  assert.deepEqual(out.dropped, [{ id: 'ST001', reason: 'hook_ok not yes' }]);
});

// Amendment A1 (Nov 16): per-era pin names.
const NAMES_H = ['place_id', 'era', 'name', 'evidence'];
function names(w, rows, header = NAMES_H) {
  const f = path.join(w.dir, 'era-names.csv');
  fs.writeFileSync(f, csv(header, rows));
  return f;
}
const nm = (extra = {}) => ({ place_id: 'store', era: '1877', name: 'Old Store & Co.', evidence: 'Paper 1878', ...extra });

test('era name replaces the group name for that era only', () => {
  const w = world();
  const out = exportStories({ ...w, eraNamesCsv: names(w, [nm(), nm({ place_id: 'academy', era: '1902', name: 'Later Name' })]) });
  assert.equal(out.groups.find(g => g.id === 'store').name, 'Old Store & Co.');
  assert.equal(out.groups.find(g => g.id === 'academy').name, 'Academy of Music');
  assert.equal(out.namesReplaced, 1);
});

test('era name: place_id is trimmed', () => {
  const w = world();
  const out = exportStories({ ...w, eraNamesCsv: names(w, [nm({ place_id: ' store ' })]) });
  assert.equal(out.groups.find(g => g.id === 'store').name, 'Old Store & Co.');
});

test('era name stop cases', () => {
  const cases = [
    [[nm({ name: ' ' })], /empty required field name/],
    [[nm({ evidence: '' })], /empty required field evidence/],
    [[nm(), nm({ name: 'Other' })], /duplicate.*store.*1877/],
    [[nm({ place_id: 'stor' })], /stor.*not a place/],
    [[nm({ era: '1877.0' })], /era/],
  ];
  for (const [rows, re] of cases) {
    const w = world();
    assert.throws(() => exportStories({ ...w, eraNamesCsv: names(w, rows) }), re);
  }
  const w = world();
  assert.throws(() => exportStories({ ...w, eraNamesCsv: names(w, [nm()], ['place_id', 'era', 'name']) }), /missing header "evidence"/);
});

test('era name for this era that matches no exported group stops the export', () => {
  const w = world({ stories: [story('ST001'), story('ST002'), story('ST003', { notes: 'hook_ok no' })] });
  assert.throws(() => exportStories({ ...w, eraNamesCsv: names(w, [nm()]) }), /store.*no exported group/);
});

test('CLI requires --era-names', () => {
  const w = world();
  assert.throws(() => execFileSync(process.execPath, [path.join(HERE, '..', 'export.mjs'),
    '--story-list', w.storyList, '--stories', w.storiesCsv, '--story-text', w.storyTextCsv,
    '--points', w.pointsCsv, '--latlon', w.latlonCsv, '--out', path.join(w.dir, 'o.json')], { stdio: 'pipe' }), /era-names/);
});
