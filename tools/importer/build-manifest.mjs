// Plan 05 fix A (draft 2 rev 2) + plan 40 A: build manifest.json and drive-listing.json for one unit from
// the Apps Script listing (drive-listing-<UTC>.json) and the raw connector answer (connector-raw.json).
// Claude never types an md5: every md5, id and time comes from the listing file as Drive sent it.
// Usage: node build-manifest.mjs <unit> <listings dir> <connector-raw.json> <imports root>
import fs from 'node:fs';
import path from 'node:path';
import { parseFileName, OVERNIGHT_FOLDER_ID, Stop } from './lib.mjs';

export const EXPECT = {
  script_version: 'fixA-v2',
  folder_id: OVERNIGHT_FOLDER_ID,
  query: `'${OVERNIGHT_FOLDER_ID}' in parents and trashed = false`,
  fields: 'nextPageToken,incompleteSearch,files(id,name,md5Checksum,size,modifiedTime,mimeType,parents,trashed)',
  account: 'schurchville@gmail.com',
};
const MAX_LISTING_AGE_MS = 2 * 3600 * 1000;
const SETTLE_MS = 15 * 60 * 1000;
const stop = msg => { throw new Stop(msg); };
const readJson = (p, label) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { stop(`${label} is missing or not valid JSON`); } };

// connector-raw.json: { saved_utc, pages: [ <raw search_files answer with a files array>, ... ] }
function connectorIds(conn, unit) {
  const saved = Date.parse(conn?.saved_utc);
  if (!Number.isFinite(saved)) stop('connector-raw.json has no valid saved_utc');
  if (!Array.isArray(conn.pages) || !conn.pages.length) stop('connector-raw.json has no pages');
  const ids = new Map();
  for (const pg of conn.pages) {
    if (!Array.isArray(pg?.files)) stop('connector-raw.json: a page has no files list');
    for (const f of pg.files) {
      if (typeof f?.name !== 'string' || !f.name.startsWith(unit + '__')) continue;   // exact prefix, in code
      if (typeof f.id !== 'string') stop(`connector-raw.json: ${f.name} has no id`);
      if (ids.has(f.id) && ids.get(f.id) !== f.name) stop(`connector-raw.json: id ${f.id} has two names`);
      ids.set(f.id, f.name);
    }
  }
  return { saved, ids };
}

// the one listing made after the connector answer was saved
function pickListing(dir, saved) {
  if (!fs.existsSync(dir)) stop(`listings folder not found: ${dir}`);
  const all = fs.readdirSync(dir).filter(n => /^drive-listing-[0-9TZ]+\.json$/.test(n))
    .map(n => ({ n, L: readJson(path.join(dir, n), n) }));
  const newer = all.filter(x => Date.parse(x.L?.listed_utc) > saved);
  if (newer.length === 0) stop('no listing newer than connector-raw.json; Stephen runs the script after Claude saves it');
  if (newer.length > 1) stop(`${newer.length} listings are newer than connector-raw.json; only one may be`);
  return newer[0];
}

function checkListing(L, saved, now) {
  for (const k of Object.keys(EXPECT)) if (L[k] !== EXPECT[k]) stop(`listing ${k} is not the expected text`);
  const listed = Date.parse(L.listed_utc);
  if (!(listed > saved)) stop('listing listed_utc is not after connector-raw.json saved_utc');
  if (now - listed > MAX_LISTING_AGE_MS) stop('listing is more than 2 hours old; run the script again');
  if (listed > now + 5 * 60 * 1000) stop('listing listed_utc is in the future');
  if (L.next_page_token !== null) stop('listing next_page_token is not null');
  if (!Array.isArray(L.raw_pages) || L.page_count !== L.raw_pages.length) stop('listing page_count differs from raw_pages');
  const pages = L.raw_pages.map((t, i) => { try { return JSON.parse(t); } catch { stop(`listing raw page ${i + 1} is not JSON`); } });
  if (pages.at(-1)?.nextPageToken) stop('the last raw page still has a nextPageToken');
  if (pages.some(p => p.incompleteSearch)) stop('a raw page says the search was incomplete');
  const files = pages.flatMap(p => p.files ?? []);
  if (L.file_count !== files.length) stop(`listing file_count ${L.file_count} differs from ${files.length} files in raw_pages`);
  return { listed, files };
}

export function buildManifest({ unit, listingsDir, connectorPath, importsRoot, now = Date.now() }) {
  const conn = readJson(connectorPath, 'connector-raw.json');
  const { saved, ids: connIds } = connectorIds(conn, unit);
  const { n: listingName, L } = pickListing(listingsDir, saved);
  const { listed, files } = checkListing(L, saved, now);

  // only this unit's files (names starting exactly <unit>__); other files in the folder are ignored
  const unitFiles = files.filter(f => typeof f.name === 'string' && f.name.startsWith(unit + '__'));
  if (!unitFiles.length) stop(`the listing has no ${unit} files`);
  const names = new Set();
  for (const f of unitFiles) {
    if (names.has(f.name)) stop(`two files named ${f.name} on Drive; fix the folder first`);
    names.add(f.name);
    if (typeof f.mimeType === 'string' && f.mimeType.startsWith('application/vnd.google-apps.')) stop(`${f.name} is a Google ${f.mimeType.slice(28)}, not a file`);
    if (!/^[0-9a-f]{32}$/.test(f.md5Checksum ?? '')) stop(`${f.name} has no md5Checksum`);
    if (f.size == null || !/^[0-9]+$/.test(String(f.size))) stop(`${f.name} has no size`);
    if (f.trashed !== false || !Array.isArray(f.parents) || f.parents.length !== 1 || f.parents[0] !== OVERNIGHT_FOLDER_ID) stop(`${f.name} is trashed or not only in the overnight folder`);
    const mt = Date.parse(f.modifiedTime);
    if (!Number.isFinite(mt)) stop(`${f.name} has no modifiedTime`);
    if (mt > listed - SETTLE_MS) stop(`${f.name} changed less than 15 minutes before the listing; a run may still be writing`);
    const p = parseFileName(f.name);
    if (p.unit !== unit) stop(`${f.name} is not a ${unit} file`);
  }
  const listIds = new Set(unitFiles.map(f => f.id));
  const missing = [...listIds].filter(id => !connIds.has(id)), extra = [...connIds.keys()].filter(id => !listIds.has(id));
  if (missing.length || extra.length) stop(`connector and listing ${unit} ids differ (${missing.length} only in the listing, ${extra.length} only in the connector)`);
  // the name decides run identity and order, so each id must carry the same name in both (renamed in between: stop)
  const renamed = unitFiles.filter(f => connIds.get(f.id) !== f.name);
  if (renamed.length) stop(`connector and listing names differ for ${renamed.length} ${unit} file(s), e.g. ${renamed[0].name}; list again`);

  const created = new Date(now).toISOString();
  const dir = path.join(importsRoot, `${created.slice(0, 10)}-${unit}`);
  if (fs.existsSync(dir)) stop(`import folder ${dir} already exists; rename or remove it first`);
  fs.mkdirSync(dir, { recursive: true });
  const manifest = { created_utc: created, city: 'nyc', unit, listing_file: listingName,
    files: unitFiles.map(f => ({ name: f.name, drive_id: f.id, md5: f.md5Checksum, size: Number(f.size), modified_utc: f.modifiedTime, revision: null })) };
  const listing = { listed_utc: L.listed_utc, folder_id: L.folder_id, next_page_token: null,
    files: files.map(f => ({ id: f.id, name: f.name, md5Checksum: f.md5Checksum })) };
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(dir, 'drive-listing.json'), JSON.stringify(listing));
  fs.copyFileSync(path.join(listingsDir, listingName), path.join(dir, 'drive-listing-raw.json'));
  fs.copyFileSync(connectorPath, path.join(dir, 'connector-raw.json'));
  return { dir, files: unitFiles.length };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('build-manifest.mjs')) {
  const [, , unit, listingsDir, connectorPath, importsRoot] = process.argv;
  if (!unit || !importsRoot) { console.error('usage: node build-manifest.mjs <unit> <listings dir> <connector-raw.json> <imports root>'); process.exit(2); }
  try { const r = buildManifest({ unit, listingsDir, connectorPath, importsRoot }); console.log(`OK: ${r.files} files -> ${r.dir}`); }
  catch (e) { console.error(`STOP: ${e.message}`); process.exit(1); }
}
