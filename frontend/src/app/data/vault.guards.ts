import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { VaultService } from './vault.service';

/**
 * Vault routes need:
 *   1. user is logged in (else → /register)
 *   2. user has passphrase set (else → /safebox/setup-passphrase)
 *   3. vault is unlocked in this session (else → /safebox/unlock)
 */
export const requireVault: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const vault = inject(VaultService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/register');
    return false;
  }
  if (vault.unlocked()) return true;

  const state = await vault.getPassphraseState();
  if (!state.set) {
    router.navigateByUrl('/safebox/setup-passphrase');
    return false;
  }
  router.navigateByUrl('/safebox/unlock');
  return false;
};

// For setup page: must be logged in + passphrase not yet set
export const requireNoPassphrase: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const vault = inject(VaultService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/register');
    return false;
  }
  const state = await vault.getPassphraseState();
  if (state.set) {
    router.navigateByUrl('/safebox/unlock');
    return false;
  }
  return true;
};

// For unlock page: must be logged in + passphrase set + not yet unlocked
export const requireLocked: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const vault = inject(VaultService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/register');
    return false;
  }
  if (vault.unlocked()) {
    router.navigateByUrl('/safebox/all');
    return false;
  }
  const state = await vault.getPassphraseState();
  if (!state.set) {
    router.navigateByUrl('/safebox/setup-passphrase');
    return false;
  }
  return true;
};
