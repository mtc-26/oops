import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-otp',
  imports: [FormsModule],
  templateUrl: './reset-otp.html',
  styleUrl: './reset-otp.scss',
})
export class ResetOtp {
  otp = signal('');
  constructor(private router: Router) {}
  submit() { this.router.navigateByUrl('/reset/new-motp'); }
}
