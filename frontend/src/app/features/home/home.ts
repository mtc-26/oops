import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderPublic } from '../../shared/header-public/header-public';
import { CheckerService, EntropyResult, DictionaryResult, GpuAttackResult } from '../../data/checker.service';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, HeaderPublic],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private checker = inject(CheckerService);

  password = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  entropy = signal<EntropyResult | null>(null);
  dict = signal<DictionaryResult | null>(null);
  gpu = signal<GpuAttackResult | null>(null);

  hasResult = computed(() => !!(this.entropy() || this.dict() || this.gpu()));

  overallSafe = computed(() => {
    const d = this.dict();
    const e = this.entropy();
    if (!d && !e) return null;
    const inDict = !!(d && !d.safe);
    const entropyOk = e ? e.safe : false;
    return !inDict && entropyOk;
  });

  dictSummary = computed(() => {
    const d = this.dict();
    if (!d) return null;
    const hits: string[] = [];
    if (d.results?.['rockyou']) hits.push('rockyou');
    if (d.results?.['dropbox']) hits.push('dropbox');
    return hits.length > 0
      ? { pwned: true, text: 'พบใน: ' + hits.join(', ') }
      : { pwned: false, text: 'ไม่พบในพจนานุกรม' };
  });

  async check() {
    const pw = this.password();
    if (!pw) {
      this.reset();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const [entRes, dictRes, gpuRes] = await Promise.allSettled([
        this.checker.entropy(pw),
        this.checker.dictionary(pw, ['rockyou', 'dropbox']),
        this.checker.gpuAttack(pw, ''),
      ]);
      this.entropy.set(entRes.status === 'fulfilled' ? entRes.value : null);
      this.dict.set(dictRes.status === 'fulfilled' ? dictRes.value : null);
      this.gpu.set(gpuRes.status === 'fulfilled' ? gpuRes.value : null);
    } catch (e: any) {
      this.error.set(e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }

  reset() {
    this.entropy.set(null);
    this.dict.set(null);
    this.gpu.set(null);
    this.error.set(null);
  }
}
