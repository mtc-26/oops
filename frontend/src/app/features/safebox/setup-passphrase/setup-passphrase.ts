import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { VaultService } from '../../../data/vault.service';

@Component({
  selector: 'app-setup-passphrase',
  imports: [FormsModule, HeaderApp],
  templateUrl: './setup-passphrase.html',
  styleUrl: './setup-passphrase.scss',
})
export class SetupPassphrase {
  private vault = inject(VaultService);
  private router = inject(Router);

  passphrase = signal('');
  confirm = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  async submit() {
    if (this.passphrase().length < 8) {
      this.error.set('passphrase ต้องยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (this.passphrase() !== this.confirm()) {
      this.error.set('passphrase ทั้งสองช่องไม่ตรงกัน');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.vault.setupPassphrase(this.passphrase());
      this.router.navigateByUrl('/safebox/all');
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }
}
