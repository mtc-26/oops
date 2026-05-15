import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../data/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = signal<'member' | 'admin'>('member');
  email = signal('');
  password = signal('');
  motp = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  toggleMode() {
    this.mode.set(this.mode() === 'member' ? 'admin' : 'member');
    this.error.set(null);
  }

  async submit() {
    if (!this.email() || !this.motp()) {
      this.error.set('กรุณากรอกอีเมลและ M-OTP');
      return;
    }
    if (this.mode() === 'admin' && !this.password()) {
      this.error.set('กรุณากรอกรหัสผ่าน');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.mode() === 'admin') {
        await this.auth.loginAdmin(this.email(), this.password(), this.motp());
      } else {
        await this.auth.loginMember(this.email(), this.motp());
      }
      this.router.navigateByUrl('/safebox');
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }
}
