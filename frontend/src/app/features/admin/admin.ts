import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderApp } from '../../shared/header-app/header-app';
import { AuthService } from '../../data/auth.service';
import {
  AdminService,
  AdminUser,
  AdminGpu,
  AdminDictionary,
} from '../../data/admin.service';
import { CheckerService } from '../../data/checker.service';

type Tab = 'users' | 'gpus' | 'dicts';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, HeaderApp],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  private adminApi = inject(AdminService);
  private checker = inject(CheckerService);
  private auth = inject(AuthService);

  tab = signal<Tab>('users');
  loading = signal(false);
  error = signal<string | null>(null);

  isSuperAdmin = computed(() => this.auth.role() === 'SuperAdmin');

  // Users
  users = signal<AdminUser[]>([]);

  // GPUs
  gpus = signal<AdminGpu[]>([]);
  editingGpu = signal<AdminGpu | null>(null);
  newGpu = signal<{ gpuName: string; brand: string; scryptHashrate: number; memory: number }>({
    gpuName: '', brand: 'NVIDIA', scryptHashrate: 1000, memory: 8,
  });

  // Dicts
  dicts = signal<AdminDictionary[]>([]);
  editingDict = signal<AdminDictionary | null>(null);

  // Add Admin modal
  addAdminOpen = signal(false);
  newAdminForm = signal<{ email: string; fullName: string; password: string }>({
    email: '', fullName: '', password: '',
  });
  addAdminError = signal<string | null>(null);
  addAdminSaving = signal(false);

  async ngOnInit() {
    await this.loadTab(this.tab());
  }

  async switchTab(t: Tab) {
    this.tab.set(t);
    await this.loadTab(t);
  }

  private async loadTab(t: Tab) {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (t === 'users') this.users.set(await this.adminApi.listUsers());
      else if (t === 'gpus') this.gpus.set(await this.checker.listGpus() as AdminGpu[]);
      else if (t === 'dicts') this.dicts.set(await this.adminApi.listDictionaries());
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Users actions ──────────────────────────────────────
  async toggleDisable(u: AdminUser) {
    try {
      await this.adminApi.toggleDisable(u.uid, !u.disable);
      this.users.update((list) => list.map((x) => x.uid === u.uid ? { ...x, disable: !u.disable } : x));
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    }
  }

  async removeUser(u: AdminUser) {
    if (!confirm(`ลบบัญชี "${u.email}" ทั้งหมด?`)) return;
    try {
      await this.adminApi.deleteUser(u.uid);
      this.users.update((list) => list.filter((x) => x.uid !== u.uid));
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    }
  }

  openAddAdmin() {
    this.newAdminForm.set({ email: '', fullName: '', password: '' });
    this.addAdminError.set(null);
    this.addAdminOpen.set(true);
  }
  closeAddAdmin() { this.addAdminOpen.set(false); }

  async submitAddAdmin() {
    const f = this.newAdminForm();
    if (!f.email || !f.fullName || !f.password) {
      this.addAdminError.set('กรอกข้อมูลให้ครบ'); return;
    }
    this.addAdminSaving.set(true);
    try {
      const res = await this.adminApi.createAdmin(f);
      this.users.update((list) => [res.user as AdminUser, ...list]);
      this.addAdminOpen.set(false);
    } catch (e: any) {
      this.addAdminError.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.addAdminSaving.set(false);
    }
  }

  // ── GPU actions ────────────────────────────────────────
  startEditGpu(g: AdminGpu) {
    this.editingGpu.set({ ...g });
  }
  cancelEditGpu() { this.editingGpu.set(null); }
  async saveEditGpu() {
    const g = this.editingGpu();
    if (!g) return;
    try {
      await this.adminApi.updateGpu(g.gid, g);
      this.gpus.update((list) => list.map((x) => x.gid === g.gid ? g : x));
      this.editingGpu.set(null);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    }
  }
  async removeGpu(g: AdminGpu) {
    if (!confirm(`ลบ GPU "${g.gpuName}"?`)) return;
    try {
      await this.adminApi.deleteGpu(g.gid);
      this.gpus.update((list) => list.filter((x) => x.gid !== g.gid));
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    }
  }
  async addGpu() {
    const g = this.newGpu();
    if (!g.gpuName || !g.brand) { this.error.set('กรอกชื่อรุ่นและยี่ห้อ'); return; }
    try {
      const res = await this.adminApi.createGpu(g);
      this.gpus.update((list) => [res.gpu, ...list]);
      this.newGpu.set({ gpuName: '', brand: 'NVIDIA', scryptHashrate: 1000, memory: 8 });
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    }
  }

  // ── Dictionary actions ─────────────────────────────────
  startEditDict(d: AdminDictionary) { this.editingDict.set({ ...d }); }
  cancelEditDict() { this.editingDict.set(null); }
  async saveEditDict() {
    const d = this.editingDict();
    if (!d) return;
    try {
      await this.adminApi.updateDictionary(d.did, { dictname: d.dictname, dictfile: d.dictfile });
      this.dicts.update((list) => list.map((x) => x.did === d.did ? d : x));
      this.editingDict.set(null);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    }
  }
  async removeDict(d: AdminDictionary) {
    if (!confirm(`ลบ Dictionary "${d.dictname}"?`)) return;
    try {
      await this.adminApi.deleteDictionary(d.did);
      this.dicts.update((list) => list.filter((x) => x.did !== d.did));
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    }
  }
}
