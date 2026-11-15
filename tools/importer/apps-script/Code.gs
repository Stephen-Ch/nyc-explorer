// Plan 05 fix A (draft 2 rev 2): lists the overnight folder (every page, read twice) and saves the raw
// Drive answer to one new file in "NYC Explorer listings". Run by hand as schurchville@gmail.com.
const FOLDER_ID = '1FBC1-UVjPWVjPyRUX-nzY4HQiV3JOSoD';
const OUT_NAME = 'NYC Explorer listings';
const FIELDS = 'nextPageToken,incompleteSearch,files(id,name,md5Checksum,size,modifiedTime,mimeType,parents,trashed)';
const API = 'https://www.googleapis.com/drive/v3/files';
const VERSION = 'fixA-v2';

function call_(url, opt) {
  opt = opt || {};
  opt.headers = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
  opt.muteHttpExceptions = true;
  const r = UrlFetchApp.fetch(url, opt);
  if (r.getResponseCode() !== 200) throw new Error('Drive answered ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 300));
  return r.getContentText();
}

function listOvernight() {
  const listedUtc = new Date().toISOString();
  const q = "'" + FOLDER_ID + "' in parents and trashed = false";
  const a = readAll_(q), b2 = readAll_(q);
  // both reads must agree on every field the builder uses, not only id and md5
  const key = function (r) { return r.files.map(function (f) {
    return JSON.stringify([f.id, f.name, f.md5Checksum, f.size, f.modifiedTime, f.mimeType, f.parents, f.trashed]); }).sort().join('\n'); };
  if (key(a) !== key(b2)) throw new Error('folder changed while listing; run again in 15 minutes');
  if (!a.files.length) throw new Error('no files in the folder; tell Claude');
  const pages = a.pages, files = a.files;
  const out = { script_version: VERSION, folder_id: FOLDER_ID, query: q, fields: FIELDS, page_size: 1000, order_by: 'name',
    listed_utc: listedUtc, finished_utc: new Date().toISOString(),
    account: Session.getEffectiveUser().getEmail(), page_count: pages.length,
    file_count: files.length, next_page_token: null, raw_pages: pages };
  const outId = outFolder_();
  const name = 'drive-listing-' + listedUtc.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z') + '.json';
  const b = 'nycx' + Utilities.getUuid();
  const body = '--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'
    + JSON.stringify({ name: name, parents: [outId], mimeType: 'application/json' })
    + '\r\n--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'
    + JSON.stringify(out) + '\r\n--' + b + '--';
  const bytes = Utilities.newBlob(body).getBytes();
  if (bytes.length > 4500000) throw new Error('listing over 4.5 MB; tell Claude');
  const up = JSON.parse(call_('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size',
    { method: 'post', contentType: 'multipart/related; boundary=' + b, payload: bytes }));
  Logger.log('Saved ' + up.name + ' (' + up.size + ' bytes, ' + files.length + ' files, ' + pages.length + ' pages)');
}

function readAll_(q) {
  const pages = [], files = [];
  let token = null;
  do {
    let url = API + '?pageSize=1000&orderBy=name&spaces=drive&q=' + encodeURIComponent(q) + '&fields=' + encodeURIComponent(FIELDS);
    if (token) url += '&pageToken=' + encodeURIComponent(token);
    const text = call_(url);
    const page = JSON.parse(text);
    if (page.incompleteSearch) throw new Error('Drive says the list is incomplete; run again later');
    pages.push(text);
    (page.files || []).forEach(function (f) { files.push(f); });
    token = page.nextPageToken || null;
    if (pages.length > 50) throw new Error('over 50 pages; stopped');
  } while (token);
  return { pages: pages, files: files };
}

function outFolder_() {
  const q = "appProperties has { key='nycx' and value='listings' } and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  const found = JSON.parse(call_(API + '?q=' + encodeURIComponent(q) + '&fields=files(id)')).files || [];
  if (found.length > 1) throw new Error('two folders named ' + OUT_NAME + '; keep one');
  if (found.length === 1) return found[0].id;
  return JSON.parse(call_(API + '?fields=id', { method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ name: OUT_NAME, mimeType: 'application/vnd.google-apps.folder', appProperties: { nycx: 'listings' } }) })).id;
}
