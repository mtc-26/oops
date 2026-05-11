import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../data/auth.service';

@Component({
  selector: 'app-email-otp',
  imports: [FormsModule],
  templateUrl: './email-otp.html',
  styleUrl: './email-otp.scss',
})
export class EmailOtp {
  private auth = inject(AuthService);
  private router = inject(Router);
  otp = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  email = signal(sessionStorage.getItem('oops_flow_email') ?? '');

  async submit() {
    if (!this.email()) {
      this.error.set('Session หมดอายุ กรุณา register ใหม่');
      return;
    }
    if (this.otp().length === 0) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.auth.verifyEmail(this.email(), this.otp());
      sessionStorage.setItem('oops_flow_qr', res.qr);
      sessionStorage.setItem('oops_flow_secret', res.secret);
      this.router.navigateByUrl('/login/qr');
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }
}
