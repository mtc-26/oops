import { Routes } from '@angular/router';
import { requireVault } from './data/vault.guards';
import { requireLogin } from './data/auth.guards';
import { requireAdmin } from './data/admin.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'checker/dictionary',
    canActivate: [requireLogin],
    loadComponent: () =>
      import('./features/checker/dictionary/dictionary').then((m) => m.Dictionary),
  },
  {
    path: 'checker/entropy',
    loadComponent: () => import('./features/checker/entropy/entropy').then((m) => m.Entropy),
  },
  {
    path: 'aes-demo',
    loadComponent: () => import('./features/aes-demo/aes-demo').then((m) => m.AesDemo),
  },
  {
    path: 'checker/gpu-attack',
    canActivate: [requireLogin],
    loadComponent: () =>
      import('./features/checker/gpu-attack/gpu-attack').then((m) => m.GpuAttack),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'register/email-otp',
    loadComponent: () =>
      import('./features/auth/email-otp/email-otp').then((m) => m.EmailOtp),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'login/qr',
    loadComponent: () =>
      import('./features/auth/login-qr/login-qr').then((m) => m.LoginQr),
  },
  {
    path: 'login/admin-setup',
    loadComponent: () =>
      import('./features/auth/admin-setup/admin-setup').then((m) => m.AdminSetup),
  },
  {
    path: 'reset/email',
    loadComponent: () =>
      import('./features/auth/reset-email/reset-email').then((m) => m.ResetEmail),
  },
  {
    path: 'reset/otp',
    loadComponent: () =>
      import('./features/auth/reset-otp/reset-otp').then((m) => m.ResetOtp),
  },
  {
    path: 'reset/new-motp',
    loadComponent: () =>
      import('./features/auth/reset-new-motp/reset-new-motp').then(
        (m) => m.ResetNewMotp,
      ),
  },
  {
    path: 'contact-admin',
    loadComponent: () =>
      import('./features/auth/contact-admin/contact-admin').then((m) => m.ContactAdmin),
  },
  {
    path: 'profile',
    canActivate: [requireLogin],
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'admin',
    canActivate: [requireAdmin],
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
  },
  {
    path: 'safebox',
    canActivate: [requireVault],
    loadComponent: () => import('./features/safebox/list/list').then((m) => m.List),
  },
  {
    path: 'safebox/add',
    canActivate: [requireVault],
    loadComponent: () => import('./features/safebox/add/add').then((m) => m.Add),
  },
  {
    path: 'safebox/edit/:id',
    canActivate: [requireVault],
    loadComponent: () => import('./features/safebox/edit/edit').then((m) => m.Edit),
  },
  { path: '**', redirectTo: '' },
];
