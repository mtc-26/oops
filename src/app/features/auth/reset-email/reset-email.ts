import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-email',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-email.html',
  styleUrl: './reset-email.scss',
})
export class ResetEmail {
  email = signal('');
  constructor(private router: Router) {}
  submit() { this.router.navigateByUrl('/reset/otp'); }
}
