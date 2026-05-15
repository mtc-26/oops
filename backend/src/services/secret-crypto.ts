import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGO = 'aes-256-gcm';

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const k = process.env.VAULT_MASTER_KEY;
  if (!k) {
    throw new Error('VAULT_MASTER_KEY env var is required for vault encryption');
  }
  if (k.length === 44) {
    cachedKey = Buffer.from(k, 'base64');
  } else if (k.length === 64 && /^[0-9a-f]+$/i.test(k)) {
    cachedKey = Buffer.from(k, 'hex');
  } else {
    cachedKey = scryptSync(k, 'oops-vault-salt-v1', 32);
  }
  return cachedKey;
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(packed: string): string {
  const buf = Buffer.from(packed, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
