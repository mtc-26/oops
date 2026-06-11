import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { VaultService, VaultEntry } from '../../../data/vault.service';
import { aesDecrypt } from '../../../data/aes.util';

@Component({
  selector: 'app-safebox-view',
  imports: [FormsModule, HeaderApp],
  templateUrl: './view.html',
  styleUrl: './view.scss',
})
export class View implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vault = inject(VaultService);

  entry = signal<VaultEntry | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  passphrase = signal('');
  packed = signal('');
  derivedKeyHex = signal('');
  plaintext = signal('');
  decError = signal<string | null>(null);
  working = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No id');
      this.loading.set(false);
      return;
    }
    try {
      const e = await this.vault.get(id);
      this.entry.set(e);
      // auto-fill packed ciphertext from the saved entry
      this.packed.set(e.secrets.encryptedBlob ?? '');
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }

  async runDecrypt() {
    this.decError.set(null);
    this.plaintext.set('');
    this.derivedKeyHex.set('');
    if (!this.passphrase() || !this.packed()) {
      this.decError.set('กรุณากรอก Passphrase และ Packed ciphertext');
      return;
    }
    this.working.set(true);
    try {
      const res = await aesDecrypt(this.passphrase(), this.packed());
      this.derivedKeyHex.set(res.derivedKeyHex);
      this.plaintext.set(res.plaintext);
    } catch (e: any) {
      this.decError.set(e?.message ?? 'Decryption error — passphrase ผิดหรือข้อมูลเสียหาย');
    } finally {
      this.working.set(false);
    }
  }

  goHome() { this.router.navigateByUrl('/safebox'); }
  goEdit() {
    const e = this.entry();
    if (!e) return;
    this.router.navigate(['/safebox/edit', e.usersecretId]);
  }
}
