import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { SettingsService } from '../core/services/settings.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="admin-brand">
          <span class="logo-text">LEART<span class="dot">.</span>ADMIN</span>
          <span class="badge">Panel Control</span>
        </div>

        <nav class="admin-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
            <span class="icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/admin/configuracion" routerLinkActive="active" class="nav-item">
            <span class="icon">📱</span>
            <span>WhatsApp y Ajustes</span>
          </a>
          <a routerLink="/admin/productos" routerLinkActive="active" class="nav-item">
            <span class="icon">🧱</span>
            <span>Catálogo Productos</span>
          </a>
          <a routerLink="/admin/pedidos" routerLinkActive="active" class="nav-item">
            <span class="icon">📥</span>
            <span>Pedidos y Fotos</span>
          </a>
        </nav>

        <div class="admin-sidebar-footer">
          <div class="user-chip">
            <span class="avatar">👤</span>
            <div class="user-info">
              <strong>{{ auth.currentUser()?.username || 'Admin' }}</strong>
              <small>{{ auth.currentUser()?.email || 'admin@leart.store' }}</small>
            </div>
          </div>
          <div class="footer-actions">
            <a routerLink="/" target="_blank" class="store-link">
              <span>↗ Ver Tienda</span>
            </a>
            <button type="button" (click)="logout()" class="logout-btn">
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <main class="admin-main">
        <header class="admin-topbar">
          <div class="topbar-left">
            <span class="whatsapp-status">
              🟢 WhatsApp activo: <strong>+{{ settings.settings().whatsAppNumber }}</strong>
            </span>
          </div>
          <div class="topbar-right">
            <a [href]="'https://wa.me/' + settings.settings().whatsAppNumber" target="_blank" class="test-wa-btn">
              Probar chat WhatsApp ↗
            </a>
          </div>
        </header>

        <div class="admin-content">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      min-height: 100vh;
      background: #f7f9fa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
    }
    .admin-sidebar {
      width: 260px;
      background: #0f1419;
      color: #f0f3f5;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      border-right: 1px solid rgba(255,255,255,0.08);
    }
    .admin-brand {
      padding: 1.5rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo-text {
      font-weight: 900;
      letter-spacing: 0.1em;
      font-size: 1.1rem;
    }
    .logo-text .dot { color: #f59e0b; }
    .admin-brand .badge {
      font-size: 0.65rem;
      background: rgba(245, 158, 11, 0.18);
      color: #f59e0b;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .admin-nav {
      padding: 1.25rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: #9ca3af;
      text-decoration: none;
      border-radius: 0.5rem;
      font-size: 0.92rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .nav-item .icon { font-size: 1.1rem; }
    .nav-item:hover {
      background: rgba(255,255,255,0.06);
      color: #ffffff;
    }
    .nav-item.active {
      background: #ffffff;
      color: #0f1419;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .admin-sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255,255,255,0.08);
      background: rgba(0,0,0,0.2);
    }
    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.75rem;
    }
    .user-chip .avatar {
      font-size: 1.3rem;
      background: rgba(255,255,255,0.1);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-info strong { font-size: 0.85rem; color: #fff; }
    .user-info small { font-size: 0.72rem; color: #9ca3af; text-overflow: ellipsis; overflow: hidden; }
    .footer-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .store-link, .logout-btn {
      font-size: 0.75rem;
      color: #9ca3af;
      text-decoration: none;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      transition: color 0.15s;
    }
    .store-link:hover, .logout-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }
    .admin-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .admin-topbar {
      height: 60px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
    }
    .whatsapp-status {
      font-size: 0.85rem;
      color: #374151;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
    }
    .test-wa-btn {
      font-size: 0.82rem;
      background: #25d366;
      color: #ffffff;
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      transition: opacity 0.15s;
    }
    .test-wa-btn:hover { opacity: 0.9; }
    .admin-content {
      padding: 2rem;
      flex: 1;
      overflow-y: auto;
    }
    @media (max-width: 900px) {
      .admin-shell { flex-direction: column; }
      .admin-sidebar { width: 100%; }
      .admin-nav { flex-direction: row; flex-wrap: wrap; }
      .admin-topbar { padding: 0 1rem; }
      .admin-content { padding: 1rem; }
    }
  `],
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  readonly settings = inject(SettingsService);

  logout(): void {
    this.auth.logout();
  }
}
