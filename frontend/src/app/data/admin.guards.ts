import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const requireAdmin: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }
  const role = auth.role();
  if (role !== 'Admin' && role !== 'SuperAdmin') {
    router.navigateByUrl('/');
    return false;
  }
  return true;
};
