import { Component, computed, inject, signal, OnInit, HostListener, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderPublic } from '../../../shared/header-public/header-public';
import { CheckerService, GpuAttackResult, GpuOption } from '../../../data/checker.service';

@Component({
  selector: 'app-gpu-attack',
  imports: [FormsModule, HeaderPublic],
  templateUrl: './gpu-attack.html',
  styleUrl: './gpu-attack.scss',
})
export class GpuAttack implements OnInit {
  private checker = inject(CheckerService);
  private host = inject(ElementRef);

  password = signal('');
  gpu = signal('');
  gpus = signal<GpuOption[]>([]);
  result = signal<GpuAttackResult | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  dropdownOpen = signal(false);

  selected = computed(() => this.gpus().find((g) => g.gpuName === this.gpu()) ?? null);

  groupedGpus = computed<{ brand: string; items: GpuOption[] }[]>(() => {
    const map = new Map<string, GpuOption[]>();
    for (const g of this.gpus()) {
      if (!map.has(g.brand)) map.set(g.brand, []);
      map.get(g.brand)!.push(g);
    }
    return Array.from(map.entries()).map(([brand, items]) => ({ brand, items }));
  });

  async ngOnInit() {
    try {
      const list = await this.checker.listGpus();
      this.gpus.set(list);
      const def = list.find((g) => g.default);
      if (def) this.gpu.set(def.gpuName);
      else if (list.length > 0) this.gpu.set(list[0].gpuName);
    } catch (e: any) {
      this.error.set(e?.message ?? 'ดึงรายชื่อ GPU ไม่ได้');
    }
  }

  toggleDropdown() {
    this.dropdownOpen.update((v) => !v);
  }

  pickGpu(g: GpuOption) {
    this.gpu.set(g.gpuName);
    this.dropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent) {
    if (!this.dropdownOpen()) return;
    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target)) {
      this.dropdownOpen.set(false);
    }
  }

  async check() {
    if (!this.password()) {
      this.result.set(null);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.checker.gpuAttack(this.password(), this.gpu());
      this.result.set(res);
    } catch (e: any) {
      this.error.set(e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }
}
