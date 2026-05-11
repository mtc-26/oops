import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeaderApp } from '../../../shared/header-app/header-app';
import { APPS } from '../../../data/apps';

@Component({
  selector: 'app-safebox-edit',
  imports: [FormsModule, HeaderApp],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
})
export class Edit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  app = computed(() => {
    const id = this.params().get('id');
    return APPS.find((a) => a.id === id) ?? APPS[0];
  });

  back() { this.router.navigateByUrl('/safebox/all'); }
  save() { this.router.navigateByUrl('/safebox/all'); }
}
