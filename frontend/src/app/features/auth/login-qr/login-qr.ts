import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../data/auth.service';

@Component({
  selector: 'app-login-qr',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-qr.html',
  styleUrl: './login-qr.scss',
})
export class LoginQr {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal(sessionStorage.getItem('oops_flow_email') ?? '');
  qr = signal<string | null>(sessionStorage.getItem('oops_flow_qr'));
  secret = signal<string | null>(sessionStorage.getItem('oops_flow_secret'));
  token = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  async confirm() {
    if (this.token().length !== 6) {
      this.error.set('กรอกรหัส 6 หลักจาก Authenticator');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.confirmTotp(this.email(), this.token());
      sessionStorage.removeItem('oops_flow_email');
      sessionStorage.removeItem('oops_flow_qr');
      sessionStorage.removeItem('oops_flow_secret');
      sessionStorage.removeItem('oops_dev_otp');
      this.router.navigateByUrl('/safebox');
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }
}
