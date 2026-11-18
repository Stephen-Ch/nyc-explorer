#!/usr/bin/env node
// Plan 47 step 2: make the ONE signing key for the nightly door (kid export-1, RS256, 2048-bit RSA).
// Run by Stephen on his PC from the repo folder:   node tools/keys/keygen.mjs
// - writes the PUBLIC key to db/jwks/nyc-nightly.json (commit it; Neon fetches it by a commit-pinned raw GitHub URL)
// - prints the PRIVATE key ONCE, as one line, to paste into the export script's Script Property PRIVATE_KEY.
//   It is never written to disk. Close the window after pasting. Claude never sees it.
// Options: --repo <folder> (default: this repo), --replace (make a new key when the file exists: key change or leak).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const repo = path.resolve(opt('--repo') || path.join(import.meta.dirname, '../..'));
const file = path.join(repo, 'db/jwks/nyc-nightly.json');

if (fs.existsSync(file) && !args.includes('--replace')) {
  console.error(`${file} already exists. To make a new key (key change or leak), run again with --replace.`);
  process.exit(1);
}
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicExponent: 0x10001 });
const jwk = publicKey.export({ format: 'jwk' });
const jwks = { keys: [{ kty: jwk.kty, n: jwk.n, e: jwk.e, kid: 'export-1', alg: 'RS256', use: 'sig' }] };
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(jwks, null, 2) + '\n');
const priv = privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');

console.log(`Public key written: ${file}`);
console.log('Next: tell Claude it is done (Claude commits it). Then paste the line between the markers into the');
console.log('"NYC nightly export" project: Project Settings > Script Properties > PRIVATE_KEY. Then close this window.');
console.log('PRIVATE KEY START');
console.log(priv);
console.log('PRIVATE KEY END');
