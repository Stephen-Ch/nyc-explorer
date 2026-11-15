// Tests for the manifest builder (plan 05 fix A + plan 40 A). No database.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildManifest, EXPECT } from '../build-manifest.mjs';
import { checkManifest, checkDriveListing } from '../lib.mjs';

const F = EXPECT.folder_id;
const NOW = Date.parse('2026-11-16T12:00:00Z');
const SAVED = '2026-11-16T11:30:00Z', LISTED = '2026-11-16T11:40:00Z';
const md5 = c => c.repeat(32);
const file = (name, extra = {}) => ({ id: 'id' + name.replace(/[^A-Za-z0-9]/g, '').slice(-30).padStart(24, 'x'), name, md5Checksum: md5('a'), size: '12',
  modifiedTime: '2026-11-16T09:00:00.000Z', mimeType: 'text/markdown', parents: [F], trashed: false, ...extra });
const UF = [file('US-1852__run-20261104T050256Z.jsonl'), file('US-1852__run-20261104T050256Z.md'), file('US-1852__holds-20261116.jsonl')];
const OTHER = [file('US-1877__run-20261104T050256Z.jsonl'), file('nyc-decisions-20261116.md'), file('STORY-PLAN-v1.3.md')];

function world({ files = [...UF, ...OTHER], listing = {}, pages, conn, extraListings = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-'));
  const ld = path.join(root, 'listings'); fs.mkdirSync(ld);
  const imports = path.join(root, 'imports'); fs.mkdirSync(imports);
  const rawPages = pages ?? [JSON.stringify({ nextPageToken: 'p2', files: files.slice(0, 2) }), JSON.stringify({ files: files.slice(2) })];
  const L = { ...EXPECT, page_size: 1000, order_by: 'name', listed_utc: LISTED, finished_utc: LISTED, page_count: rawPages.length,
    file_count: files.length, next_page_token: null, raw_pages: rawPages, ...listing };
  fs.writeFileSync(path.join(ld, 'drive-listing-20261116T114000Z.json'), JSON.stringify(L));
  for (const [n, l] of extraListings) fs.writeFileSync(path.join(ld, n), JSON.stringify(l));
  const cp = path.join(root, 'connector-raw.json');
  fs.writeFileSync(cp, JSON.stringify(conn ?? { saved_utc: SAVED, pages: [{ files: files.map(f => ({ id: f.id, name: f.name })) }] }));
  return { unit: 'US-1852', listingsDir: ld, connectorPath: cp, importsRoot: imports, now: NOW };
}
const fails = (w, re) => assert.throws(() => buildManifest(w), re);

test('builder: a good listing gives a manifest and listing the importer accepts', () => {
  const w = world();
  const realNow = Date.now; Date.now = () => NOW;
  try {
    const r = buildManifest(w);
    assert.equal(r.files, 3);
    const m = JSON.parse(fs.readFileSync(path.join(r.dir, 'manifest.json'), 'utf8'));
    assert.deepEqual(m.files.map(f => f.name).sort(), UF.map(f => f.name).sort());
    assert.equal(m.files[0].md5, md5('a'));
    checkManifest(m);
    checkDriveListing(r.dir, m);
    for (const n of ['drive-listing-raw.json', 'connector-raw.json']) assert.ok(fs.existsSync(path.join(r.dir, n)));
  } finally { Date.now = realNow; }
});

test('builder: listing refusals', () => {
  fails(world({ listing: { listed_utc: '2026-11-16T11:00:00Z' } }), /no listing newer/);
  fails(world({ listing: { listed_utc: '2026-11-16T09:30:00Z', }, conn: { saved_utc: '2026-11-16T09:00:00Z', pages: [{ files: [...UF, ...OTHER].map(f => ({ id: f.id, name: f.name })) }] } }), /2 hours/);
  fails(world({ extraListings: [['drive-listing-20261116T115000Z.json', { listed_utc: '2026-11-16T11:50:00Z' }]] }), /only one/);
  fails(world({ listing: { file_count: 5 } }), /file_count/);
  for (const k of ['folder_id', 'query', 'fields', 'script_version', 'account']) fails(world({ listing: { [k]: 'other' } }), new RegExp(k));
  fails(world({ listing: { next_page_token: 'x' } }), /next_page_token/);
  fails(world({ listing: { page_count: 3 } }), /page_count/);
  fails(world({ pages: [JSON.stringify({ nextPageToken: 'more', files: [...UF, ...OTHER] })], listing: { page_count: 1 } }), /nextPageToken/);
});

test('builder: unit file refusals', () => {
  const swap = (i, extra) => { const fs2 = [...UF]; fs2[i] = { ...fs2[i], ...extra }; return [...fs2, ...OTHER]; };
  fails(world({ files: [...UF, { ...UF[0], id: 'idDUPLICATExxxxxxxxxxxxxxx' }, ...OTHER] }), /two files named/);
  fails(world({ files: swap(1, { md5Checksum: undefined }) }), /md5Checksum/);
  fails(world({ files: swap(1, { size: undefined }) }), /size/);
  fails(world({ files: swap(1, { mimeType: 'application/vnd.google-apps.shortcut' }) }), /Google/);
  fails(world({ files: swap(1, { name: 'US-1852__run-20261104T050256Z__gossip.md' }) }), /kind/);
  fails(world({ files: swap(1, { parents: ['other'] }) }), /overnight/);
  fails(world({ files: swap(1, { trashed: true }) }), /trashed/);
  fails(world({ files: swap(1, { modifiedTime: '2026-11-16T11:30:00Z' }) }), /15 minutes/);
});

test('builder: connector ids must equal the listing ids for the unit; other files are ignored', () => {
  const ids = fs2 => ({ saved_utc: SAVED, pages: [{ files: fs2.map(f => ({ id: f.id, name: f.name })) }] });
  fails(world({ conn: ids([UF[0], UF[1], ...OTHER]) }), /ids differ/);
  fails(world({ conn: ids([...UF, { id: 'idEXTRAxxxxxxxxxxxxxxxxxx', name: 'US-1852__run-20261105T000000Z.md' }]) }), /ids differ/);
  // a decisions file or another unit in the folder never stops the US-1852 build
  const w = world({ conn: ids(UF) });
  const realNow = Date.now; Date.now = () => NOW;
  try { assert.equal(buildManifest(w).files, 3); } finally { Date.now = realNow; }
  fails(world({ conn: { pages: [] } }), /saved_utc/);
  // same id, different name (renamed between the connector answer and the listing)
  fails(world({ conn: ids([UF[0], UF[1], { id: UF[2].id, name: 'US-1852__holds-20261117.jsonl' }]) }), /names differ|ids differ/);
});
