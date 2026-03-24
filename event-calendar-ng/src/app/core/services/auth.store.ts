import { Injectable, signal, computed } from '@angular/core';
import { AuthResponse, UserResponse } from '../models';

const TOKEN_KEY = 'ec_token';
const USER_KEY  = 'ec_user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  // Use sessionStorage so login doesn't persist across browser sessions
  private _auth  = signal<AuthResponse | null>(this.loadAuth());
  private _token = signal<string | null>(this.loadToken());

  readonly token         = this._token.asReadonly();
  readonly user          = computed(() => {
    const auth = this._auth();
    if (!auth?.user) return null;
    const u = auth.user;
    return {
      ...u,
      fullName: u.fullName || `${u.firstName} ${u.lastName}`.trim() || u.username || ''
    };
  });
  readonly isLoggedIn    = computed(() => !!this._token());
  readonly isAdmin       = computed(() => this._auth()?.user?.role === 'Admin');
  readonly currentUserId = computed(() => this._auth()?.user?.id ?? null);

  setAuth(auth: AuthResponse): void {
    sessionStorage.setItem(TOKEN_KEY, auth.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(auth));
    this._token.set(auth.token);
    this._auth.set(auth);
  }

  clearAuth(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    // Also clear any old localStorage entries
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._auth.set(null);
  }

  private loadToken(): string | null {
    // Migrate from localStorage if present (one-time cleanup)
    const lsToken = localStorage.getItem(TOKEN_KEY);
    if (lsToken) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return sessionStorage.getItem(TOKEN_KEY);
  }

  private loadAuth(): AuthResponse | null {
    try {
      // Migrate from localStorage if present (one-time cleanup)
      const lsRaw = localStorage.getItem(USER_KEY);
      if (lsRaw) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }
}
