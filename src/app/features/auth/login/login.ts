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
  email = signal('');
  motp = signal('');
  private auth = inject(AuthService);
  private router = inject(Router);

  submit() {
    this.auth.login();
    this.router.navigateByUrl('/safebox/all');
  }

  requestEmailOtp() {
    this.router.navigateByUrl('/register/email-otp');
  }
}
