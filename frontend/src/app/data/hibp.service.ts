import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface HibpResult {
  pwned: boolean;
  count: number;
}

/**
 * Have I Been Pwned — k-Anonymity password check.
 * Sends only the first 5 chars of the SHA-1 hash to api.pwnedpasswords.com;
 * the full password / full hash never leaves the browser.
 *
 * https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
@Injectable({ providedIn: 'root' })
export class HibpService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.pwnedpasswords.com/range';

  private async sha1Hex(input: string): Promise<string> {
    const buf = new TextEncoder().encode(input);
    const hashBuf = await crypto.subtle.digest('SHA-1', buf as BufferSource);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  async check(password: string): Promise<HibpResult> {
    if (!password) return { pwned: false, count: 0 };
    const hash = await this.sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const body = await firstValueFrom(
      this.http.get(`${this.apiUrl}/${prefix}`, { responseType: 'text' }),
    );
    for (const line of body.split(/\r?\n/)) {
      const [s, c] = line.split(':');
      if (s?.trim().toUpperCase() === suffix) {
        return { pwned: true, count: parseInt(c, 10) || 0 };
      }
    }
    return { pwned: false, count: 0 };
  }
}
