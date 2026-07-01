import fs from 'node:fs';
import path from 'node:path';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

type Envelope = { format: 'ledgerflow-aes-256-gcm-v1'; iv: string; tag: string; ciphertext: string };

function keyFor(file: string) {
  const configured = process.env.AGENT_RUNTIME_ENCRYPTION_KEY;
  if (configured) return createHash('sha256').update(configured).digest();
  const keyFile = `${file}.key`;
  try { return Buffer.from(fs.readFileSync(keyFile, 'utf8').trim(), 'base64url'); }
  catch {
    const key = randomBytes(32);
    fs.mkdirSync(path.dirname(keyFile), { recursive: true });
    fs.writeFileSync(keyFile, key.toString('base64url'), { encoding: 'utf8', mode: 0o600 });
    return key;
  }
}

export async function readSecureJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.promises.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed?.format !== 'ledgerflow-aes-256-gcm-v1') return parsed as T;
    const envelope = parsed as Envelope;
    const decipher = createDecipheriv('aes-256-gcm', keyFor(file), Buffer.from(envelope.iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64url'));
    const plain = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64url')), decipher.final()]);
    return JSON.parse(plain.toString('utf8')) as T;
  } catch (error: any) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function writeSecureJson(file: string, value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFor(file), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const envelope: Envelope = { format: 'ledgerflow-aes-256-gcm-v1', iv: iv.toString('base64url'), tag: cipher.getAuthTag().toString('base64url'), ciphertext: ciphertext.toString('base64url') };
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  try {
    await fs.promises.writeFile(temp, JSON.stringify(envelope), 'utf8');
    let lastError: unknown;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await fs.promises.rename(temp, file);
        lastError = undefined;
        break;
      } catch (error: any) {
        lastError = error;
        if (!(error?.code === 'EPERM' || error?.code === 'EBUSY') || attempt === 3) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
      }
    }
    if (lastError) throw lastError;
  }
  finally { await fs.promises.rm(temp, { force: true }).catch(() => undefined); }
}

