import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderPublic } from '../../../shared/header-public/header-public';

@Component({
  selector: 'app-gpu-attack',
  imports: [FormsModule, HeaderPublic],
  templateUrl: './gpu-attack.html',
  styleUrl: './gpu-attack.scss',
})
export class GpuAttack {
  password = signal('');
  gpu = signal('NVIDIA RTX5090');
  checked = signal(false);

  gpus = [
    'NVIDIA RTX5090',
    'NVIDIA RTX5080',
    'NVIDIA RTX5070',
    'NVIDIA RTX5060',
    'NVIDIA RTX4090Ti',
    'NVIDIA RTX4060',
    'NVIDIA RTX4050',
    'NVIDIA RTX3060',
  ];

  result() {
    const pw = this.password();
    if (!pw) return { time: '', safe: false };
    const ok = pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
    return {
      time: ok ? '148 ชั่วโมง' : '12 วินาที',
      safe: ok,
    };
  }

  check() { this.checked.set(true); }
}
