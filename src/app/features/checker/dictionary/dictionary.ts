import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderPublic } from '../../../shared/header-public/header-public';

type Result = 'idle' | 'unsafe' | 'safe';

@Component({
  selector: 'app-dictionary',
  imports: [FormsModule, HeaderPublic],
  templateUrl: './dictionary.html',
  styleUrl: './dictionary.scss',
})
export class Dictionary {
  password = signal('');
  selected = signal<string[]>(['OOPS! Dictionary']);
  result = signal<Result>('idle');
  dicts = ['OOPS! Dictionary', 'Rockyou.txt', 'HIBP API'];

  toggle(name: string) {
    const cur = this.selected();
    this.selected.set(cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]);
  }

  check() {
    const pw = this.password();
    if (!pw) {
      this.result.set('idle');
      return;
    }
    const weak = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    this.result.set(weak.includes(pw.toLowerCase()) ? 'unsafe' : 'safe');
  }
}
