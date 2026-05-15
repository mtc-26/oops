import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../data/auth.service';

@Component({
  selector: 'app-reset-new-motp',
  imports: [FormsModule],
  templateUrl: './reset-new-motp.html',
  styleUrl: './reset-new-motp.scss',
})
export class ResetNewMotp implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  email = signal(sessionStorage.getItem('oops_flow_email') ?? '');
  qr = signal<string | null>(null);
  secret = signal<string | null>(null);
  token = signal('');
  loading = signal(true);
  confirming = signal(false);
  error = signal<string | null>(null);

  async ngOnInit() {
    if (!this.email()) {
      this.error.set('Session หมดอายุ');
      this.loading.set(false);
      return;
    }
    try {
      const res = await this.auth.resetMotpNew(this.email());
      this.qr.set(res.qr);
      this.secret.set(res.secret);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }

  async confirm() {
    if (this.token().length !== 6) {
      this.error.set('กรอกรหัส 6 หลัก');
      return;
    }
    this.confirming.set(true);
    this.error.set(null);
    try {
      await this.auth.loginMember(this.email(), this.token());
      sessionStorage.clear();
      this.router.navigateByUrl('/safebox');
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.confirming.set(false);
    }
  }
}
