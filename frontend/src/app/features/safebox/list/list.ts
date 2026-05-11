import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { CATEGORIES } from '../../../data/apps';
import { VaultService, DecryptedEntry, VaultCategory } from '../../../data/vault.service';

type ListCategory = VaultCategory | 'all';

@Component({
  selector: 'app-safebox-list',
  imports: [RouterLink, HeaderApp, Sidebar],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vault = inject(VaultService);

  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  category = computed<ListCategory>(() => {
    const raw = this.params().get('category') ?? 'all';
    const valid: ListCategory[] = [
      'all',
      'social',
      'banking',
      'entertainment',
      'education',
      'books',
      'games',
      'other',
    ];
    return valid.includes(raw as ListCategory) ? (raw as ListCategory) : 'all';
  });

  entries = signal<DecryptedEntry[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  categoryLabel = computed(
    () => CATEGORIES.find((c) => c.id === this.category())?.label ?? '',
  );

  constructor() {
    effect(() => {
      const cat = this.category();
      this.load(cat);
    });
  }

  private async load(cat: ListCategory) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const cleanCat = cat === 'all' ? undefined : cat;
      this.entries.set(await this.vault.list(cleanCat));
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }

  open(id: string) {
    this.router.navigate(['/safebox/edit', id]);
  }
}
