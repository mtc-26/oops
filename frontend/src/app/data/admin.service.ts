import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AdminUser {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'Member' | 'Admin' | 'SuperAdmin';
  disable: boolean;
  motpReady: boolean;
  createdAt?: string;
}

export interface AdminGpu {
  gid: number;
  gpuName: string;
  brand: string;
  scryptHashrate: number;
  memory: number;
}

export interface AdminDictionary {
  did: string;
  dictname: string;
  dictfile: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = '/api/admin';

  // ─── Users ─────────────────────────────────────────────
  async listUsers(): Promise<AdminUser[]> {
    const res = await firstValueFrom(this.http.get<{ users: AdminUser[] }>(`${this.base}/users`));
    return res.users;
  }
  async toggleDisable(uid: string, disable: boolean) {
    return firstValueFrom(this.http.put<{ ok: true; disable: boolean }>(`${this.base}/users/${uid}/disable`, { disable }));
  }
  async deleteUser(uid: string) {
    return firstValueFrom(this.http.delete<{ ok: true }>(`${this.base}/users/${uid}`));
  }
  async createAdmin(input: { email: string; fullName: string; password: string }) {
    return firstValueFrom(this.http.post<{ ok: true; user: AdminUser }>(`${this.base}/users/admin`, input));
  }

  // ─── GPUs ──────────────────────────────────────────────
  async createGpu(input: { gpuName: string; brand: string; scryptHashrate: number; memory: number }) {
    return firstValueFrom(this.http.post<{ ok: true; gpu: AdminGpu }>(`${this.base}/gpus`, input));
  }
  async updateGpu(gid: number, input: Partial<AdminGpu>) {
    return firstValueFrom(this.http.put<{ ok: true; gpu: AdminGpu }>(`${this.base}/gpus/${gid}`, input));
  }
  async deleteGpu(gid: number) {
    return firstValueFrom(this.http.delete<{ ok: true }>(`${this.base}/gpus/${gid}`));
  }

  // ─── Dictionaries ──────────────────────────────────────
  async listDictionaries(): Promise<AdminDictionary[]> {
    const res = await firstValueFrom(
      this.http.get<{ dictionaries: AdminDictionary[] }>(`${this.base}/dictionaries`),
    );
    return res.dictionaries;
  }
  async updateDictionary(did: string, input: { dictname?: string; dictfile?: string }) {
    return firstValueFrom(this.http.put<{ ok: true; dictionary: AdminDictionary }>(`${this.base}/dictionaries/${did}`, input));
  }
  async deleteDictionary(did: string) {
    return firstValueFrom(this.http.delete<{ ok: true }>(`${this.base}/dictionaries/${did}`));
  }
}
