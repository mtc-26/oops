import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CATEGORIES, AppCategory } from '../../data/apps';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  activeCategory = input<AppCategory | null>(null);
  categories = CATEGORIES;
}
