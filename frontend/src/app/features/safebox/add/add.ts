import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { VaultService } from '../../../data/vault.service';

@Component({
  selector: 'app-safebox-add',
  imports: [FormsModule, HeaderApp],
  templateUrl: './add.html',
  styleUrl: './add.scss',
})
export class Add {
  private vault = inject(VaultService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  back() { history.back(); }

  async save(f: NgForm) {
    if (this.loading()) return;
    const { systemName, username, password, pin, other } = f.value;
    if (!systemName) {
      this.error.set('กรุณากรอกชื่อระบบ');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.vault.create({
        systemName,
        secrets: { username, password, pin, other },
      });
      this.router.navigate(['/safebox']);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }
}
