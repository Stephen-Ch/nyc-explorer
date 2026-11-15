// Plan 40 step 0: read-only inventory of the overnight folder. No database.
// Runs every <unit>__ file through the importer's own checks (lib.mjs) plus copies of the database checks the
// line reader skips, and lists every refusal reason once, with a count and up to 5 file names.
// Optional: tab CSVs (STORIES, STORY_TEXT, INDEX, DELIGHTS) in a folder, checked for key, header and spacing problems.
// Usage: node inventory.mjs <overnight folder> <output .md> [tab csv folder]
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';
import { parseFileName, splitLines, decodeChecked, packetColumns, TAB_HEADERS } from './lib.mjs';

const [, , folder, outFile, tabDir] = process.argv;
if (!folder || !outFile) { console.error('usage: node inventory.mjs <overnight folder> <output .md> [tab csv folder]'); process.exit(2); }

const PLACE_ID_DB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;          // 0003:71
const reasons = new Map();                                    // reason -> { n, files:Set }
const add = (reason, file) => {
  const r = reasons.get(reason) ?? { n: 0, files: new Set() };
  r.n++; r.files.add(file); reasons.set(reason, r);
};
const norm = (msg, name) => msg.split(name).join('<file>')
  .replace(/line [0-9]+/g, 'line N')
  .replace(/candidate \S+ does not belong/g, 'candidate <id> does not belong')
  .replace(/: \S+ appears twice/g, ': <id> appears twice');

const all = fs.readdirSync(folder).sort();
const unitFiles = all.filter(n => /^[A-Z0-9-]+__/.test(n));
// nothing is skipped silently: a research-like name (has "__") whose unit part is not understood is a refusal,
// and every other file is listed by name
const oddNames = all.filter(n => n.includes('__') && !/^[A-Z0-9-]+__/.test(n));
const otherFiles = all.filter(n => !n.includes('__'));
const counts = { total: all.length, unitFiles: unitFiles.length, ok: 0, refused: 0, packetsLines: 0 };
const kinds = new Map(), runPrefixes = new Map();
const packetsRuns = new Map();                                // unit -> Map(run_id -> [file])

for (const name of unitFiles) {
  const before = [...reasons.values()].reduce((s, r) => s + r.n, 0);
  let meta = null;
  try { meta = parseFileName(name); kinds.set(meta.kind, (kinds.get(meta.kind) ?? 0) + 1); }
  catch (e) { add(norm(e.message, name), name); }
  const rid = name.split('__')[1]?.replace(/\.(jsonl|md)$/, '') ?? '';
  const pre = rid.split('-')[0];
  runPrefixes.set(pre, (runPrefixes.get(pre) ?? 0) + 1);

  // Drive copy beside it (lib.mjs readRunFile)
  const ext = path.extname(name), base = name.slice(0, -ext.length);
  if (all.some(s => s !== name && s.startsWith(base + ' (') && s.endsWith(ext))) add('has a Drive copy beside it ("(1)")', name);

  let text = null;
  try { text = decodeChecked(fs.readFileSync(path.join(folder, name)), name); }
  catch (e) { add(norm(e.message, name), name); }

  if (text != null && name.endsWith('.jsonl')) {
    const unit = meta?.unit ?? name.split('__')[0];
    const run_id = meta?.run_id ?? rid;
    const f = { name, unit };
    const lines = (text === '' || text === '\n') ? [] : splitLines(text);   // empty packets file: zero packets (lib.mjs)
    if (lines.some(x => x.trim() === '')) add('packets file has a blank line', name);
    const seen = new Set();
    lines.forEach((l, i) => {
      if (l.trim() === '') return;
      counts.packetsLines++;
      let p;
      try { p = packetColumns(l, f, i + 1); }
      catch (e) { add(norm(e.message, name), name); return; }
      if (p.place_id_db !== null && !PLACE_ID_DB_RE.test(p.place_id_db)) add(`place_id not allowed by the database (place_id_db pattern, 0003:71), e.g. ${JSON.stringify(JSON.parse(l).place_id)}`, name);
      if (p.candidate_id !== JSON.parse(l).candidate_id) add('candidate id differs from the JSON (0003:79-80)', name);
      if (seen.has(p.candidate_id)) add('candidate appears twice in one packets file', name);
      seen.add(p.candidate_id);
    });
    const m = packetsRuns.get(unit) ?? new Map();
    m.set(run_id, [...(m.get(run_id) ?? []), name]); packetsRuns.set(unit, m);
  }
  const after = [...reasons.values()].reduce((s, r) => s + r.n, 0);
  if (after > before) counts.refused++; else counts.ok++;
}
for (const n of oddNames) add('looks like a research file but the unit part is not understood', n);
for (const [, m] of packetsRuns) for (const [, files] of m) if (files.length > 1) for (const n of files) add('two packets files share one run id (lib.mjs:294)', n);

// ---------------------------------------------------------------- tabs
const tabNotes = [];
const EXTRA_HEADERS = {
  INDEX: ['candidate_id','place_id','name','address_in_year','cd','year','disposition','importance_suggested','unit_id','zone','interests','hold_reason'],
  STORY_TEXT: ['story_id','run_id','lead_id','story_text','date_note','style_check','followup_status'],
};
if (tabDir) {
  for (const tab of ['STORIES', 'STORY_TEXT', 'INDEX', 'DELIGHTS']) {
    const p = path.join(tabDir, `${tab}.csv`);
    if (!fs.existsSync(p)) { tabNotes.push(`${tab}: no CSV given`); continue; }
    const probs = [];
    let text; try { text = decodeChecked(fs.readFileSync(p), `${tab}.csv`); } catch (e) { tabNotes.push(`${tab}: ${e.message}`); continue; }
    let recs; try { recs = parseCsv(text, { bom: false, relax_column_count: true, skip_empty_lines: false }); }
    catch (e) { tabNotes.push(`${tab}: not readable as CSV: ${e.message}`); continue; }
    const want = TAB_HEADERS[tab] ?? EXTRA_HEADERS[tab];
    const h = recs[0] ?? [];
    if (JSON.stringify(h) !== JSON.stringify(want)) {
      const diff = want.map((w, i) => (h[i] === w ? null : `col ${i + 1}: want ${JSON.stringify(w)} got ${JSON.stringify(h[i] ?? null)}`)).filter(Boolean);
      if (h.length > want.length) diff.push(`extra columns: ${JSON.stringify(h.slice(want.length))}`);
      probs.push(`headers differ: ${diff.slice(0, 6).join('; ')}`);
    }
    if (h.some(x => x !== x.trim())) probs.push('a header has leading or trailing spaces');
    const keyOf = {
      STORIES: { re: /^ST[0-9]{3,}$/, key: r => r.story_id },
      DELIGHTS: { re: /^D[0-9]{3,}$/, key: r => r.delight_id },
      INDEX: { re: /^[a-z0-9]+(-[a-z0-9]+)*$/, key: r => r.candidate_id },
      STORY_TEXT: { re: /^ST[0-9]{3,}@.+$/, key: r => (r.story_id && r.run_id ? `${r.story_id}@${r.run_id}` : r.story_id ? `${r.story_id}@` : '') },
    }[tab];
    const seen = new Map(), bad = { width: [], nokey: [], badkey: [], dup: [], space: [], style: [], runid: [] };
    recs.slice(1).forEach((cells, i) => {
      const row = i + 2;
      if (cells.every(c => c === '')) return;
      if (cells.length !== h.length) bad.width.push(row);
      const r = {}; h.forEach((k, j) => { r[k] = cells[j] ?? ''; });
      const k = keyOf.key(r);
      if (!k || !k.trim()) { bad.nokey.push(row); return; }
      if (k !== k.trim() || (r.candidate_id ?? '') !== (r.candidate_id ?? '').trim()) bad.space.push(row);
      if (!keyOf.re.test(k.trim())) bad.badkey.push(`${row} ${JSON.stringify(k)}`);
      if (seen.has(k)) bad.dup.push(`${k} rows ${seen.get(k)}+${row}`); else seen.set(k, row);
      if (tab === 'STORY_TEXT') {
        if (!['ok', 'unchecked'].includes(r.style_check) && !r.style_check?.startsWith('fail ')) bad.style.push(`${row} ${JSON.stringify(r.style_check)}`);
        if (!/^run-[0-9]{8}T[0-9]{6}Z$/.test(r.run_id ?? '')) bad.runid.push(`${row} ${JSON.stringify(r.run_id)}`);
      }
    });
    const lab = { width: 'rows with a different cell count', nokey: 'rows with cells but no key', badkey: 'bad keys', dup: 'duplicate keys',
      space: 'keys with spaces', style: 'bad style_check', runid: 'run_id not run-<UTC stamp>' };
    for (const [k, v] of Object.entries(bad)) if (v.length) probs.push(`${lab[k]} (${v.length}): ${v.slice(0, 5).join(', ')}${v.length > 5 ? ', ...' : ''}`);
    tabNotes.push(`${tab} (${recs.length - 1} rows): ${probs.length ? probs.join(' | ') : 'no problems'}`);
  }
}

// ---------------------------------------------------------------- report
const now = new Date();
const lines = [];
lines.push(`# Import inventory ${now.toISOString().slice(0, 10)} (plan 40 step 0, read-only)`, '');
lines.push(`Folder: ${folder}. Made ${now.toISOString()}.`);
lines.push(`Files: ${counts.total} in folder, ${counts.unitFiles} unit files; ${counts.ok} pass every check, ${counts.refused} have at least one refusal. Packet lines read: ${counts.packetsLines}.`);
lines.push(`Other files (not research, ${otherFiles.length}): ${otherFiles.slice(0, 40).join(', ')}${otherFiles.length > 40 ? ', ...' : ''}.`);
lines.push(`Kinds understood: ${[...kinds].map(([k, n]) => `${k} ${n}`).join(', ')}.`);
lines.push(`Run id prefixes: ${[...runPrefixes].map(([k, n]) => `${k} ${n}`).join(', ')}.`, '');
lines.push('## Refusal reasons (count = occurrences; files = up to 5 names)', '');
const sorted = [...reasons].sort((a, b) => b[1].n - a[1].n);
if (!sorted.length) lines.push('None.');
for (const [r, v] of sorted) {
  const fl = [...v.files];
  lines.push(`- ${r}: ${v.n} (${fl.length} files) e.g. ${fl.slice(0, 5).join(', ')}${fl.length > 5 ? ', ...' : ''}`);
}
lines.push('', '## Tabs', '');
lines.push(...(tabNotes.length ? tabNotes.map(t => `- ${t}`) : ['- not checked (no tab folder given)']));
fs.writeFileSync(outFile, lines.join('\n') + '\n');
console.log(lines.join('\n'));
