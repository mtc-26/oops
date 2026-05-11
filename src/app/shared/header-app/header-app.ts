import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OopsLogo } from '../oops-logo/oops-logo';
import { AuthService } from '../../data/auth.service';

@Component({
  selector: 'app-header-app',
  imports: [OopsLogo],
  templateUrl: './header-app.html',
  styleUrl: './header-app.scss',
})
export class HeaderApp {
  private auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
