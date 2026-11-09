// NYC Explorer importer (plan 05, draft 7 rev 3). Copies one unit's run files, or one tracker tab, into Neon's
// research area in ONE transaction at READ COMMITTED, as the limited 'importer' role. Never prints the password.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import { parse as parseCsv } from 'csv-parse/sync';

// ---------------------------------------------------------------- fixed lists
// Must equal the names the database views use (0003 research.story / research.delight_1852).
export const TAB_HEADERS = {
  STORIES: ['story_id','tier (delight/record)','check_label','place','address','zone','index_place_id','story_date',
    'map_years (standing confirmed)','notable_name','hook (fresh wording)','original_source','original_link','original_quote',
    'pointer_source (modern, credit only)','skeptic_verdict','grade','new_vs_index_wiki','notes','added','run_id','skeptic_file'],
  DELIGHTS: ['delight_id','kind','year','event_date','report_date','paper','printed_page','image_no','loc_link','quote',
    'spot_as_printed','cross_streets','zone','map_point','interests','hook','grade','second_source','check_result','notes'],
};
const TAB_KEY = { STORIES: { col: 'story_id', re: /^ST[0-9]{3,}$/ }, DELIGHTS: { col: 'delight_id', re: /^D[0-9]{3,}$/ } };
const UNIT_RE = /^(MN[0-9]{2}-[0-9]{4}|US-[0-9]{4}|ST-(SQ|N|S|E|W)-[0-9]{4}|TAB-(STORIES|DELIGHTS))$/;
const RUN_RE = /^run-[0-9]{8}T[0-9]{6}Z$/;
const SECRETS = [/postgres(ql)?:\/\/[^\s:@/]+:[^\s@/]+@/i, /password=/i, /npg_[A-Za-z0-9]{8,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];
const MAX_MANIFEST_AGE_MS = 24 * 3600 * 1000;
// Google Drive file ids: letters, digits, '-' and '_' (ChatGPT build review 1, finding 2)
const DRIVE_ID_RE = /^[A-Za-z0-9_-]{20,80}$/;
// Production is pinned here, not only in config.json (ChatGPT build review 1, finding 3). Neon endpoint ids name one
// branch's compute, so the trial target can never be this endpoint.
export const PROD_ENDPOINT = 'ep-morning-hill-b4nfx1pk';
const NEON_HOST_RE = /^(ep-[a-z0-9-]+)(\.[a-z0-9-]+)*\.neon\.tech$/;
const ISO_UTC_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}(:[0-9]{2}(\.[0-9]+)?)?Z$/;
// Time limits for the import session (ChatGPT build review 1, finding 6)
const TIMEOUTS = { lockMs: 120000, statementMs: 300000, idleMs: 300000 };

export class Stop extends Error {}
const stop = msg => { throw new Stop(msg); };

// ---------------------------------------------------------------- file names
// <unit>__<run_id>[__<kind>[-N][-retry]].<ext>
export function parseFileName(name) {
  if (/ \([0-9]+\)\.[A-Za-z0-9]+$/.test(name)) stop(`${name} looks like a Drive copy ("(1)"); not imported`);
  const m = /^([A-Z0-9-]+)__([^_]+?)(?:__([a-z-]+?)(?:-([0-9]+))?(-retry)?)?\.(jsonl|md)$/.exec(name);
  if (!m) stop(`file name not understood: ${name}`);
  const [, unit, run_id, k, num, retryMark, ext] = m;
  if (!UNIT_RE.test(unit) || unit.startsWith('TAB-')) stop(`bad unit in file name: ${name}`);
  if (!RUN_RE.test(run_id)) stop(`bad run id in file name (only run-YYYYMMDDTHHMMSSZ is imported): ${name}`);
  let kind;
  if (!k) kind = ext === 'jsonl' ? 'packets' : 'notes';
  else if (ext !== 'md') kind = null;
  else if (k === 'sources' && !num) kind = 'sources';
  else if (k === 'skeptic' && num) kind = 'skeptic';
  else if (k === 'story-skeptic' && num) kind = 'story-skeptic';
  else if (['story-claims', 'story-fragments', 'story-notes'].includes(k) && !num) kind = k;
  if (!kind) stop(`unknown file kind (not allowed by the database): ${name}`);
  const retry = !!retryMark;
  if (retry && !['skeptic', 'story-skeptic'].includes(kind)) stop(`only skeptic files can be retries: ${name}`);
  return { unit, run_id, kind, retry };
}

// The database's own split (finish_import check 2): drop one final \n, split on \n, trim a trailing \r.
export function splitLines(content) {
  return content.replace(/\n$/, '').split('\n').map(x => x.replace(/\r$/, ''));
}

// ---------------------------------------------------------------- reading files
const hash = (algo, buf) => crypto.createHash(algo).update(buf).digest('hex');
function decodeChecked(buf, label) {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) stop(`${label} starts with a byte-order mark`);
  if (buf.includes(0)) stop(`${label} contains a NUL byte`);
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { stop(`${label} is not valid UTF-8`); }
  if (SECRETS.some(re => re.test(text))) stop(`${label} contains secret-like text; not imported (open it and check)`);
  return text;
}

function readRunFile(syncFolder, f) {
  const p = path.join(syncFolder, f.name);
  const ext = path.extname(f.name), base = f.name.slice(0, -ext.length);
  const siblings = fs.existsSync(syncFolder) ? fs.readdirSync(syncFolder) : [];
  if (siblings.some(s => s !== f.name && s.startsWith(base + ' (') && s.endsWith(ext))) stop(`${f.name} has a Drive copy beside it ("(1)"); fix the folder first`);
  if (!fs.existsSync(p)) stop(`${f.name} is missing from the Drive folder`);
  const buf = fs.readFileSync(p);
  if (hash('md5', buf) !== f.md5) stop(`${f.name}: md5 differs from the manifest. Drive may still be syncing; wait and run again`);
  const content = decodeChecked(buf, f.name);
  return { ...f, ...parseFileName(f.name), content, sha256: hash('sha256', buf) };
}

// Every file of this unit in the Drive folder must be in the manifest (ChatGPT build review 1, finding 1).
// The folder is filled by Drive for desktop, so it is a second listing, made apart from Claude's manifest.
function checkInventory(syncFolder, m) {
  if (!fs.existsSync(syncFolder)) stop(`Drive folder not found: ${syncFolder}`);
  const listed = new Set(m.files.map(f => f.name));
  const extra = fs.readdirSync(syncFolder).filter(n => n.startsWith(m.unit + '__') && !listed.has(n)).sort();
  if (extra.length) stop(`${extra.length} ${m.unit} file(s) in the Drive folder are not in the manifest: ${extra.slice(0, 5).join(', ')}${extra.length > 5 ? ', ...' : ''}. Ask Claude to prepare the import again`);
}

// Packet columns from one jsonl line. The line itself is stored as sent (cast to jsonb in SQL, never re-stringified).
const GRADES = new Set(['A', 'B', 'C']);
const SKEPTIC = new Set(['none', 'downgraded', 'dropped']);
function packetColumns(line, file, n) {
  let j;
  try { j = JSON.parse(line); } catch { stop(`${file.name} line ${n} is not JSON`); }
  if (!j || typeof j !== 'object' || Array.isArray(j)) stop(`${file.name} line ${n} is not a JSON object`);
  if (typeof j.candidate_id !== 'string') stop(`${file.name} line ${n} has no candidate_id`);
  if (!j.candidate_id.startsWith(file.unit.toLowerCase() + '-')) stop(`${file.name} line ${n}: candidate ${j.candidate_id} does not belong to ${file.unit}`);
  let disposition_final = null, skeptic_changed = null;
  if (GRADES.has(j.disposition)) disposition_final = j.disposition;
  else if (j.disposition === 'dropped') skeptic_changed = 'dropped';
  else stop(`${file.name} line ${n}: unknown disposition ${JSON.stringify(j.disposition)}`);
  if (j.skeptic && typeof j.skeptic === 'object' && j.skeptic.changed != null) {
    if (!SKEPTIC.has(j.skeptic.changed)) stop(`${file.name} line ${n}: unknown skeptic.changed ${JSON.stringify(j.skeptic.changed)}`);
    if (skeptic_changed === 'dropped' && j.skeptic.changed !== 'dropped') stop(`${file.name} line ${n}: dropped, but skeptic says ${j.skeptic.changed}`);
    skeptic_changed = j.skeptic.changed;
  }
  const place_id_db = j.place_id == null ? null : 'nyc-' + j.place_id;
  return { line, line_no: n, candidate_id: j.candidate_id, place_id_db, disposition_final, skeptic_changed };
}

// ---------------------------------------------------------------- tabs
export function readTab(buf, tab) {
  const text = decodeChecked(buf, `${tab}.csv`);
  let recs;
  try { recs = parseCsv(text, { bom: false, relax_column_count: false, skip_empty_lines: false }); }
  catch (e) { stop(`${tab}.csv could not be read as CSV: ${e.message}`); }
  if (!recs.length) stop(`${tab}.csv is empty`);
  const headers = recs[0];
  if (new Set(headers).size !== headers.length) stop(`${tab}.csv has duplicate headers`);
  if (headers.some(h => h.trim() === '')) stop(`${tab}.csv has a blank header`);
  if (JSON.stringify(headers) !== JSON.stringify(TAB_HEADERS[tab])) stop(`${tab}.csv headers differ from the fixed list; nothing imported`);
  const { col, re } = TAB_KEY[tab];
  const rows = [], seen = new Set();
  recs.slice(1).forEach((cells, i) => {
    const sheet_row = i + 2;
    if (cells.every(c => c === '')) return;              // fully blank row
    const key = cells[headers.indexOf(col)];
    if (!key || !key.trim()) stop(`${tab} row ${sheet_row} has cells but no ${col}; fix the sheet`);
    if (!re.test(key)) stop(`${tab} row ${sheet_row}: bad ${col} ${JSON.stringify(key)}`);
    if (seen.has(key)) stop(`${tab}: ${key} appears twice`);
    seen.add(key);
    const raw = {}; headers.forEach((h, k) => { raw[h] = cells[k] ?? ''; });
    rows.push({ key, sheet_row, raw: JSON.stringify(raw) });
  });
  return { headers, rows };
}

// ---------------------------------------------------------------- manifest
export function findManifest(importsRoot) {
  if (!fs.existsSync(importsRoot)) stop(`imports folder not found: ${importsRoot}`);
  const found = [];
  for (const d of fs.readdirSync(importsRoot)) {
    const p = path.join(importsRoot, d, 'manifest.json');
    if (fs.existsSync(p)) {
      let m; try { m = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { stop(`${p} is not valid JSON`); }
      found.push({ dir: path.join(importsRoot, d), m });
    }
  }
  if (!found.length) stop('no manifest found; ask Claude to prepare the import');
  found.sort((a, b) => String(b.m.created_utc).localeCompare(String(a.m.created_utc)));
  return found[0];
}
function checkManifest(m) {
  const t = Date.parse(m.created_utc);
  if (!Number.isFinite(t)) stop('manifest has no valid created_utc');
  if (Date.now() - t > MAX_MANIFEST_AGE_MS) stop('manifest is older than 24 hours; ask Claude to prepare it again');
  if (Date.now() - t < -5 * 60 * 1000) stop('manifest created_utc is in the future');
  if (m.city !== 'nyc') stop(`unexpected city ${m.city}`);
  if (!UNIT_RE.test(m.unit ?? '')) stop(`bad unit ${m.unit}`);
  if (m.unit.startsWith('TAB-')) {
    if (m.tab !== m.unit.slice(4) || !TAB_HEADERS[m.tab]) stop('manifest tab does not match its unit');
    if (!/^[0-9a-f]{64}$/.test(m.csv_sha256 ?? '')) stop('manifest has no csv_sha256');
    if (!m.csv || path.basename(m.csv) !== m.csv) stop('manifest csv must be a plain file name');
    // when the sheet was read: required, real UTC, not in the future, not after the manifest (finding 5)
    const s = typeof m.sheet_read_utc === 'string' && ISO_UTC_RE.test(m.sheet_read_utc) ? Date.parse(m.sheet_read_utc) : NaN;
    if (!Number.isFinite(s)) stop('manifest sheet_read_utc is missing or not a UTC time (YYYY-MM-DDTHH:MM:SSZ)');
    if (s > Date.now() + 5 * 60 * 1000 || s > t + 5 * 60 * 1000) stop('manifest sheet_read_utc is in the future or after the manifest was made');
    if (t - s > MAX_MANIFEST_AGE_MS) stop('manifest sheet_read_utc is more than 24 hours before the manifest');
  } else {
    if (!Array.isArray(m.files) || !m.files.length) stop('manifest lists no files');
    const names = new Set(), ids = new Set();
    for (const f of m.files) {
      if (names.has(f.name)) stop(`manifest lists ${f.name} twice`);
      if (typeof f.drive_id !== 'string' || !DRIVE_ID_RE.test(f.drive_id)) stop(`manifest has a blank or malformed Drive id for ${f.name}`);
      if (ids.has(f.drive_id)) stop(`manifest lists Drive id ${f.drive_id} twice`);
      names.add(f.name); ids.add(f.drive_id);
      if (!/^[0-9a-f]{32}$/.test(f.md5 ?? '')) stop(`manifest md5 missing for ${f.name}`);
      if (!Number.isFinite(Date.parse(f.modified_utc))) stop(`manifest modified_utc missing for ${f.name}`);
      if (path.basename(f.name) !== f.name) stop(`bad file name ${f.name}`);
      if (parseFileName(f.name).unit !== m.unit) stop(`${f.name} is not a ${m.unit} file`);
    }
  }
}

// ---------------------------------------------------------------- connection
function connectionFor(config, target, password) {
  const targets = config.targets ?? {};
  if (!['try', 'prod'].includes(target) || !targets[target]) stop(`unknown target ${target} (use try or prod)`);
  const hTry = targets.try?.host, hProd = targets.prod?.host;
  if (!hTry || !hProd || hTry === hProd) stop('config hosts for try and prod must both be set and differ');
  // Neon endpoint id = first label of the host; a pooled name ("-pooler") reaches the same database (review 1, finding 7)
  const endpoint = h => h.toLowerCase().split('.')[0].replace(/-pooler$/, '');
  if ([hTry, hProd].some(h => /-pooler\./i.test(h))) stop('config uses a pooled host (-pooler); use the direct host');
  if (endpoint(hTry) === endpoint(hProd)) stop('config try and prod hosts are the same Neon endpoint');
  // Only Neon hosts (both) or local test hosts (both). Production must be the pinned endpoint; the trial never is.
  const isLocal = h => h.startsWith('/') || ['localhost', '127.0.0.1'].includes(h);
  if (!(isLocal(hTry) && isLocal(hProd))) {
    if (![hTry, hProd].every(h => NEON_HOST_RE.test(h.toLowerCase()))) stop('config hosts must both be Neon endpoints (ep-....neon.tech)');
    if (endpoint(hProd) !== PROD_ENDPOINT) stop(`config prod host is not the production endpoint ${PROD_ENDPOINT}`);
    if (endpoint(hTry) === PROD_ENDPOINT) stop('config try host is the production endpoint; the trial must never write to production');
  }
  if (!password) stop('password not found: set NYC_IMPORT_PW in Windows environment variables, then open a new window');
  const t = targets[target];
  const local = isLocal(t.host);
  if (t.ssl === false && !local) stop('ssl may be off only for a local test database');
  return { host: t.host, port: t.port ?? 5432, database: t.database, user: config.user, password,
           ssl: t.ssl === false ? false : { rejectUnauthorized: true }, application_name: 'nyc-importer',
           connectionTimeoutMillis: 30000 };
}

// ---------------------------------------------------------------- the import
export async function runImport({ config, target, password, quiet = false, confirmUnit, afterBegin, beforeCommit, log: logFn, timeouts }) {
  const lim = { ...TIMEOUTS, ...(timeouts ?? {}) };
  const started = Date.now();
  const say = s => { if (!quiet) (logFn ?? console.log)(s); };
  let dir = null, m = null, client = null, batchId = null;
  const finish = (status, extra = {}) => {
    const res = { status, target, unit: m?.unit, batchId, minutes: +((Date.now() - started) / 60000).toFixed(1), ...extra };
    if (dir) {
      const line = [new Date().toISOString(), `unit=${m?.unit}`, `target=${target}`, `batch=${batchId ?? '-'}`,
        status === 'PASS' ? `PASS ${JSON.stringify(extra.counts)}` : status === 'NOTHING_NEW' ? 'PASS NOTHING NEW (nothing kept)' : `${status} ${extra.error}`,
        `minutes=${res.minutes}`].join(' ');
      try { fs.appendFileSync(path.join(dir, 'import-log.txt'), line + '\n'); } catch { /* log is best-effort */ }
    }
    return res;
  };
  try {
    const conn = connectionFor(config, target, password);
    ({ dir, m } = findManifest(config.importsRoot));
    checkManifest(m);
    say(`Unit ${m.unit} -> ${target === 'prod' ? 'PRODUCTION' : 'import-try (trial)'}`);
    if (target === 'prod') {
      const typed = confirmUnit ? await confirmUnit(m.unit) : null;
      if ((typed ?? '').trim() !== m.unit) stop(`typed unit did not match ${m.unit}; nothing imported`);
    }

    // ---- read everything before touching the database
    let files = [], tab = null;
    if (m.unit.startsWith('TAB-')) {
      const buf = fs.readFileSync(path.join(dir, m.csv));
      if (hash('sha256', buf) !== m.csv_sha256) stop(`${m.csv}: sha256 differs from the manifest; ask Claude to prepare the import again`);
      tab = { name: m.tab, ...readTab(buf, m.tab) };
    } else {
      files = m.files.map(f => readRunFile(config.syncFolder, f));
      checkInventory(config.syncFolder, m);
      for (const f of files.filter(x => x.kind === 'packets')) {
        f.lines = splitLines(f.content);
        if (f.lines.some(x => x.trim() === '')) stop(`${f.name} has a blank line`);
        f.packets = f.lines.map((l, i) => packetColumns(l, f, i + 1));
        const c = new Set();
        for (const p of f.packets) { if (c.has(p.candidate_id)) stop(`${f.name}: ${p.candidate_id} appears twice`); c.add(p.candidate_id); }
      }
      const runs = files.filter(f => f.kind === 'packets').map(f => f.run_id);
      if (new Set(runs).size !== runs.length) stop('two packets files share one run id');
      files.sort((a, b) => a.run_id.localeCompare(b.run_id) || a.name.localeCompare(b.name));
    }

    const inputs = tab
      ? { tabs: { [tab.name]: tab.rows.map(r => r.key) }, headers: { [tab.name]: tab.headers }, csv_sha256: m.csv_sha256 }
      : { files: Object.fromEntries(files.map(f => [f.drive_id, { sha256: f.sha256, md5: f.md5, ...(f.lines ? { lines: f.lines.length } : {}) }])) };

    // ---- one transaction
    client = new pg.Client(conn);
    // a dropped connection must surface as a failed query, not crash the process
    client.on('error', e => say(`connection error: ${e.message}`));
    await client.connect();
    const who = (await client.query(`SELECT current_user::text cu, session_user::text su,
        EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members WHERE member = current_user::regrole) member_of_any,
        (SELECT rolsuper OR rolcreaterole OR rolcreatedb OR rolbypassrls FROM pg_catalog.pg_roles WHERE rolname = current_user) admin`)).rows[0];
    if (who.cu !== 'importer' || who.su !== 'importer' || who.member_of_any || who.admin) stop('not logged in as the limited importer role; stopping');
    // bounded waits: a held import lock or a stalled statement fails cleanly instead of hanging (finding 6)
    await client.query(`SET lock_timeout = ${+lim.lockMs}; SET statement_timeout = ${+lim.statementMs}; SET idle_in_transaction_session_timeout = ${+lim.idleMs}`);
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    batchId = (await client.query('SELECT research.begin_import($1, $2, $3::jsonb, $4) AS b',
      [m.city, m.unit, JSON.stringify(inputs), tab ? m.sheet_read_utc : null])).rows[0].b;
    // begin_import holds the import lock until COMMIT: every check below sees all earlier imports.
    if (afterBegin) await afterBegin(client);

    let wrote;
    if (tab) wrote = await writeTab(client, batchId, m, tab);
    else wrote = await writeFiles(client, batchId, m, files);
    if (!wrote) {
      await client.query('ROLLBACK');
      say('Nothing new to import; nothing kept.');
      batchId = null;
      return finish('NOTHING_NEW');
    }
    await readBack(client, batchId, tab, files);
    const counts = (await client.query('SELECT research.finish_import($1) AS c', [batchId])).rows[0].c;
    if (beforeCommit) await beforeCommit(client);
    try {
      await client.query('COMMIT');
    } catch (e) {
      // The server may or may not have committed: never report this as "nothing kept" (review 1, finding 5)
      const msg = `COMMIT did not confirm (${e.message}); batch ${batchId} may or may not be saved. Claude must check the database before anything else`;
      say(`UNKNOWN: ${msg}`);
      return finish('UNKNOWN', { error: msg });
    }
    say(`PASS: batch ${batchId} ${JSON.stringify(counts)}`);
    return finish('PASS', { counts });
  } catch (e) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    const msg = e instanceof Stop ? e.message
      : e.code === '55P03' ? `another import is running (waited ${Math.round(lim.lockMs / 1000)} s for the import lock); nothing kept, run again later`
      : e.code === '57014' ? `the database took too long (over ${Math.round(lim.statementMs / 1000)} s for one step); nothing kept`
      : e.code === '25P03' ? 'the session sat idle too long inside the import; nothing kept'
      : `${e.message}${e.code ? ` (${e.code})` : ''}`;
    say(`FAILED: ${msg}`);
    const kept = batchId; batchId = null;
    return finish('FAIL', { error: msg, rolledBackBatch: kept });
  } finally {
    if (client) await client.end().catch(() => {});
  }
}

async function writeFiles(client, b, m, files) {
  // stored copies of these Drive ids
  const stored = new Map((await client.query(
    'SELECT drive_file_id, sha256 FROM research.run_file WHERE drive_file_id = ANY($1)', [files.map(f => f.drive_id)])).rows
    .map(r => [r.drive_file_id, r.sha256]));
  const fresh = [];
  for (const f of files) {
    if (!stored.has(f.drive_id)) fresh.push(f);
    else if (stored.get(f.drive_id) !== f.sha256) stop(`${f.name} changed since it was imported (run files are written once); Stephen decides`);
  }
  if (!fresh.length) return false;

  // no stored live copy may come from a newer run
  for (const f of fresh.filter(x => x.kind === 'packets')) {
    const r = await client.query(`SELECT candidate_id, run_id FROM research.packet
        WHERE city_id = $1 AND candidate_id = ANY($2) AND review_state IN ('pending','promoted')`,
      [m.city, f.packets.map(p => p.candidate_id)]);
    for (const row of r.rows) {
      if (row.run_id > f.run_id) stop(`${row.candidate_id}: a newer run (${row.run_id}) is already stored than ${f.run_id}`);
      if (row.run_id === f.run_id) stop(`${row.candidate_id}: same run ${f.run_id} already stored`);
    }
  }

  const ids = new Map();
  for (const f of fresh) {
    const r = await client.query(`INSERT INTO research.run_file (city_id, run_id, unit_id, kind, drive_file_id, content, import_batch_id,
        file_name, retry, drive_md5, drive_revision, drive_modified_utc, sha256)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING run_file_id`,
      [m.city, f.run_id, f.unit, f.kind, f.drive_id, f.content, b, f.name, f.retry, f.md5, f.revision ?? null, f.modified_utc, f.sha256]);
    ids.set(f.drive_id, r.rows[0].run_file_id);
  }
  // oldest run first: supersede the live copy FIRST, then insert (the one-live-copy index is not deferrable)
  for (const f of fresh.filter(x => x.kind === 'packets')) {
    for (const p of f.packets) {
      await client.query(`UPDATE research.packet SET review_state = 'superseded', superseded_by_batch_id = $1
          WHERE city_id = $2 AND candidate_id = $3 AND review_state = 'pending'`, [b, m.city, p.candidate_id]);
      await client.query(`INSERT INTO research.packet (city_id, candidate_id, unit_id, run_id, drive_file_id, packet, import_batch_id,
          run_file_id, line_no, place_id_db, disposition_final, skeptic_changed)
        VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12)`,
        [m.city, p.candidate_id, f.unit, f.run_id, f.drive_id, p.line, b, ids.get(f.drive_id), p.line_no,
         p.place_id_db, p.disposition_final, p.skeptic_changed]);
    }
  }
  files.fresh = fresh;
  return true;
}

async function writeTab(client, b, m, tab) {
  const live = new Map((await client.query(`SELECT row_key, sheet_row FROM research.tab_row WHERE city_id = $1 AND tab = $2 AND live`,
    [m.city, tab.name])).rows.map(r => [r.row_key, r.sheet_row]));
  let changed = 0;
  const toInsert = [];
  for (const r of tab.rows) {
    if (live.has(r.key)) {
      const same = (await client.query(`SELECT row_raw = $4::jsonb AND sheet_row = $5 AS same FROM research.tab_row
          WHERE city_id = $1 AND tab = $2 AND row_key = $3 AND live`, [m.city, tab.name, r.key, r.raw, r.sheet_row])).rows[0].same;
      if (same) continue;
      await client.query(`UPDATE research.tab_row SET live = false, superseded_by_batch_id = $1
          WHERE city_id = $2 AND tab = $3 AND row_key = $4 AND live`, [b, m.city, tab.name, r.key]);
    }
    toInsert.push(r);
  }
  const keys = new Set(tab.rows.map(r => r.key));
  for (const k of live.keys()) {
    if (keys.has(k)) continue;
    await client.query(`UPDATE research.tab_row SET live = false, removed_from_tab = true, superseded_by_batch_id = $1
        WHERE city_id = $2 AND tab = $3 AND row_key = $4 AND live`, [b, m.city, tab.name, k]);
    changed++;
  }
  for (const r of toInsert) {
    await client.query(`INSERT INTO research.tab_row (city_id, import_batch_id, tab, row_key, sheet_row, row_raw)
        VALUES ($1,$2,$3,$4,$5,$6::jsonb)`, [m.city, b, tab.name, r.key, r.sheet_row, r.raw]);
  }
  tab.inserted = toInsert;
  return toInsert.length + changed > 0;
}

// Read back every row written and compare it with what was read from disk.
async function readBack(client, b, tab, files) {
  if (tab) {
    const want = tab.inserted.map(r => ({ k: r.key, s: r.sheet_row, raw: r.raw }));
    const r = (await client.query(`SELECT
        (SELECT count(*) FROM research.tab_row WHERE import_batch_id = $1)::int AS n,
        (SELECT count(*) FROM jsonb_to_recordset($2::jsonb) AS x(k text, s int, raw text)
           JOIN research.tab_row t ON t.import_batch_id = $1 AND t.row_key = x.k AND t.sheet_row = x.s AND t.row_raw = x.raw::jsonb)::int AS ok`,
      [b, JSON.stringify(want)])).rows[0];
    if (r.n !== want.length || r.ok !== want.length) stop(`read-back failed: ${r.ok} of ${want.length} tab rows match`);
    return;
  }
  const fresh = files.fresh;
  const rf = (await client.query('SELECT drive_file_id, content, sha256 FROM research.run_file WHERE import_batch_id = $1', [b])).rows;
  if (rf.length !== fresh.length) stop(`read-back failed: ${rf.length} run files stored, ${fresh.length} read`);
  const byId = new Map(fresh.map(f => [f.drive_id, f]));
  for (const row of rf) {
    const f = byId.get(row.drive_file_id);
    if (!f || row.content !== f.content || row.sha256 !== f.sha256) stop(`read-back failed for ${f?.name ?? row.drive_file_id}`);
  }
  const want = fresh.filter(f => f.kind === 'packets').flatMap(f => f.packets.map(p => ({ d: f.drive_id, n: p.line_no, line: p.line })));
  const r = (await client.query(`SELECT
      (SELECT count(*) FROM research.packet WHERE import_batch_id = $1)::int AS n,
      (SELECT count(*) FROM jsonb_to_recordset($2::jsonb) AS x(d text, n int, line text)
         JOIN research.packet p ON p.import_batch_id = $1 AND p.drive_file_id = x.d AND p.line_no = x.n AND p.packet = x.line::jsonb)::int AS ok`,
    [b, JSON.stringify(want)])).rows[0];
  if (r.n !== want.length || r.ok !== want.length) stop(`read-back failed: ${r.ok} of ${want.length} packets match`);
}
