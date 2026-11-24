// Fake Google Apps Script services and a fake clock, so export.gs and alarm.gs run under node:test.
// Each test makes a world, loads a .gs file into it, and calls the script's functions.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const DIR = path.resolve(import.meta.dirname, '..');
const toSigned = buf => Array.from(buf, b => (b > 127 ? b - 256 : b));
const toBuf = data => Buffer.isBuffer(data) ? data : Array.isArray(data) ? Buffer.from(data.map(b => (b + 256) % 256)) : Buffer.from(String(data), 'utf8');

// a cell: { v: shown text, f: formula ('' if none), links: [url or null per text run] }
export const cell = (v, extra = {}) => ({ v: String(v), f: '', links: [], ...extra });

function fakeRange(rows) {
  const w = Math.max(0, ...rows.map(r => r.length));
  const grid = rows.map(r => Array.from({ length: w }, (_, i) => r[i] || cell('')));
  return {
    getDisplayValues: () => grid.map(r => r.map(c => c.v)),
    getValues: () => grid.map(r => r.map(c => c.v)),
    getFormulas: () => grid.map(r => r.map(c => c.f || '')),
    getRichTextValues: () => grid.map(r => r.map(c => {
      const runs = (c.links.length ? c.links : [null]).map(u => ({ getLinkUrl: () => u, getText: () => c.v }));
      const distinct = [...new Set(c.links.filter(Boolean))];
      return { getRuns: () => runs, getText: () => c.v, getLinkUrl: () => (distinct.length === 1 && c.links.every(Boolean) ? distinct[0] : null) };
    })),
    getNumRows: () => grid.length, getNumColumns: () => w,
  };
}

export function makeWorld({ now = '2026-11-19T06:05:00Z', props = {}, email = 'schurchville@gmail.com' } = {}) {
  const clock = { t: Date.parse(now) };
  const world = {
    clock, calls: [], mail: [], logs: [], lockHeld: false, mailError: null, files: new Map(), nextId: 1,
    db: null,                         // (fn, body, world) -> { code, json } | { hang: true } | { code, text }
    callMs: 500,                      // time one answered web call takes
    props: { ...props }, email,
  };
  const FakeDate = class extends Date {
    constructor(...a) { if (a.length) super(...a); else super(clock.t); }
    static now() { return clock.t; }
  };

  // ---- spreadsheets and files ----
  function makeSpreadsheet(name, sheets = {}, owner = email) {
    const id = `file-${world.nextId++}`;
    const ss = {
      id, name, owner, trashed: false, created: clock.t, sheets: structuredClone(sheets),
      getId: () => id, getName: () => ss.name, isTrashed: () => ss.trashed, getDateCreated: () => new FakeDate(ss.created),
      getOwner: () => ({ getEmail: () => ss.owner }),
      setTrashed: v => { ss.trashed = !!v; world.logs.push(`trash ${id}`); },
      makeCopy: n => { const c = makeSpreadsheet(n, ss.sheets); world.logs.push(`copy ${id} -> ${c.id}`); return c; },
      getSheetByName: n => sheetApi(ss, n),
      insertSheet: n => { ss.sheets[n] = []; return sheetApi(ss, n); },
    };
    world.files.set(id, ss);
    return ss;
  }
  // like Sheets: text that looks like a date or number is retyped and shown differently, unless it starts with '
  function typed(v) {
    const t = String(v);
    if (t.startsWith("'")) return cell(t.slice(1));
    const d = /^(\d{4})-(\d{2})-(\d{2})(T(\d{2}):(\d{2}):(\d{2}).*)?$/.exec(t);
    if (d) return cell(`${+d[2]}/${+d[3]}/${d[1]}` + (d[4] ? ` ${+d[5]}:${d[6]}:${d[7]}` : ''));
    if (/^-?\d+(\.\d+)?$/.test(t)) return cell(String(Number(t)));
    return cell(t);
  }
  // a sheet has a size (rows x columns) like real Sheets: 1000 x 26 by default, or more if it already holds more.
  // appendRow grows it; getRange past it throws; insertRowsAfter adds rows (plan 47 finish S2: bulk verify writes).
  function sheetApi(ss, n) {
    if (!(n in ss.sheets)) return null;
    ss.size = ss.size || {};
    const size = ss.size[n] = ss.size[n] || { rows: Math.max(1000, ss.sheets[n].length), cols: 26 };
    return {
      getName: () => n,
      getDataRange: () => { clock.t += world.readMs || 0; return fakeRange(ss.sheets[n]); },
      getLastRow: () => ss.sheets[n].length,
      getMaxRows: () => size.rows,
      getMaxColumns: () => size.cols,
      insertRowsAfter: (after, count) => {
        if (after < 1 || after > size.rows || count < 1) throw new Error(`insertRowsAfter: bad arguments ${after}, ${count}`);
        size.rows += count; world.logs.push(`insertRowsAfter ${n} ${after} ${count}`);
      },
      appendRow: vals => {
        if (world.sheetError) throw new Error(world.sheetError);
        ss.sheets[n].push(vals.map(typed));
        size.rows = Math.max(size.rows, ss.sheets[n].length);
      },
      getRange: (row, col, numRows = 1, numCols = 1) => {
        if (row < 1 || col < 1 || numRows < 1 || numCols < 1 || row + numRows - 1 > size.rows || col + numCols - 1 > size.cols) {
          throw new Error('The coordinates of the range are outside the dimensions of the sheet.');
        }
        return {
          setValues: vals => {
            world.writes = world.writes || [];
            world.writes.push({ sheet: n, row, rows: vals.length, lockHeld: world.lockHeld, last: vals[vals.length - 1].map(String) });
            if (world.sheetError) throw new Error(world.sheetError);
            if (world.failWriteAt && world.writes.filter(x => x.sheet === n).length === world.failWriteAt) throw new Error('Service Spreadsheets failed');
            if (vals.length !== numRows || vals.some(r => r.length !== numCols)) throw new Error('The number of rows or columns in the data does not match the range.');
            if (numRows * numCols > 50000) throw new Error('TEST: over 50,000 cells in one write');
            const g = ss.sheets[n];
            while (g.length < row - 1) g.push([]);
            vals.forEach((r, i) => { g[row - 1 + i] = r.map(typed); });
          },
        };
      },
    };
  }
  world.makeSpreadsheet = makeSpreadsheet;
  const getFile = id => { const f = world.files.get(id); if (!f) throw new Error(`No item with the given ID could be found: ${id}`); return f; };

  const g = {
    Date: FakeDate, JSON, Math, Object, Array, String, Number, Error, RegExp, isNaN, parseInt, Intl, Set, Map,
    console: { log: (...a) => world.logs.push(a.join(' ')) },
    Logger: { log: (...a) => world.logs.push(a.join(' ')) },
    Session: { getEffectiveUser: () => ({ getEmail: () => world.email }), getScriptTimeZone: () => 'America/New_York' },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (k in world.props ? world.props[k] : null),
      setProperty: (k, v) => { world.props[k] = String(v); },
      deleteProperty: k => { delete world.props[k]; },
      getProperties: () => ({ ...world.props }),
    }) },
    LockService: { getScriptLock: () => ({
      tryLock: () => { if (world.lockHeld) return false; world.lockHeld = true; return true; },
      releaseLock: () => { world.lockHeld = false; },
    }) },
    Utilities: {
      Charset: { UTF_8: 'UTF-8' }, DigestAlgorithm: { SHA_256: 'SHA_256' },
      sleep: ms => { clock.t += ms; world.logs.push(`sleep ${ms}`); },
      getUuid: () => crypto.randomUUID(),
      formatDate: (d, tz, fmt) => {
        const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit',
          day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' }).formatToParts(new Date(d.getTime())).map(x => [x.type, x.value]));
        return fmt.replace(/'([^']*)'|yyyy|MM|dd|HH|H|mm|ss|EEE/g, (m, lit) => lit !== undefined ? lit
          : m === 'yyyy' ? p.year : m === 'MM' ? p.month : m === 'dd' ? p.day : m === 'HH' ? p.hour : m === 'H' ? String(+p.hour)
          : m === 'mm' ? p.minute : m === 'ss' ? p.second : p.weekday);
      },
      computeRsaSha256Signature: (input, key) => toSigned(crypto.sign('RSA-SHA256', toBuf(input), key)),
      computeDigest: (alg, data) => toSigned(crypto.createHash('sha256').update(toBuf(data)).digest()),
      base64EncodeWebSafe: data => toBuf(data).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
      newBlob: data => ({ getBytes: () => toSigned(toBuf(data)) }),
    },
    UrlFetchApp: {
      fetch: (url, opts) => {
        const fn = url.replace(/.*\/rpc\//, '');
        const call = { fn, url, opts, body: opts.payload ? JSON.parse(opts.payload) : null, at: clock.t };
        world.calls.push(call);
        if (typeof opts.timeoutSeconds !== 'number') throw new Error(`TEST: ${fn} called without timeoutSeconds`);
        const r = world.db ? world.db(fn, call.body, world, call) : { code: 500, text: 'no db' };
        if (r.hang) { clock.t += opts.timeoutSeconds * 1000; call.end = clock.t; throw new Error('Timeout: request timed out'); }
        clock.t += r.ms ?? world.callMs; call.end = clock.t;
        const text = r.text ?? JSON.stringify(r.json);
        return { getResponseCode: () => r.code, getContentText: () => text };
      },
    },
    DriveApp: {
      getFileById: id => getFile(id),
      searchFiles: q => {
        const m = /title contains "([^"]+)"/.exec(q);
        const list = [...world.files.values()].filter(f => !f.trashed && (!m || f.name.includes(m[1])));
        let i = 0; return { hasNext: () => i < list.length, next: () => list[i++] };
      },
    },
    SpreadsheetApp: { openById: id => { const f = getFile(id); return f; } },
    MailApp: { sendEmail: (...a) => {
      if (world.mailError) throw new Error(world.mailError);
      world.mail.push(typeof a[0] === 'object' ? a[0] : { to: a[0], subject: a[1], body: a[2] });
    } },
    // Sheets advanced service (verifyNow's separate read path): grid data like spreadsheets.get
    Sheets: { Spreadsheets: { get: (id, opts) => {
      const ss = getFile(id);
      return { sheets: opts.ranges.map(r => {
        const name = r.replace(/!.*/, '').replace(/^'|'$/g, '');
        const rows = ss.sheets[name] || [];
        return { properties: { title: name }, data: [{ rowData: rows.map(row => ({ values: row.map(c => {
          const v = { formattedValue: c.v === '' ? undefined : c.v };
          const hf = /^=HYPERLINK\("([^"]+)"/i.exec(c.f || '');
          if (hf) v.hyperlink = hf[1];
          if (c.f) v.userEnteredValue = { formulaValue: c.f };
          if (c.apiHyperlinkOnly) { v.hyperlink = c.links[0]; return v; }   // whole-cell link reported only as hyperlink
          if (c.links.some(Boolean)) v.textFormatRuns = c.links.map((u, k) => ({ startIndex: k, format: u ? { link: { uri: u } } : {} }));
          return v;
        }) })) }] };
      }) };
    } } },
  };
  world.global = g;
  return world;
}

// Load a .gs file into the world; returns the vm context (script functions are its properties).
export function load(world, file, replace = {}) {
  let src = fs.readFileSync(path.join(DIR, file), 'utf8');
  for (const [a, b] of Object.entries(replace)) src = src.replace(a, b);
  const ctx = vm.createContext({ ...world.global });
  vm.runInContext(src, ctx, { filename: file });
  return ctx;
}

// a tracker with the given tabs: { TAB: [[header cells], [row cells], ...] } (strings or cell objects)
export function tracker(world, tabs, name = 'NYC Explorer tracker') {
  const sheets = {};
  for (const [t, rows] of Object.entries(tabs)) sheets[t] = rows.map(r => r.map(c => (typeof c === 'string' ? cell(c) : c)));
  return world.makeSpreadsheet(name, sheets);
}

// RSA key pair for tests (PKCS#8 PEM private key, JWK public key)
export function testKeys() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { pem: privateKey.export({ type: 'pkcs8', format: 'pem' }), jwk: publicKey.export({ format: 'jwk' }),
           der64: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64') };
}
