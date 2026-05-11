import { Injectable } from '@angular/core';

const PBKDF2_ITERATIONS = 200_000;
const VERIFIER_PLAINTEXT = 'OOPS_VERIFIER_V1';

function b64encode(buf: ArrayBuffer): string {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64decode(s: string): ArrayBuffer {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

@Injectable({ providedIn: 'root' })
export class CryptoService {
  /** Generate random salt for new passphrase setup */
  newSalt(): string {
    const arr = crypto.getRandomValues(new Uint8Array(16));
    return b64encode(arr.buffer);
  }

  /** Derive AES-256-GCM key from passphrase + salt via PBKDF2 */
  async deriveKey(passphrase: string, saltB64: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const passKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: b64decode(saltB64),
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      passKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /** Encrypt plaintext with key — returns {ciphertext, iv} both base64 */
  async encrypt(key: CryptoKey, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext),
    );
    return { ciphertext: b64encode(ct), iv: b64encode(iv.buffer) };
  }

  /** Decrypt — returns plaintext string */
  async decrypt(key: CryptoKey, ciphertextB64: string, ivB64: string): Promise<string> {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64decode(ivB64) },
      key,
      b64decode(ciphertextB64),
    );
    return new TextDecoder().decode(pt);
  }

  /** Create verifier (encrypted known plaintext) at passphrase setup */
  async makeVerifier(key: CryptoKey): Promise<{ verifier: string; verifierIv: string }> {
    const { ciphertext, iv } = await this.encrypt(key, VERIFIER_PLAINTEXT);
    return { verifier: ciphertext, verifierIv: iv };
  }

  /** Check if a key matches the stored verifier — returns true if passphrase correct */
  async checkVerifier(key: CryptoKey, verifierB64: string, verifierIvB64: string): Promise<boolean> {
    try {
      const plain = await this.decrypt(key, verifierB64, verifierIvB64);
      return plain === VERIFIER_PLAINTEXT;
    } catch {
      return false;
    }
  }
}
