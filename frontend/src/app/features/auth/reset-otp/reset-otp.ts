import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../data/auth.service';

@Component({
  selector: 'app-reset-otp',
  imports: [FormsModule],
  templateUrl: './reset-otp.html',
  styleUrl: './reset-otp.scss',
})
export class ResetOtp {
  private auth = inject(AuthService);
  private router = inject(Router);
  otp = signal('');
  email = signal(sessionStorage.getItem('oops_flow_email') ?? '');
  loading = signal(false);
  error = signal<string | null>(null);

  async submit() {
    if (!this.email() || !this.otp()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.resetMotpVerify(this.email(), this.otp());
      this.router.navigateByUrl('/reset/new-motp');
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }
}
