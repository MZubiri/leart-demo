import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <a routerLink="/" class="brand-link">
            <span class="brand-main">LEART</span><span class="brand-dot">.</span><span class="brand-store">ADMIN</span>
          </a>
          <h1>Iniciar sesión</h1>
          <p>Ingresa tus credenciales para administrar la tienda y configurar WhatsApp.</p>
        </div>

        @if (errorMessage()) {
          <div class="error-banner">
            <span>⚠️</span>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label for="username">Usuario</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="admin"
              required
              [ngModel]="username()"
              (ngModelChange)="username.set($event)"
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              [ngModel]="password()"
              (ngModelChange)="password.set($event)"
            />
          </div>

          <button type="submit" [disabled]="loading()" class="login-button">
            @if (loading()) {
              <span>Verificando...</span>
            } @else {
              <span>Acceder al Panel →</span>
            }
          </button>
        </form>

        <div class="login-footer">
          <small>Credenciales iniciales: <code>admin</code> / <code>Leart2026!</code></small>
          <a routerLink="/" class="back-link">← Volver a la tienda</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f1419;
      padding: 1.5rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .login-card {
      background: #ffffff;
      border-radius: 1rem;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .brand-link {
      text-decoration: none;
      font-size: 1.25rem;
      font-weight: 900;
      letter-spacing: 0.1em;
      color: #111;
      display: inline-block;
      margin-bottom: 1rem;
    }
    .brand-dot { color: #f59e0b; }
    .brand-store { font-weight: 400; opacity: 0.8; }
    .login-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111;
      margin-bottom: 0.5rem;
    }
    .login-header p {
      color: #6b7280;
      font-size: 0.88rem;
      line-height: 1.4;
    }
    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      text-align: left;
    }
    .form-group label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #374151;
    }
    .form-group input {
      padding: 0.75rem 0.9rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-group input:focus {
      outline: none;
      border-color: #0f1419;
      box-shadow: 0 0 0 3px rgba(15, 20, 25, 0.1);
    }
    .login-button {
      padding: 0.85rem;
      background: #0f1419;
      color: #ffffff;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      margin-top: 0.5rem;
    }
    .login-button:hover:not(:disabled) {
      background: #232d36;
    }
    .login-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .login-footer {
      margin-top: 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      color: #9ca3af;
      font-size: 0.78rem;
    }
    .login-footer code {
      background: #f3f4f6;
      padding: 0.15rem 0.35rem;
      border-radius: 0.25rem;
      color: #111;
      font-size: 0.8rem;
    }
    .back-link {
      color: #4b5563;
      text-decoration: none;
      transition: color 0.15s;
    }
    .back-link:hover { color: #111; }
  `],
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly username = signal('admin');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  onLogin(): void {
    if (!this.username() || !this.password()) {
      this.errorMessage.set('Completa el usuario y la contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.login({ username: this.username().trim(), password: this.password().trim() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Usuario o contraseña incorrectos.');
      },
    });
  }
}
