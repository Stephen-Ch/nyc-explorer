// Double-click entry (via import-try.cmd / import-prod.cmd):  node import.mjs try|prod
// Reads the password only from the Windows user environment variable NYC_IMPORT_PW. Never prints it.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { runImport } from './lib.mjs';

const target = process.argv[2];
const config = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'config.json'), 'utf8'));
const confirmUnit = async unit => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(`\n  This writes to PRODUCTION.\n  Type the unit name (${unit}) and press Enter: `);
  } finally { rl.close(); }
};
const r = await runImport({ config, target, password: process.env.NYC_IMPORT_PW ?? '', confirmUnit });
console.log('');
console.log(r.status === 'FAIL' || r.status === 'UNKNOWN' ? `  ${r.status === 'FAIL' ? 'FAILED' : 'UNKNOWN'}: ${r.error}` : r.status === 'NOTHING_NEW' ? '  NOTHING NEW: nothing kept.' :
  `  DONE: batch ${r.batchId}, ${r.counts.run_files} files, ${r.counts.packets} packets, ${r.counts.tab_rows} tab rows (${r.minutes} min)`);
process.exitCode = r.status === 'UNKNOWN' ? 3 : r.status === 'FAIL' ? 1 : r.status === 'NOTHING_NEW' ? 2 : 0;
