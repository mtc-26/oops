import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { VaultService, VaultEntry } from '../../../data/vault.service';

@Component({
  selector: 'app-safebox-list',
  imports: [HeaderApp, Sidebar],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vault = inject(VaultService);

  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  category = computed<string>(() => this.params().get('category') ?? 'all');

  entries = signal<VaultEntry[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      void this.load(this.category());
    });
  }

  private async load(category: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.entries.set(await this.vault.list(category));
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }

  open(entry: VaultEntry) {
    this.router.navigate(['/safebox/edit', entry.usersecretId]);
  }

  add() {
    this.router.navigate(['/safebox/add']);
  }
}
