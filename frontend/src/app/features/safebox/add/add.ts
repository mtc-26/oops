import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { VaultService, SAFEBOX_CATEGORIES } from '../../../data/vault.service';
import { resizeToDataUrl } from '../../../data/image.util';

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
  picture = signal('');
  categories = SAFEBOX_CATEGORIES;

  back() { history.back(); }

  async onPictureSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }
    try {
      this.picture.set(await resizeToDataUrl(file, 256));
      this.error.set(null);
    } catch (e: any) {
      this.error.set(e?.message ?? 'อ่านรูปไม่สำเร็จ');
    }
  }

  async save(f: NgForm) {
    if (this.loading()) return;
    const { systemName, secretName, secretDescription, category, username, password, pin, other } = f.value;
    if (!systemName) {
      this.error.set('กรุณากรอกชื่อระบบ');
      return;
    }
    if (!category) {
      this.error.set('กรุณาเลือกหมวดหมู่');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.vault.create({
        systemName,
        secretName: secretName || systemName,
        secretDescription: secretDescription || '',
        picture: this.picture() || undefined,
        category,
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
