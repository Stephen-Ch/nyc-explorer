// Plan 41 step 3: export the frozen story list to content/stories.v1.json.
// Reads only the snapshot folder files and the fit. Never re-picks stories.
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

const HOOK = 'hook (fresh wording)';
const NEED = {
  stories: ['story_id', HOOK, 'original_source', 'original_link', 'notes'],
  text: ['story_id', 'story_text', 'style_check'],
  points: ['kind', 'id', 'place_id', 'name', 'confidence', 'in_box'],
  latlon: ['kind', 'id', 'place_id', 'lat', 'lon', 'confidence'],
};

function readCsv(file, kind) {
  const rows = parse(fs.readFileSync(file, 'utf8'), { bom: true, relax_column_count: true });
  const header = rows[0] ?? [];
  const dup = header.find((h, i) => h !== '' && header.indexOf(h) !== i);
  if (dup) throw new Error(`${kind}: duplicate header "${dup}" in ${file}`);
  for (const h of NEED[kind]) if (!header.includes(h)) throw new Error(`${kind}: missing header "${h}" in ${file}`);
  return rows.slice(1).filter(r => r.some(c => c !== '')).map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

function uniqueBy(rows, key, label) {
  const m = new Map();
  for (const r of rows) {
    if (m.has(r[key])) throw new Error(`${label}: duplicate id ${r[key]}`);
    m.set(r[key], r);
  }
  return m;
}

export function lastHookOk(notes) {
  // Every hook_ok marker must read cleanly as yes or no; one unreadable marker = not approved.
  const s = String(notes);
  const marks = [...s.matchAll(/\bhook_ok\b/gi)];
  let last = null;
  for (const m of marks) {
    const v = s.slice(m.index + m[0].length).match(/^[\s:=\-–—]*(yes|no)(?![\w/])/i);
    if (!v) return null;
    last = v[1].toLowerCase();
  }
  return last;
}

export function cleanLink(raw) {
  let s = String(raw ?? '').trim();
  if (s.startsWith('http://www.loc.gov/')) s = 'https://' + s.slice('http://'.length);
  if (!s.startsWith('https://') || /[\s"'<>`\\]/.test(s)) return null;
  let u;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  return u.href;
}

function readList(file) {
  const [era, count, ...ids] = fs.readFileSync(file, 'utf8').trim().split(/\s+/);
  if (!/^\d{4}$/.test(era)) throw new Error(`story list: bad era "${era}"`);
  if (Number(count) !== ids.length) throw new Error(`story list: count ${count} but ${ids.length} ids`);
  const seen = new Set();
  for (const id of ids) { if (seen.has(id)) throw new Error(`story list: duplicate id ${id}`); seen.add(id); }
  return { era: Number(era), ids };
}

const req = (v, what, id) => {
  const s = String(v ?? '').trim();
  if (!s) throw new Error(`${id}: empty required field ${what}`);
  return s;
};

export function exportStories({ storyList, storiesCsv, storyTextCsv, pointsCsv, latlonCsv }) {
  const { era, ids } = readList(storyList);
  const stories = uniqueBy(readCsv(storiesCsv, 'stories'), 'story_id', 'stories');
  const newestText = new Map();
  for (const r of readCsv(storyTextCsv, 'text')) newestText.set(r.story_id, r); // last row in sheet order wins
  const key = r => r.kind + '|' + r.id;
  const points = uniqueBy(readCsv(pointsCsv, 'points').map(r => ({ ...r, k: key(r) })), 'k', 'points');
  const latlon = uniqueBy(readCsv(latlonCsv, 'latlon').map(r => ({ ...r, k: key(r) })), 'k', 'latlon');

  const dropped = [], linksDropped = [], groups = new Map();
  for (const id of ids) {
    const s = stories.get(id);
    if (!s) throw new Error(`${id}: listed but not in STORIES pull`);
    const hook = req(s[HOOK], 'hook', id);
    const source = req(s.original_source, 'source', id);
    const sp = points.get('story|' + id);
    if (!sp) throw new Error(`${id}: no story point in points file`);
    const gid = sp.place_id.trim() || id;
    const gp = sp.place_id.trim() ? points.get('place|' + gid) : sp;
    const gl = latlon.get(sp.place_id.trim() ? 'place|' + gid : 'story|' + id);
    if (!gp || !gl) throw new Error(`${id}: no point for group ${gid}`);

    if (lastHookOk(s.notes) !== 'yes') { dropped.push({ id, reason: 'hook_ok not yes' }); continue; }
    if (gp.in_box.trim().toLowerCase() !== 'yes') { dropped.push({ id, reason: 'outside box' }); continue; }

    const link = cleanLink(s.original_link);
    if (!link) linksDropped.push({ id, link: s.original_link });
    const t = newestText.get(id);
    const text = t && /^ok\b/i.test(t.style_check.trim()) && t.story_text.trim() ? t.story_text : null;

    if (!groups.has(gid)) {
      const lat = gl.lat.trim() === '' ? NaN : Number(gl.lat), lng = gl.lon.trim() === '' ? NaN : Number(gl.lon);
      // Launch area is around Union Square; anything far outside Manhattan is a data error.
      if (!(lat > 40.6 && lat < 40.9 && lng > -74.1 && lng < -73.9)) throw new Error(`${gid}: bad lat/lng "${gl.lat}", "${gl.lon}"`);
      const conf = req(gl.confidence, 'confidence', gid).toLowerCase();
      groups.set(gid, { id: gid, name: req(gp.name, 'name', gid), lat, lng, approx: conf !== 'high', stories: [] });
    }
    groups.get(gid).stories.push({ id, hook, text, source, link });
  }

  const sorted = [...groups.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const g of sorted) g.stories.sort((a, b) => a.id.localeCompare(b.id));
  return { version: 1, era, groups: sorted, dropped, linksDropped };
}
