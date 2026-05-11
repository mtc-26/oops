import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isLoggedIn = signal(false);

  login() {
    this.isLoggedIn.set(true);
  }

  logout() {
    this.isLoggedIn.set(false);
  }
}
