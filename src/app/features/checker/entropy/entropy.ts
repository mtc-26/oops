import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderPublic } from '../../../shared/header-public/header-public';

@Component({
  selector: 'app-entropy',
  imports: [FormsModule, HeaderPublic],
  templateUrl: './entropy.html',
  styleUrl: './entropy.scss',
})
export class Entropy {
  password = signal('');
  checked = signal(false);

  entropyValue = computed(() => {
    const pw = this.password();
    if (!pw) return 0;
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/[0-9]/.test(pw)) pool += 10;
    if (/[^A-Za-z0-9]/.test(pw)) pool += 32;
    return Math.round(pw.length * Math.log2(Math.max(pool, 1)));
  });

  level = computed(() => {
    const e = this.entropyValue();
    if (e >= 60) return { label: 'สูง', good: true };
    if (e >= 40) return { label: 'ปานกลาง', good: true };
    return { label: 'น้อย', good: false };
  });

  check() { this.checked.set(true); }
}
