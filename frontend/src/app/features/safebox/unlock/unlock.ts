import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { VaultService } from '../../../data/vault.service';

@Component({
  selector: 'app-vault-unlock',
  imports: [FormsModule, HeaderApp],
  templateUrl: './unlock.html',
  styleUrl: './unlock.scss',
})
export class Unlock {
  private vault = inject(VaultService);
  private router = inject(Router);

  passphrase = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  async submit() {
    if (!this.passphrase()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const ok = await this.vault.unlock(this.passphrase());
      if (!ok) {
        this.error.set('passphrase ไม่ถูกต้อง');
        return;
      }
      this.router.navigateByUrl('/safebox/all');
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }
}
