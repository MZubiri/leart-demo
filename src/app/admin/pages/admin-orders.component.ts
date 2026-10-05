import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, OrderAdmin } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="orders-page">
      <div class="page-header">
        <div>
          <h1>Pedidos de Personalización y Fotos</h1>
          <p>Revisa la información y fotografías adjuntas que los clientes completan tras confirmar su pago.</p>
        </div>
      </div>

      <!-- Filter by status -->
      <div class="filter-bar">
        <div class="status-tabs">
          @for (st of statusList; track st) {
            <button
              type="button"
              class="tab-btn"
              [class.active]="selectedStatus() === st"
              (click)="filterByStatus(st)"
            >
              {{ st }}
            </button>
          }
        </div>
      </div>

      <!-- Orders Table -->
      <div class="table-card">
        @if (loading()) {
          <div class="table-loading">Cargando pedidos...</div>
        } @else if (orders().length === 0) {
          <div class="table-empty">
            <span>📭</span>
            <p>No hay pedidos con el estado "{{ selectedStatus() }}".</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Cliente</th>
                  <th>WhatsApp Cliente</th>
                  <th>Producto</th>
                  <th>Fotos</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th class="actions-th">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (order of orders(); track order.id) {
                  <tr>
                    <td><strong>{{ order.orderReference }}</strong></td>
                    <td>
                      <div class="customer-col">
                        <strong>{{ order.customerName }}</strong>
                        @if (order.peopleDetails) {
                          <small>Figuras: {{ order.peopleDetails }}</small>
                        }
                      </div>
                    </td>
                    <td>
                      <a [href]="buildCustomerWhatsAppUrl(order)" target="_blank" class="wa-chat-link">
                        <span>💬 {{ order.phone }}</span>
                      </a>
                    </td>
                    <td><span class="product-tag">{{ order.productTitle }}</span></td>
                    <td>
                      <button
                        type="button"
                        class="photos-badge"
                        [class.has-photos]="order.attachments.length > 0"
                        (click)="openDetailModal(order)"
                      >
                        📷 {{ order.attachments.length }} foto(s)
                      </button>
                    </td>
                    <td>
                      <select
                        class="status-select"
                        [class]="'select-' + order.status.toLowerCase().replace(' ', '-')"
                        [ngModel]="order.status"
                        (ngModelChange)="onStatusChange(order, $event)"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En producción">En producción</option>
                        <option value="Completado">Completado</option>
                      </select>
                    </td>
                    <td><small>{{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}</small></td>
                    <td>
                      <div class="btn-group">
                        <button type="button" class="btn-detail" (click)="openDetailModal(order)">
                          Ver detalles
                        </button>
                        <button type="button" class="btn-delete" (click)="deleteOrder(order)">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Detail & Photos Modal -->
      @if (activeOrder(); as o) {
        <div class="modal-backdrop" (click)="closeDetailModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2>Pedido: {{ o.orderReference }}</h2>
                <span class="subtitle">Registrado el {{ o.createdAt | date: 'medium' }}</span>
              </div>
              <button type="button" class="close-btn" (click)="closeDetailModal()">×</button>
            </div>

            <div class="modal-body">
              <!-- Customer Info -->
              <div class="info-block">
                <h3>Datos de Contacto</h3>
                <div class="info-grid">
                  <div><strong>Nombre:</strong> {{ o.customerName }}</div>
                  <div>
                    <strong>WhatsApp:</strong>
                    <a [href]="buildCustomerWhatsAppUrl(o)" target="_blank" class="wa-chat-link">
                      {{ o.phone }} (Abrir chat) ↗
                    </a>
                  </div>
                  <div><strong>Producto:</strong> {{ o.productTitle }}</div>
                  <div><strong>Estado:</strong> {{ o.status }}</div>
                </div>
              </div>

              <!-- Order Details -->
              <div class="info-block">
                <h3>Indicaciones del Diseño</h3>
                <div class="details-list">
                  <div>
                    <strong>Personas o mascotas a representar:</strong>
                    <p>{{ o.peopleDetails || 'No especificado' }}</p>
                  </div>
                  <div>
                    <strong>Historia u ocasión:</strong>
                    <p>{{ o.story || 'No especificado' }}</p>
                  </div>
                  <div>
                    <strong>Nombres, fecha o frase:</strong>
                    <p class="highlight-phrase">{{ o.phrase || 'Sin frase adicional' }}</p>
                  </div>
                  <div>
                    <strong>Requerimientos especiales:</strong>
                    <p>{{ o.requirements || 'Sin requerimientos especiales' }}</p>
                  </div>
                </div>
              </div>

              <!-- Photos Gallery -->
              <div class="info-block">
                <h3>Fotos de Referencia Adjuntas ({{ o.attachments.length }})</h3>
                @if (o.attachments.length === 0) {
                  <p class="no-photos">El cliente no adjuntó fotos en este formulario (se enviaron por chat).</p>
                } @else {
                  <div class="photos-grid">
                    @for (att of o.attachments; track att.id) {
                      <div class="photo-card">
                        <a [href]="att.url" target="_blank" title="Abrir en tamaño completo">
                          <img [src]="att.url" [alt]="att.originalFileName" />
                        </a>
                        <div class="photo-meta">
                          <small>{{ att.originalFileName }}</small>
                          <a [href]="att.url" target="_blank" class="download-link">Descargar ⬇</a>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-close" (click)="closeDetailModal()">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
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
    .filter-bar {
      display: flex;
      background: #ffffff;
      padding: 0.75rem 1.25rem;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
    }
    .status-tabs {
      display: flex;
      gap: 0.5rem;
    }
    .tab-btn {
      padding: 0.45rem 1rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid transparent;
      background: transparent;
      color: #4b5563;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn:hover { background: #f3f4f6; }
    .tab-btn.active {
      background: #0f1419;
      color: #ffffff;
    }
    .table-card {
      background: #ffffff;
      border-radius: 0.85rem;
      border: 1px solid #e5e7eb;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .table-responsive { overflow-x: auto; }
    .orders-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }
    .orders-table th {
      padding: 0.85rem 1rem;
      background: #f9fafb;
      color: #4b5563;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
    }
    .orders-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
    }
    .customer-col {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .customer-col small { color: #6b7280; }
    .wa-chat-link {
      color: #059669;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .wa-chat-link:hover { text-decoration: underline; }
    .product-tag {
      background: #f3f4f6;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 500;
    }
    .photos-badge {
      border: none;
      cursor: pointer;
      background: #f3f4f6;
      color: #6b7280;
      padding: 0.3rem 0.65rem;
      border-radius: 0.4rem;
      font-size: 0.78rem;
      font-weight: 600;
      transition: background 0.15s;
    }
    .photos-badge.has-photos {
      background: #e0e7ff;
      color: #4338ca;
    }
    .status-select {
      padding: 0.3rem 0.6rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      border: 1px solid transparent;
      cursor: pointer;
    }
    .select-pendiente { background: #fef3c7; color: #b45309; }
    .select-en-producción, .select-en-produccion { background: #dbeafe; color: #1e40af; }
    .select-completado { background: #dcfce7; color: #15803d; }
    .btn-group { display: flex; gap: 0.4rem; align-items: center; }
    .btn-detail {
      padding: 0.35rem 0.65rem;
      background: #0f1419;
      color: #fff;
      border: none;
      border-radius: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-detail:hover { background: #232d36; }
    .btn-delete {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.95rem;
      opacity: 0.6;
      transition: opacity 0.15s;
    }
    .btn-delete:hover { opacity: 1; }
    .table-loading, .table-empty {
      padding: 3rem;
      text-align: center;
      color: #9ca3af;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(2px);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-card {
      background: #ffffff;
      width: 100%;
      max-width: 720px;
      max-height: 90vh;
      border-radius: 1rem;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-header h2 { font-size: 1.25rem; font-weight: 800; color: #111827; }
    .subtitle { font-size: 0.8rem; color: #6b7280; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #9ca3af; }
    .close-btn:hover { color: #111; }
    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .info-block {
      border: 1px solid #f3f4f6;
      border-radius: 0.75rem;
      padding: 1.25rem;
      background: #fafbfc;
    }
    .info-block h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.85rem;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0.4rem;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      font-size: 0.88rem;
    }
    .details-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      font-size: 0.88rem;
    }
    .details-list strong { color: #374151; font-size: 0.82rem; }
    .details-list p { margin-top: 0.15rem; color: #111827; }
    .highlight-phrase {
      background: #fef3c7;
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.3rem;
      font-weight: 600;
      color: #92400e;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 1rem;
      margin-top: 0.5rem;
    }
    .photo-card {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
      background: #ffffff;
      display: flex;
      flex-direction: column;
    }
    .photo-card img {
      width: 100%;
      height: 110px;
      object-fit: cover;
      display: block;
      transition: transform 0.15s;
    }
    .photo-card img:hover { transform: scale(1.03); }
    .photo-meta {
      padding: 0.4rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .photo-meta small {
      font-size: 0.68rem;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .download-link {
      font-size: 0.72rem;
      color: #2563eb;
      font-weight: 600;
      text-decoration: none;
    }
    .download-link:hover { text-decoration: underline; }
    .no-photos { color: #6b7280; font-size: 0.85rem; font-style: italic; }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
    }
    .btn-close {
      padding: 0.6rem 1.25rem;
      background: #0f1419;
      color: #fff;
      border: none;
      border-radius: 0.4rem;
      font-weight: 600;
      cursor: pointer;
    }
  `],
})
export class AdminOrdersComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly statusList = ['Todos', 'Pendiente', 'En producción', 'Completado'];
  readonly selectedStatus = signal('Todos');
  readonly orders = signal<OrderAdmin[]>([]);
  readonly loading = signal(true);
  readonly activeOrder = signal<OrderAdmin | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.admin.getOrders(this.selectedStatus()).subscribe({
      next: (data) => {
        this.orders.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterByStatus(status: string): void {
    this.selectedStatus.set(status);
    this.loadOrders();
  }

  onStatusChange(order: OrderAdmin, newStatus: string): void {
    this.admin.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        this.orders.update((list) =>
          list.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)),
        );
      },
    });
  }

  deleteOrder(order: OrderAdmin): void {
    if (confirm(`¿Eliminar el pedido "${order.orderReference}"?`)) {
      this.admin.deleteOrder(order.id).subscribe({
        next: () => {
          this.orders.update((list) => list.filter((o) => o.id !== order.id));
        },
      });
    }
  }

  openDetailModal(order: OrderAdmin): void {
    this.activeOrder.set(order);
  }

  closeDetailModal(): void {
    this.activeOrder.set(null);
  }

  buildCustomerWhatsAppUrl(order: OrderAdmin): string {
    const cleanPhone = order.phone.replace(/\D/g, '');
    const message = `Hola ${order.customerName} 👋 Te saludamos de Leart Store respecto a tu pedido ${order.orderReference}.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
}
