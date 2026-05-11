import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderPublic } from '../../shared/header-public/header-public';

type Result = 'idle' | 'unsafe' | 'safe';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, HeaderPublic],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  password = signal('');
  result = signal<Result>('idle');

  check() {
    const pw = this.password();
    if (!pw) {
      this.result.set('idle');
      return;
    }
    const ok = pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
    this.result.set(ok ? 'safe' : 'unsafe');
  }
}
