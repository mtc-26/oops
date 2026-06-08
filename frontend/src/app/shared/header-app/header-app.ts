import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OopsLogo } from '../oops-logo/oops-logo';
import { AuthService } from '../../data/auth.service';

@Component({
  selector: 'app-header-app',
  imports: [OopsLogo, RouterLink],
  templateUrl: './header-app.html',
  styleUrl: './header-app.scss',
})
export class HeaderApp {
  private auth = inject(AuthService);
  private router = inject(Router);

  isAdmin = computed(() => {
    const r = this.auth.role();
    return r === 'Admin' || r === 'SuperAdmin';
  });

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
