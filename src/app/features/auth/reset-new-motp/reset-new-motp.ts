import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-new-motp',
  imports: [FormsModule],
  templateUrl: './reset-new-motp.html',
  styleUrl: './reset-new-motp.scss',
})
export class ResetNewMotp {
  motp = signal('');
  constructor(private router: Router) {}
  submit() { this.router.navigateByUrl('/login'); }
}
