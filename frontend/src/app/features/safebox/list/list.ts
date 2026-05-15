import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { VaultService, VaultEntry } from '../../../data/vault.service';

@Component({
  selector: 'app-safebox-list',
  imports: [RouterLink, HeaderApp, Sidebar],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List implements OnInit {
  private router = inject(Router);
  private vault = inject(VaultService);

  entries = signal<VaultEntry[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async ngOnInit() {
    await this.load();
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.entries.set(await this.vault.list());
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.message ?? 'API error');
    } finally {
      this.loading.set(false);
    }
  }

  open(vid: string) {
    this.router.navigate(['/safebox/edit', vid]);
  }
}
