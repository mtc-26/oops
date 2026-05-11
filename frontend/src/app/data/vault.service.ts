import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CryptoService } from './crypto.service';

export type VaultCategory =
  | 'social'
  | 'banking'
  | 'entertainment'
  | 'education'
  | 'books'
  | 'games'
  | 'other';

export interface VaultSecrets {
  username?: string;
  password?: string;
  pin?: string;
  qr?: string;
  other?: string;
}

export interface EncryptedEntry {
  id: string;
  systemName: string;
  category: VaultCategory;
  color: string;
  ciphertext: string;
  iv: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DecryptedEntry extends EncryptedEntry {
  secrets: VaultSecrets;
}

interface PassphraseState {
  set: boolean;
  salt: string | null;
  verifier: string | null;
  verifierIv: string | null;
}

@Injectable({ providedIn: 'root' })
export class VaultService {
  private http = inject(HttpClient);
  private cryptoSvc = inject(CryptoService);
  private base = '/api/vault';

  // In-memory only — never persisted
  private _key = signal<CryptoKey | null>(null);
  readonly unlocked = computed(() => this._key() !== null);

  // ─── Passphrase ──────────────────────────────────────────────────────
  getPassphraseState() {
    return firstValueFrom(this.http.get<PassphraseState>(`${this.base}/passphrase`));
  }

  async setupPassphrase(passphrase: string) {
    const salt = this.cryptoSvc.newSalt();
    const key = await this.cryptoSvc.deriveKey(passphrase, salt);
    const { verifier, verifierIv } = await this.cryptoSvc.makeVerifier(key);
    await firstValueFrom(
      this.http.post<{ ok: true }>(`${this.base}/passphrase/setup`, {
        salt,
        verifier,
        verifierIv,
      }),
    );
    this._key.set(key);
  }

  async unlock(passphrase: string): Promise<boolean> {
    const state = await this.getPassphraseState();
    if (!state.set || !state.salt || !state.verifier || !state.verifierIv) return false;
    const key = await this.cryptoSvc.deriveKey(passphrase, state.salt);
    const ok = await this.cryptoSvc.checkVerifier(key, state.verifier, state.verifierIv);
    if (ok) this._key.set(key);
    return ok;
  }

  lock() {
    this._key.set(null);
  }

  // ─── CRUD (key required) ────────────────────────────────────────────
  async list(category?: VaultCategory): Promise<DecryptedEntry[]> {
    const key = this._key();
    if (!key) throw new Error('vault is locked');
    const qs = category && category !== 'other' ? `?category=${category}` :
      category === 'other' ? '?category=other' : '';
    const res = await firstValueFrom(
      this.http.get<{ entries: EncryptedEntry[] }>(`${this.base}${qs}`),
    );
    const decrypted: DecryptedEntry[] = [];
    for (const e of res.entries) {
      try {
        const plain = await this.cryptoSvc.decrypt(key, e.ciphertext, e.iv);
        decrypted.push({ ...e, secrets: JSON.parse(plain) as VaultSecrets });
      } catch {
        decrypted.push({ ...e, secrets: {} }); // skip undecryptable
      }
    }
    return decrypted;
  }

  async get(id: string): Promise<DecryptedEntry> {
    const key = this._key();
    if (!key) throw new Error('vault is locked');
    const e = await firstValueFrom(this.http.get<EncryptedEntry>(`${this.base}/${id}`));
    const plain = await this.cryptoSvc.decrypt(key, e.ciphertext, e.iv);
    return { ...e, secrets: JSON.parse(plain) as VaultSecrets };
  }

  async create(input: {
    systemName: string;
    category: VaultCategory;
    color?: string;
    secrets: VaultSecrets;
  }): Promise<string> {
    const key = this._key();
    if (!key) throw new Error('vault is locked');
    const { ciphertext, iv } = await this.cryptoSvc.encrypt(key, JSON.stringify(input.secrets));
    const res = await firstValueFrom(
      this.http.post<{ id: string }>(`${this.base}`, {
        systemName: input.systemName,
        category: input.category,
        color: input.color,
        ciphertext,
        iv,
      }),
    );
    return res.id;
  }

  async update(
    id: string,
    input: { systemName?: string; category?: VaultCategory; color?: string; secrets?: VaultSecrets },
  ) {
    const key = this._key();
    if (!key) throw new Error('vault is locked');
    const body: any = {
      systemName: input.systemName,
      category: input.category,
      color: input.color,
    };
    if (input.secrets) {
      const { ciphertext, iv } = await this.cryptoSvc.encrypt(key, JSON.stringify(input.secrets));
      body.ciphertext = ciphertext;
      body.iv = iv;
    }
    await firstValueFrom(this.http.put<{ ok: true }>(`${this.base}/${id}`, body));
  }

  async delete(id: string) {
    await firstValueFrom(this.http.delete<{ ok: true }>(`${this.base}/${id}`));
  }
}
