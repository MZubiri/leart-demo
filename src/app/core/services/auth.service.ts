import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  token: string;
  username: string;
  email: string;
  role: string;
  expiresAt: string;
}

export interface UserProfile {
  id?: number;
  username: string;
  email: string;
  role: string;
}

const TOKEN_KEY = 'leart_admin_token';
const USER_KEY = 'leart_admin_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(this.getInitialToken());
  readonly currentUser = signal<UserProfile | null>(this.getInitialUser());
  readonly isAuthenticated = signal<boolean>(Boolean(this.token()));

  private getInitialToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private getInitialUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/admin/auth/login`, credentials).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        const user: UserProfile = { username: res.username, email: res.email, role: res.role };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.token.set(res.token);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/admin/login']);
  }
}
