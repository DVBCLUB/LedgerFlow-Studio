import fs from 'node:fs';
import path from 'node:path';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

function secretFile() {
  return path.resolve(process.cwd(), process.env.LEDGERFLOW_SIGNING_SECRET_FILE || '.ledgerflow_signing_secret');
}

function signingKey() {
  const configured = process.env.LEDGERFLOW_APPROVAL_SIGNING_KEY;
  if (configured) return createHash('sha256').update(configured).digest();
  const file = secretFile();
  try { return Buffer.from(fs.readFileSync(file, 'utf8').trim(), 'base64url'); }
  catch {
    const key = randomBytes(32);
    fs.writeFileSync(file, key.toString('base64url'), { encoding: 'utf8', mode: 0o600 });
    return key;
  }
}

export function signRecord(value: unknown) {
  return createHmac('sha256', signingKey()).update(JSON.stringify(value)).digest('hex');
}

export function verifyRecord(value: unknown, signature: string) {
  const expected = Buffer.from(signRecord(value), 'hex');
  const received = Buffer.from(signature || '', 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

