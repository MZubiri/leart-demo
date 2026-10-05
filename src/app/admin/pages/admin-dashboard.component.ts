import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService, OrderAdmin, SiteSettingAdmin } from '../../core/services/admin.service';
import { Product } from '../../store/products';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page">
      <div class="page-header">
        <div>
          <h1>Dashboard General</h1>
          <p>Bienvenido al centro de administración de Leart Store.</p>
        </div>
      </div>

      <!-- Quick Metrics Cards -->
      <div class="metrics-grid">
        <div class="metric-card highlight">
          <div class="card-icon">📱</div>
          <div class="card-body">
            <span class="card-label">WhatsApp de Contacto</span>
            <strong class="card-val">+{{ settings()?.whatsAppNumber || 'Sin configurar' }}</strong>
            <small>Configurable en tiempo real</small>
          </div>
          <a routerLink="/admin/configuracion" class="card-link">Modificar →</a>
        </div>

        <div class="metric-card">
          <div class="card-icon">🧱</div>
          <div class="card-body">
            <span class="card-label">Productos en Catálogo</span>
            <strong class="card-val">{{ products().length }}</strong>
            <small>{{ activeProductsCount() }} productos activos</small>
          </div>
          <a routerLink="/admin/productos" class="card-link">Gestionar →</a>
        </div>

        <div class="metric-card">
          <div class="card-icon">📥</div>
          <div class="card-body">
            <span class="card-label">Pedidos / Personalizaciones</span>
            <strong class="card-val">{{ orders().length }}</strong>
            <small>{{ pendingOrdersCount() }} pendientes por revisar</small>
          </div>
          <a routerLink="/admin/pedidos" class="card-link">Ver pedidos →</a>
        </div>
      </div>

      <!-- Recent Orders Section -->
      <div class="dashboard-section">
        <div class="section-head">
          <h2>Últimos pedidos de personalización recibidos</h2>
          <a routerLink="/admin/pedidos" class="view-all-link">Ver todos ({{ orders().length }}) →</a>
        </div>

        @if (loading()) {
          <div class="loading-state">Cargando datos...</div>
        } @else if (orders().length === 0) {
          <div class="empty-state">
            <span>📭</span>
            <p>Aún no se han recibido pedidos de personalización desde la web.</p>
          </div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Cliente</th>
                  <th>WhatsApp</th>
                  <th>Producto</th>
                  <th>Fotos adjuntas</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                @for (order of orders().slice(0, 5); track order.id) {
                  <tr>
                    <td><strong>{{ order.orderReference }}</strong></td>
                    <td>{{ order.customerName }}</td>
                    <td>
                      <a [href]="'https://wa.me/' + order.phone.replace('+', '').trim()" target="_blank" class="phone-link">
                        {{ order.phone }} ↗
                      </a>
                    </td>
                    <td>{{ order.productTitle }}</td>
                    <td>
                      <span class="badge" [class.badge-has-photos]="order.attachments.length > 0">
                        {{ order.attachments.length }} foto(s)
                      </span>
                    </td>
                    <td>
                      <span class="status-chip" [class]="'status-' + order.status.toLowerCase().replace(' ', '-')">
                        {{ order.status }}
                      </span>
                    </td>
                    <td><small>{{ order.createdAt | date: 'short' }}</small></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    .page-header p {
      color: #6b7280;
      font-size: 0.95rem;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .metric-card {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 0.85rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.06);
    }
    .metric-card.highlight {
      border-color: #bbf7d0;
      background: linear-gradient(to bottom right, #ffffff, #f0fdf4);
    }
    .card-icon {
      font-size: 1.75rem;
      margin-bottom: 0.75rem;
    }
    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .card-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .card-val {
      font-size: 1.6rem;
      font-weight: 800;
      color: #111827;
    }
    .card-body small {
      color: #9ca3af;
      font-size: 0.8rem;
    }
    .card-link {
      margin-top: 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #111827;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .card-link:hover { text-decoration: underline; }
    .dashboard-section {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 0.85rem;
      border: 1px solid #e5e7eb;
    }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }
    .section-head h2 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #111827;
    }
    .view-all-link {
      font-size: 0.85rem;
      font-weight: 600;
      color: #2563eb;
      text-decoration: none;
    }
    .view-all-link:hover { text-decoration: underline; }
    .table-container {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
      text-align: left;
    }
    .data-table th {
      padding: 0.75rem 1rem;
      background: #f9fafb;
      color: #4b5563;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
    }
    .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f3f4f6;
      color: #1f2937;
    }
    .phone-link {
      color: #059669;
      font-weight: 600;
      text-decoration: none;
    }
    .phone-link:hover { text-decoration: underline; }
    .badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      background: #f3f4f6;
      color: #6b7280;
    }
    .badge.badge-has-photos {
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 600;
    }
    .status-chip {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-weight: 600;
    }
    .status-chip.status-pendiente { background: #fef3c7; color: #b45309; }
    .status-chip.status-en-producción, .status-chip.status-en-produccion { background: #dbeafe; color: #1e40af; }
    .status-chip.status-completado { background: #dcfce7; color: #15803d; }
    .empty-state, .loading-state {
      padding: 2.5rem;
      text-align: center;
      color: #9ca3af;
    }
    .empty-state span { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly settings = signal<SiteSettingAdmin | null>(null);
  readonly products = signal<Product[]>([]);
  readonly orders = signal<OrderAdmin[]>([]);
  readonly loading = signal(true);

  readonly activeProductsCount = signal(0);
  readonly pendingOrdersCount = signal(0);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.admin.getSettings().subscribe({
      next: (s) => this.settings.set(s),
      error: () => {},
    });

    this.admin.getProducts().subscribe({
      next: (p) => {
        this.products.set(p);
        this.activeProductsCount.set(p.filter((x) => x.isActive).length);
      },
      error: () => {},
    });

    this.admin.getOrders().subscribe({
      next: (o) => {
        this.orders.set(o);
        this.pendingOrdersCount.set(o.filter((x) => x.status === 'Pendiente').length);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
