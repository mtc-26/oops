import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderApp } from '../../shared/header-app/header-app';
import { AuthService, AuthUser } from '../../data/auth.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, HeaderApp],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private auth = inject(AuthService);

  user = signal<AuthUser | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // edit mode
  editing = signal(false);
  saving = signal(false);
  fullName = signal('');
  phone = signal('');

  // email change flow
  emailDialogOpen = signal(false);
  emailStep = signal<1 | 2>(1);
  newEmail = signal('');
  currentToken = signal('');
  newToken = signal('');
  changeQr = signal('');
  changeSecret = signal('');
  emailError = signal<string | null>(null);
  emailWorking = signal(false);

  initials = computed(() => {
    const name = this.user()?.fullName ?? '';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
  });

  async ngOnInit() {
    try {
      const u = await this.auth.getMe();
      this.user.set(u);
      this.fullName.set(u.fullName);
      this.phone.set(u.phone ?? '');
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }

  startEdit() {
    const u = this.user();
    if (!u) return;
    this.fullName.set(u.fullName);
    this.phone.set(u.phone ?? '');
    this.editing.set(true);
  }

  cancelEdit() {
    this.editing.set(false);
  }

  async saveEdit() {
    this.saving.set(true);
    this.error.set(null);
    try {
      const u = await this.auth.updateMe({
        fullName: this.fullName(),
        phone: this.phone(),
      });
      this.user.set(u);
      this.editing.set(false);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.saving.set(false);
    }
  }

  openEmailDialog() {
    this.emailDialogOpen.set(true);
    this.emailStep.set(1);
    this.newEmail.set('');
    this.currentToken.set('');
    this.newToken.set('');
    this.changeQr.set('');
    this.changeSecret.set('');
    this.emailError.set(null);
  }

  closeEmailDialog() {
    this.emailDialogOpen.set(false);
  }

  async submitEmailStart() {
    if (!this.newEmail() || !this.currentToken()) {
      this.emailError.set('กรอกอีเมลใหม่และ M-OTP ปัจจุบัน');
      return;
    }
    this.emailWorking.set(true);
    this.emailError.set(null);
    try {
      const res = await this.auth.changeEmailStart(this.newEmail(), this.currentToken());
      this.changeQr.set(res.qr);
      this.changeSecret.set(res.secret);
      this.emailStep.set(2);
    } catch (e: any) {
      this.emailError.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.emailWorking.set(false);
    }
  }

  async submitEmailConfirm() {
    if (this.newToken().length !== 6) {
      this.emailError.set('M-OTP 6 หลัก');
      return;
    }
    this.emailWorking.set(true);
    this.emailError.set(null);
    try {
      const u = await this.auth.changeEmailConfirm(this.newToken());
      this.user.set(u);
      this.emailDialogOpen.set(false);
    } catch (e: any) {
      this.emailError.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.emailWorking.set(false);
    }
  }

}
