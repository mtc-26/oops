import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { VaultService, VaultEntry } from '../../../data/vault.service';

@Component({
  selector: 'app-safebox-edit',
  imports: [FormsModule, HeaderApp],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
})
export class Edit implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vault = inject(VaultService);

  entry = signal<VaultEntry | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  systemName = signal('');
  username = signal('');
  password = signal('');
  pin = signal('');
  other = signal('');

  async ngOnInit() {
    const vid = this.route.snapshot.paramMap.get('vid');
    if (!vid) {
      this.error.set('No id');
      this.loading.set(false);
      return;
    }
    try {
      const e = await this.vault.get(vid);
      this.entry.set(e);
      this.systemName.set(e.systemName);
      this.username.set(e.secrets.username ?? '');
      this.password.set(e.secrets.password ?? '');
      this.pin.set(e.secrets.pin ?? '');
      this.other.set(e.secrets.other ?? '');
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }

  back() { history.back(); }

  async save() {
    const cur = this.entry();
    if (!cur || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.vault.update(cur.vid, {
        systemName: this.systemName(),
        secrets: {
          username: this.username(),
          password: this.password(),
          pin: this.pin(),
          other: this.other(),
        },
      });
      this.router.navigate(['/safebox']);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.saving.set(false);
    }
  }

  async remove() {
    const cur = this.entry();
    if (!cur) return;
    if (!confirm(`ลบรายการ "${cur.systemName}"?`)) return;
    this.saving.set(true);
    try {
      await this.vault.delete(cur.vid);
      this.router.navigate(['/safebox']);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
      this.saving.set(false);
    }
  }
}
