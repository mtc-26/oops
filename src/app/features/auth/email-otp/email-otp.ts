import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-email-otp',
  imports: [FormsModule],
  templateUrl: './email-otp.html',
  styleUrl: './email-otp.scss',
})
export class EmailOtp {
  otp = signal('');
  constructor(private router: Router) {}

  submit() { this.router.navigateByUrl('/login/qr'); }
}
