import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderPublic } from '../../shared/header-public/header-public';

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const passBuf = new TextEncoder().encode(passphrase);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passBuf as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

@Component({
  selector: 'app-aes-demo',
  imports: [FormsModule, HeaderPublic],
  templateUrl: './aes-demo.html',
  styleUrl: './aes-demo.scss',
})
export class AesDemo {
  // Encrypt panel
  encPass = signal('');
  encPlain = signal('');
  encSalt = signal('');
  encKeyHex = signal('');
  encIv = signal('');
  encTag = signal('');
  encCipher = signal('');
  encPacked = signal('');
  encError = signal<string | null>(null);

  // Decrypt panel
  decPass = signal('');
  decPacked = signal('');
  decKeyHex = signal('');
  decPlain = signal('');
  decError = signal<string | null>(null);

  async runEncrypt() {
    this.encError.set(null);
    if (!this.encPass() || !this.encPlain()) {
      this.encError.set('กรุณากรอก Passphrase และข้อความที่จะเข้ารหัส');
      return;
    }
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(this.encPass(), salt);
      const rawKey = await crypto.subtle.exportKey('raw', key);

      const plaintext = new TextEncoder().encode(this.encPlain());
      const ctWithTag = new Uint8Array(
        await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv as BufferSource },
          key,
          plaintext as BufferSource,
        ),
      );
      // AES-GCM result = ciphertext || authTag (last 16 bytes)
      const ciphertext = ctWithTag.slice(0, ctWithTag.length - 16);
      const tag = ctWithTag.slice(ctWithTag.length - 16);

      this.encSalt.set(toHex(salt));
      this.encKeyHex.set(toHex(rawKey));
      this.encIv.set(toHex(iv));
      this.encTag.set(toHex(tag));
      this.encCipher.set(toHex(ciphertext));

      // Pack as a single string the user can copy into the decrypt panel
      const packed = new Uint8Array(salt.length + iv.length + ctWithTag.length);
      packed.set(salt, 0);
      packed.set(iv, salt.length);
      packed.set(ctWithTag, salt.length + iv.length);
      this.encPacked.set(toBase64(packed));
    } catch (e: any) {
      this.encError.set(e?.message ?? 'Encryption error');
    }
  }

  async runDecrypt() {
    this.decError.set(null);
    this.decPlain.set('');
    if (!this.decPass() || !this.decPacked()) {
      this.decError.set('กรุณากรอก Passphrase และ Packed ciphertext');
      return;
    }
    try {
      const packed = fromBase64(this.decPacked().trim());
      if (packed.length < 16 + 12 + 16) throw new Error('Packed data ไม่ถูก format');
      const salt = packed.slice(0, 16);
      const iv = packed.slice(16, 28);
      const ctWithTag = packed.slice(28);
      const key = await deriveKey(this.decPass(), salt);
      const rawKey = await crypto.subtle.exportKey('raw', key);
      this.decKeyHex.set(toHex(rawKey));
      const ptBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        ctWithTag as BufferSource,
      );
      this.decPlain.set(new TextDecoder().decode(ptBuf));
    } catch (e: any) {
      this.decError.set(e?.message ?? 'Decryption error — passphrase ผิดหรือข้อมูลเสียหาย');
    }
  }

  copyPackedToDecrypt() {
    this.decPacked.set(this.encPacked());
  }
}
