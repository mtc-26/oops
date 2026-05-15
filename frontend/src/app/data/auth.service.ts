import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Role = 'member' | 'admin' | 'super admin';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

interface TokenResp {
  ok: true;
  token: string;
  user: AuthUser;
}

interface QrResp {
  ok: true;
  otpauth: string;
  qr: string;
  secret: string;
}

interface OtpResp {
  ok: true;
  email?: string;
  devOtp?: string;
}

const STORAGE_KEY = 'oops_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = '/api/auth';

  private _token = signal<string | null>(this.readStoredToken());
  private _user = signal<AuthUser | null>(this.readStoredUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);

  private readStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY + '_token');
  }
  private readStoredUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY + '_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }
  private persist(token: string, user: AuthUser) {
    localStorage.setItem(STORAGE_KEY + '_token', token);
    localStorage.setItem(STORAGE_KEY + '_user', JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  // ─── Register ────────────────────────────────────────────────────────
  register(fullName: string, email: string, phone: string) {
    return firstValueFrom(
      this.http.post<OtpResp>(`${this.base}/register`, { fullName, email, phone }),
    );
  }

  verifyEmail(email: string, code: string) {
    return firstValueFrom(this.http.post<QrResp>(`${this.base}/verify-email`, { email, code }));
  }

  // ─── First-time setup: confirm Authenticator ─────────────────────────
  async confirmTotp(email: string, token: string) {
    const res = await firstValueFrom(
      this.http.post<TokenResp>(`${this.base}/confirm-totp`, { email, token }),
    );
    this.persist(res.token, res.user);
    return res;
  }

  // ─── Login ──────────────────────────────────────────────────────────
  requestEmailOtp(email: string) {
    return firstValueFrom(
      this.http.post<OtpResp>(`${this.base}/login/request-email-otp`, { email }),
    );
  }

  async loginMember(email: string, token: string) {
    const res = await firstValueFrom(
      this.http.post<TokenResp>(`${this.base}/login/member`, { email, token }),
    );
    this.persist(res.token, res.user);
    return res;
  }

  async loginAdmin(email: string, password: string, token: string) {
    const res = await firstValueFrom(
      this.http.post<TokenResp>(`${this.base}/login/admin`, { email, password, token }),
    );
    this.persist(res.token, res.user);
    return res;
  }

  // ─── Reset M-OTP ─────────────────────────────────────────────────────
  resetMotpRequest(email: string) {
    return firstValueFrom(
      this.http.post<OtpResp>(`${this.base}/reset-motp/request`, { email }),
    );
  }
  resetMotpVerify(email: string, code: string) {
    return firstValueFrom(
      this.http.post<{ ok: true }>(`${this.base}/reset-motp/verify`, { email, code }),
    );
  }
  resetMotpNew(email: string) {
    return firstValueFrom(this.http.post<QrResp>(`${this.base}/reset-motp/new`, { email }));
  }

  // ─── Contact admin ───────────────────────────────────────────────────
  contactAdmin(data: { fullName: string; username?: string; email: string; phone?: string; address?: string }) {
    return firstValueFrom(this.http.post<{ ok: true }>(`${this.base}/contact-admin`, data));
  }

  logout() {
    localStorage.removeItem(STORAGE_KEY + '_token');
    localStorage.removeItem(STORAGE_KEY + '_user');
    this._token.set(null);
    this._user.set(null);
  }
}
