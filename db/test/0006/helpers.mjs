// Shared helpers for the 0006 (plan 47 nightly door) SQL tests.
// Run ONLY on a throwaway local PostgreSQL 16+ server used for nothing else, with DB_TEST_ISOLATED=1:
// the tests create and drop the server-wide roles importer, nyc_door and nyc_loader, and create
// stand-ins for Neon's Data API roles (authenticator, anonymous, authenticated) if missing.
// Server needs: socket in DB_TEST_PGHOST (default /tmp), superuser DB_TEST_PGSUPER (default postgres), trust auth.
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

export const HOST = process.env.DB_TEST_PGHOST || '/tmp';
export const SUPER = process.env.DB_TEST_PGSUPER || 'postgres';
export const REPO = path.resolve(import.meta.dirname, '../../..');
const mig = f => fs.readFileSync(path.join(REPO, 'db/migrations', f), 'utf8');
export const BASE = ['0001_init.sql', '0002_before_import.sql', '0003_research_import.sql', '0004_importer_role.sql', '0005_import_build_40.sql'];
export const M6 = '0006_nightly_api.sql';
export const M6_DOWN = '0006_nightly_api.down.sql';
export const M7 = '0007_tonight_latest_bad.sql';
export const M7_DOWN = '0007_tonight_latest_bad.down.sql';
export const readMigration = mig;

export function requireIsolated() {
  if (process.env.DB_TEST_ISOLATED !== '1') throw new Error('set DB_TEST_ISOLATED=1, and only on a throwaway test server: these tests drop server-wide roles');
}

const ident = n => '"' + n.replace(/"/g, '""') + '"';
export async function q(db, sql, params, user = SUPER) {
  const c = new pg.Client({ host: HOST, user, database: db });
  await c.connect();
  try { return await c.query(sql, params); } finally { await c.end(); }
}

let n = 0;
const made = [];
export async function dropAll() {
  for (const d of made.splice(0)) await q('postgres', `DROP DATABASE IF EXISTS ${ident(d)} WITH (FORCE)`);
  for (const r of ['nyc_loader', 'nyc_door', 'importer']) await q('postgres', `DROP ROLE IF EXISTS ${r}`);
}
// Neon's Data API roles, made once per server (never dropped: Neon owns them, 0006 must not create them)
async function dataApiRoles() {
  await q('postgres', `DO $$BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN CREATE ROLE authenticator LOGIN NOINHERIT; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anonymous') THEN CREATE ROLE anonymous NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    GRANT anonymous TO authenticator; GRANT authenticated TO authenticator;
  END$$`);
}

// A fresh database with 0001-0005, and 0006 unless with6 is false; 0007 too when with7 is true.
export async function freshDb({ with6 = true, with7 = false } = {}) {
  await dropAll();
  await dataApiRoles();
  const name = `door_t_${process.pid}_${++n}`;
  await q('postgres', `CREATE DATABASE ${ident(name)}`);
  made.push(name);
  const c = new pg.Client({ host: HOST, user: SUPER, database: name });
  await c.connect();
  try {
    for (const f of BASE) await c.query(mig(f));
    if (with6) await c.query(mig(M6));
    if (with6 && with7) await c.query(mig(M7));
  } finally { await c.end(); }
  return name;
}
export async function cleanup() { await dropAll().catch(() => {}); }

// A session that looks like a Data API call: logged in as authenticator, switched to nyc_loader,
// Neon's 8 s statement_timeout, and the token claims PostgREST sets.
export async function loader(db, { timeout = '8s', sub = 'nightly-export', role = 'nyc_loader' } = {}) {
  const c = new pg.Client({ host: HOST, user: 'authenticator', database: db });
  await c.connect();
  await c.query(`SET statement_timeout = '${timeout}'`);
  await c.query(`SET ROLE ${role}`);
  await c.query(`SELECT set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub, role, aud: 'nyc-explorer-nightly' })]);
  return c;
}
export async function withLoader(db, fn, opts) {
  const c = await loader(db, opts);
  try { return await fn(c); } finally { await c.end(); }
}

// ---- payloads ----
// Exact header rows, read from the tracker Nov 18 2026 (Sheets connector), plus __urls columns (A1 section 6).
export const SHEET_HEADERS = {
  STORIES: ['story_id','tier (delight/record)','check_label','place','address','zone','index_place_id','story_date',
    'map_years (standing confirmed)','notable_name','hook (fresh wording)','original_source','original_link','original_quote',
    'pointer_source (modern, credit only)','skeptic_verdict','grade','new_vs_index_wiki','notes','added','run_id','skeptic_file'],
  DELIGHTS: ['delight_id','kind','year','event_date','report_date','paper','printed_page','image_no','loc_link','quote',
    'spot_as_printed','cross_streets','zone','map_point','interests','hook','grade','second_source','check_result','notes'],
  INDEX: ['candidate_id','place_id','name','address_in_year','cd','year','disposition','importance_suggested','unit_id','zone','interests','hold_reason'],
  STORY_TEXT: ['story_id','run_id','lead_id','story_text','date_note','style_check','followup_status'],
  PLACE_HOOKS: ['hook_id','era','fact_year','block','address','address_note','own_rule','building','hook','fragments','source_file',
    'lpc_report','checker_file','hook_ok','checked_utc','run_id','notes'],
  PEOPLE: ['person_id','kind','display_name','name_variants','born','died','roles','wikidata_qid','wikipedia_url','match_status',
    'match_evidence','checker_file','checked_utc','notes','links_json'],
  NAME_LINKS: ['link_id','person_id','item_type','item_id','name_in_hook','hook_text_at_link','role_in_item','year','era','run_id','notes'],
  NUMBER_MAP: ['map_id','street_printed','street_modern','segment','break_id','old_years','new_years','old_side','new_side','old_from',
    'old_to','rule','n','swap','chain_next','pairs_json','houses_traced','households','anchors_json','contradictions_json',
    'image_checked','test_households','atlas_check','lot_run_check','grade','status','checker_file','notes'],
};
export const LINK_COLUMNS = { STORIES: ['original_link', 'pointer_source (modern, credit only)'], DELIGHTS: ['loc_link'], PEOPLE: ['wikipedia_url'] };
export function headersFor(tab) {
  const out = [];
  for (const h of SHEET_HEADERS[tab]) { out.push(h); if ((LINK_COLUMNS[tab] || []).includes(h)) out.push(h + '__urls'); }
  return out;
}
export const TABS = Object.keys(SHEET_HEADERS);
const keyOf = {
  STORIES: i => ({ story_id: `ST${String(i).padStart(3, '0')}` }),
  DELIGHTS: i => ({ delight_id: `D${String(i).padStart(3, '0')}` }),
  INDEX: i => ({ candidate_id: `us-1877-place-${i}` }),
  STORY_TEXT: i => ({ story_id: `ST${String(i).padStart(3, '0')}`, run_id: 'run-20261116T141651Z' }),
  PLACE_HOOKS: i => ({ hook_id: `PH${String(i).padStart(4, '0')}`, run_id: 'plan42-pilot-20261117' }),
  PEOPLE: i => ({ person_id: `PE${String(i).padStart(4, '0')}` }),
  NAME_LINKS: i => ({ link_id: `NL${String(i).padStart(4, '0')}` }),
  NUMBER_MAP: i => ({ map_id: `E14-${i}` }),
};
// one row object (header -> text) for row i
export function rowObj(tab, i, extra = {}) {
  const o = {};
  for (const h of headersFor(tab)) o[h] = h.endsWith('__urls') ? '[]' : `${h} ${i}`;
  return { ...o, ...keyOf[tab](i), ...extra };
}
// payload rows: [{r: sheet row, c: [cells in header order]}]
export function payloadRows(tab, objs, headers = headersFor(tab)) {
  return objs.map((o, k) => ({ r: o.__r ?? k + 2, c: headers.map(h => o[h] ?? '') }));
}
export function rowsFor(tab, count, start = 1) {
  return payloadRows(tab, Array.from({ length: count }, (_, k) => rowObj(tab, start + k)));
}

// minutes relative to the database clock
export const ago = min => new Date(Date.now() - min * 60000).toISOString();
export async function nyDate(db) { return (await q(db, `SELECT ((now() AT TIME ZONE 'America/New_York')::date)::text d`)).rows[0].d; }

let copyN = 0;
// call put_tab as nyc_loader; returns the reply object
export async function putTab(c, { group, copy = `copy-${process.pid}-${++copyN}`, utc = ago(1), tab, headers, rows, version = 'test' }) {
  const r = await c.query(`SELECT api.put_tab($1::date, $2, $3::timestamptz, $4, $5, $6::jsonb, $7::jsonb) AS r`,
    [group, copy, utc, tab, version, JSON.stringify(headers ?? headersFor(tab)), JSON.stringify(rows)]);
  return { ...r.rows[0].r, copy };
}
export async function tonight(c) { return (await c.query('SELECT api.tonight() AS t')).rows[0].t; }
export async function recordResult(c, group, entries, version = 'test') {
  return (await c.query('SELECT api.record_result($1::date, $2::jsonb, $3) AS r', [group, JSON.stringify(entries), version])).rows[0].r;
}
export const tabStatus = (t, tab) => (t.tabs.find(x => x.tab === tab) || {}).status;
