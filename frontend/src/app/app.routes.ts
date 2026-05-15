import { Routes } from '@angular/router';
import { requireVault } from './data/vault.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'checker/dictionary',
    loadComponent: () =>
      import('./features/checker/dictionary/dictionary').then((m) => m.Dictionary),
  },
  {
    path: 'checker/entropy',
    loadComponent: () => import('./features/checker/entropy/entropy').then((m) => m.Entropy),
  },
  {
    path: 'checker/gpu-attack',
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
    path: 'safebox',
    pathMatch: 'full',
    canActivate: [requireVault],
    loadComponent: () => import('./features/safebox/list/list').then((m) => m.List),
  },
  {
    path: 'safebox/add',
    canActivate: [requireVault],
    loadComponent: () => import('./features/safebox/add/add').then((m) => m.Add),
  },
  {
    path: 'safebox/edit/:vid',
    canActivate: [requireVault],
    loadComponent: () => import('./features/safebox/edit/edit').then((m) => m.Edit),
  },
  { path: '**', redirectTo: '' },
];
