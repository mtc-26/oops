import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { CATEGORIES } from '../../../data/apps';

@Component({
  selector: 'app-safebox-add',
  imports: [FormsModule, HeaderApp],
  templateUrl: './add.html',
  styleUrl: './add.scss',
})
export class Add {
  category = signal('');
  categories = CATEGORIES.filter((c) => c.id !== 'all');

  constructor(private router: Router) {}

  back() { this.router.navigateByUrl('/safebox/other'); }
  save() { this.router.navigateByUrl('/safebox/other'); }
}
