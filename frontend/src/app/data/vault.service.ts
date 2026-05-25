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

export const SAFEBOX_CATEGORIES = [
  'สื่อสังคมออนไลน์',
  'ธุรกรรม',
  'ความบันเทิง',
  'การศึกษา',
  'หนังสือ',
  'เกม',
  'อื่นๆ',
] as const;
export type SafeboxCategory = (typeof SAFEBOX_CATEGORIES)[number];

export interface VaultEntry {
  usersecretId: string;
  systemName: string;
  secretName: string;
  secretDescription: string;
  picture: string;
  category: string;
  secrets: VaultSecrets;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class VaultService {
  private http = inject(HttpClient);
  private base = '/api/vault';

  async list(category?: string): Promise<VaultEntry[]> {
    const url = category && category !== 'all'
      ? `${this.base}?category=${encodeURIComponent(category)}`
      : this.base;
    const res = await firstValueFrom(this.http.get<{ entries: VaultEntry[] }>(url));
    return res.entries;
  }

  async get(id: string): Promise<VaultEntry> {
    return firstValueFrom(this.http.get<VaultEntry>(`${this.base}/${id}`));
  }

  async create(input: {
    systemName: string;
    secretName?: string;
    secretDescription?: string;
    picture?: string;
    category?: string;
    secrets: VaultSecrets;
  }): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ ok: true; usersecretId: string }>(this.base, input),
    );
    return res.usersecretId;
  }

  async update(
    id: string,
    input: {
      systemName?: string;
      secretName?: string;
      secretDescription?: string;
      picture?: string;
      category?: string;
      secrets?: VaultSecrets;
    },
  ) {
    await firstValueFrom(this.http.put<{ ok: true }>(`${this.base}/${id}`, input));
  }

  async delete(id: string) {
    await firstValueFrom(this.http.delete<{ ok: true }>(`${this.base}/${id}`));
  }
}
