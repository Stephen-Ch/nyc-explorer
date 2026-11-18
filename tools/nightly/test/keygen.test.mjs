// Plan 47 step 2: tools/keys/keygen.mjs makes one RS256 key pair, writes only the public key file, prints the private key once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const KEYGEN = path.resolve(import.meta.dirname, '../../keys/keygen.mjs');
const run = (args) => execFileSync(process.execPath, [KEYGEN, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

test('keygen writes one public key (export-1) and prints a private key that signs for it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'keygen-'));
  const out = run(['--repo', dir]);
  const file = path.join(dir, 'db/jwks/nyc-nightly.json');
  const jwks = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(jwks.keys.length, 1);
  const k = jwks.keys[0];
  assert.deepEqual(Object.keys(k).sort(), ['alg', 'e', 'kid', 'kty', 'n', 'use']);
  assert.equal(k.kid, 'export-1'); assert.equal(k.alg, 'RS256'); assert.equal(k.use, 'sig'); assert.equal(k.kty, 'RSA');
  assert.ok(Buffer.from(k.n, 'base64url').length >= 256, 'at least 2048-bit');
  // the private key is printed once, as one line between markers, and never written to disk
  const m = /PRIVATE KEY START\n([A-Za-z0-9+/=]+)\nPRIVATE KEY END/.exec(out);
  assert.ok(m, out);
  const priv = crypto.createPrivateKey({ key: Buffer.from(m[1], 'base64'), format: 'der', type: 'pkcs8' });
  const sig = crypto.sign('RSA-SHA256', Buffer.from('x'), priv);
  assert.ok(crypto.verify('RSA-SHA256', Buffer.from('x'), crypto.createPublicKey({ key: k, format: 'jwk' }), sig));
  const all = fs.readdirSync(dir, { recursive: true }).map(String);
  for (const f of all) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isFile()) assert.ok(!fs.readFileSync(p, 'utf8').includes(m[1].slice(0, 40)), `private key found in ${f}`);
  }
  assert.ok(!/"d"\s*:/.test(fs.readFileSync(file, 'utf8')), 'no private part in the public file');
});

test('keygen refuses to replace an existing key file unless --replace is given', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'keygen-'));
  run(['--repo', dir]);
  const first = fs.readFileSync(path.join(dir, 'db/jwks/nyc-nightly.json'), 'utf8');
  assert.throws(() => run(['--repo', dir]), /already exists/);
  assert.equal(fs.readFileSync(path.join(dir, 'db/jwks/nyc-nightly.json'), 'utf8'), first);
  run(['--repo', dir, '--replace']);
  assert.notEqual(fs.readFileSync(path.join(dir, 'db/jwks/nyc-nightly.json'), 'utf8'), first);
});
