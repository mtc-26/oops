import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { AppCategory, CATEGORIES, appsByCategory } from '../../../data/apps';

@Component({
  selector: 'app-safebox-list',
  imports: [RouterLink, HeaderApp, Sidebar],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  category = computed<AppCategory>(() => {
    const raw = this.params().get('category') ?? 'all';
    const valid: AppCategory[] = [
      'all',
      'social',
      'banking',
      'entertainment',
      'education',
      'books',
      'games',
      'other',
    ];
    return valid.includes(raw as AppCategory) ? (raw as AppCategory) : 'all';
  });

  apps = computed(() => appsByCategory(this.category()));

  categoryLabel = computed(
    () => CATEGORIES.find((c) => c.id === this.category())?.label ?? '',
  );

  open(id: string) {
    this.router.navigate(['/safebox/edit', id]);
  }
}
