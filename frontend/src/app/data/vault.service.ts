import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface VaultSecrets {
  username?: string;
  password?: string;
  pin?: string;
  qr?: string;
  other?: string;
}

interface SecretRow {
  id: string;
  name: string;
  value: string;
}

export interface VaultEntry {
  vid: string;
  systemID: string;
  systemName: string;
  secrets: VaultSecrets;
  createdAt?: string;
}

interface RawEntry {
  vid: string;
  systemID: string;
  systemName: string;
  secrets: SecretRow[];
  createdAt?: string;
}

function rowsToSecrets(rows: SecretRow[]): VaultSecrets {
  const out: VaultSecrets = {};
  for (const r of rows) {
    if (r.name === 'username') out.username = r.value;
    else if (r.name === 'password') out.password = r.value;
    else if (r.name === 'pin') out.pin = r.value;
    else if (r.name === 'qr') out.qr = r.value;
    else if (r.name === 'other') out.other = r.value;
  }
  return out;
}

function toEntry(raw: RawEntry): VaultEntry {
  return {
    vid: raw.vid,
    systemID: raw.systemID,
    systemName: raw.systemName,
    secrets: rowsToSecrets(raw.secrets ?? []),
    createdAt: raw.createdAt,
  };
}

@Injectable({ providedIn: 'root' })
export class VaultService {
  private http = inject(HttpClient);
  private base = '/api/vault';

  async list(): Promise<VaultEntry[]> {
    const res = await firstValueFrom(
      this.http.get<{ entries: RawEntry[] }>(this.base),
    );
    return res.entries.map(toEntry);
  }

  async get(vid: string): Promise<VaultEntry> {
    const raw = await firstValueFrom(this.http.get<RawEntry>(`${this.base}/${vid}`));
    return toEntry(raw);
  }

  async create(input: { systemName: string; secrets: VaultSecrets }): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ ok: true; vid: string }>(this.base, {
        systemName: input.systemName,
        secrets: input.secrets,
      }),
    );
    return res.vid;
  }

  async update(vid: string, input: { systemName?: string; secrets?: VaultSecrets }) {
    await firstValueFrom(this.http.put<{ ok: true }>(`${this.base}/${vid}`, input));
  }

  async delete(vid: string) {
    await firstValueFrom(this.http.delete<{ ok: true }>(`${this.base}/${vid}`));
  }
}
