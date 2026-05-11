import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { CATEGORIES } from '../../../data/apps';
import { VaultService, VaultCategory } from '../../../data/vault.service';

const COLOR_PALETTE = ['#1877F2', '#E50914', '#F5A623', '#28B463', '#7a4ed5', '#E91E63', '#0CAA40', '#FA4454'];

@Component({
  selector: 'app-safebox-add',
  imports: [FormsModule, HeaderApp],
  templateUrl: './add.html',
  styleUrl: './add.scss',
})
export class Add {
  private vault = inject(VaultService);
  private router = inject(Router);

  category = signal<VaultCategory>('other');
  categories = CATEGORIES.filter((c) => c.id !== 'all') as { id: VaultCategory; label: string }[];

  loading = signal(false);
  error = signal<string | null>(null);

  back() { history.back(); }

  async save(f: NgForm) {
    if (this.loading()) return;
    const { systemName, username, email, password, other } = f.value;
    if (!systemName) {
      this.error.set('กรุณากรอกชื่อระบบ');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
      await this.vault.create({
        systemName,
        category: this.category(),
        color,
        secrets: { username, password, pin: email, other },
      });
      this.router.navigate(['/safebox', this.category()]);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }
}
