import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SAFEBOX_CATEGORIES } from '../../data/vault.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  activeCategory = input<string | null>(null);
  categories = SAFEBOX_CATEGORIES;
}
