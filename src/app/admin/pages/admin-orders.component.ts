import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { httpErrorMessage } from '../../core/services/http-error';
import { DatePipe } from '@angular/common';
import { DestroyRef, Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { AdminService, OrderAdmin, OrderSummary } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="orders-page">
      <div class="page-header">
        <div>
          <h1>Pedidos de Personalización y Fotos</h1>
          <p>Revisa la información y fotografías adjuntas que los clientes completan tras confirmar su pago.</p>
        </div>
      </div>

      @if (loadError()) { <div role="alert">{{ loadError() }} @if (orders().length) { <p>Se conservan los datos de {{ loadedStatus() }}, página {{ loadedPage() }}.</p> } <button type="button" (click)="loadOrders()">Reintentar carga</button></div> }
      @if (actionError()) { <p role="alert">{{ actionError() }}</p> }
      @if (mutating()) { <p role="status">Guardando cambio...</p> }
      @if (notice()) { <p role="status">{{ notice() }}</p> }
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
        } @else if (loadError() && orders().length === 0) { <p>Los pedidos no están disponibles.</p> } @else if (orders().length === 0) {
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
                        [class.has-photos]="order.attachmentCount > 0"
                        (click)="openDetailModal(order)"
                      >
                        📷 {{ order.attachmentCount }} foto(s)
                      </button>
                    </td>
                    <td>
                      <select
                        class="status-select"
                        [class]="'select-' + order.status.toLowerCase().replace(' ', '-')"
                        [value]="order.status" [disabled]="mutating() || loading() || !!loadError()"
                        (change)="onStatusChange(order, $any($event.target).value, $any($event.target))"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En producción">En producción</option>
                        <option value="Completado">Completado</option><option value="Cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td><small>{{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}</small></td>
                    <td>
                      <div class="btn-group">
                        <button type="button" class="btn-detail" (click)="openDetailModal(order)">
                          Ver detalles
                        </button>
                        <button type="button" class="btn-delete" [disabled]="mutating() || loading() || !!loadError()" (click)="deleteOrder(order)">
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

      <nav aria-label="Páginas de pedidos">
        <button type="button" [disabled]="loading() || page() <= 1" (click)="goPage(page() - 1)">Anterior</button>
        <span>Página {{ page() }} de {{ pages() }} · {{ total() }} pedidos</span>
        <button type="button" [disabled]="loading() || page() >= pages()" (click)="goPage(page() + 1)">Siguiente</button>
      </nav>
      @if (detailLoading()) { <p role="status">Cargando detalle...</p> }
      @if (detailError()) { <p role="alert">{{ detailError() }}</p> }
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
                @if (attachmentError()) { <p role="alert">{{ attachmentError() }}</p> }
                @if (o.attachments.length === 0) {
                  <p class="no-photos">El cliente no adjuntó fotos en este formulario (se enviaron por chat).</p>
                } @else {
                  <div class="photos-grid">
                    @for (att of o.attachments; track att.id) {
                      <div class="photo-card">
                        @if (attachmentUrls()[att.id]) {
                        <a [href]="attachmentUrls()[att.id]" target="_blank" title="Abrir en tamaño completo">
                          <img [src]="attachmentUrls()[att.id]" [alt]="att.originalFileName" />
                        </a>
                        <div class="photo-meta">
                          <small>{{ att.originalFileName }}</small>
                          <a [href]="att.url" [download]="att.originalFileName" class="download-link">Descargar ⬇</a>
                        </div>
                        } @else { <p>Foto pendiente de carga.</p> }
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
export class AdminOrdersComponent implements OnInit, OnDestroy {
  private readonly admin = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusList = ['Todos', 'Pendiente', 'En producción', 'Completado', 'Cancelado'];
  readonly selectedStatus = signal('Todos');
  readonly orders = signal<OrderSummary[]>([]);
  readonly page = signal(1);
  readonly total = signal(0);
  readonly pageSize = 20;
  readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  readonly detailLoading = signal(false);
  readonly detailError = signal('');
  private detailRequest?: Subscription;
  readonly loading = signal(true);
  readonly loadError = signal(''); readonly actionError = signal(''); readonly notice = signal('');
  readonly mutating = signal(false); readonly loadedStatus = signal(''); readonly loadedPage = signal(1);
  private listRequest?: Subscription;
  readonly attachmentUrls = signal<Record<number, string>>({});
  readonly attachmentError = signal('');
  private previewRequests: Subscription[] = [];
  readonly activeOrder = signal<OrderAdmin | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.listRequest?.unsubscribe(); this.loadError.set(''); this.loading.set(true);
    this.listRequest = this.admin.getOrders(this.selectedStatus(), this.page(), this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.loadedStatus.set(this.selectedStatus()); this.loadedPage.set(this.page());
        this.orders.set(data.items);
        this.total.set(data.total);
        if (this.page() > this.pages()) { this.page.set(this.pages()); this.loadOrders(); return; }
        this.loading.set(false);
      },
      error: error => { this.loadError.set(httpErrorMessage(error, 'No se pudieron cargar los pedidos.')); this.loading.set(false); },
    });
  }

  filterByStatus(status: string): void {
    this.selectedStatus.set(status);
    this.page.set(1);
    this.loadOrders();
  }

  onStatusChange(order: OrderSummary, newStatus: string, control?: HTMLSelectElement): void {
    if (control) control.value = order.status;
    if (this.mutating() || this.loading() || this.loadError()) return;
    this.mutating.set(true); this.actionError.set(''); this.notice.set('');
    this.admin.updateOrderStatus(order.id, newStatus).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.mutating.set(false); this.notice.set('Estado guardado.');
        this.orders.update(list => list.map(item => item.id === order.id ? { ...item, status: newStatus } : item)); this.loadOrders();
      },
      error: error => { this.mutating.set(false); this.actionError.set(httpErrorMessage(error, 'No se pudo guardar el estado.')); },
    });
  }

  deleteOrder(order: OrderSummary): void {
    if (this.mutating() || this.loading() || this.loadError() || !confirm('¿Eliminar el pedido "' + order.orderReference + '"?')) return;
    this.mutating.set(true); this.actionError.set(''); this.notice.set('');
    this.admin.deleteOrder(order.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.mutating.set(false); this.notice.set('Pedido eliminado.'); this.loadOrders(); },
      error: error => { this.mutating.set(false); this.actionError.set(httpErrorMessage(error, 'No se pudo eliminar el pedido.')); },
    });
  }

  goPage(page: number): void { if (page < 1 || page > this.pages()) return; this.page.set(page); this.loadOrders(); }

  openDetailModal(summary: OrderSummary): void {
    this.closeDetailModal(); this.detailLoading.set(true); this.detailError.set('');
    this.detailRequest = this.admin.getOrderById(summary.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: order => { this.detailLoading.set(false); this.showOrder(order); },
      error: () => { this.detailLoading.set(false); this.detailError.set('No se pudo cargar el pedido. Vuelve a abrirlo para reintentar.'); },
    });
  }

  private showOrder(order: OrderAdmin): void {
    this.activeOrder.set(order);
    for (const attachment of order.attachments) {
      this.previewRequests.push(this.admin.getAttachment(attachment.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (blob) => {
          const type = /^image\/(png|jpeg|webp|gif)$/.test(attachment.contentType) ? attachment.contentType : 'application/octet-stream';
          const preview = new Blob([blob], { type });
          this.attachmentUrls.update((urls) => ({ ...urls, [attachment.id]: URL.createObjectURL(preview) }));
        },
        error: () => this.attachmentError.set('No se pudo cargar una foto. Cierra y vuelve a abrir el pedido para reintentar.'),
      }));
    }
  }

  closeDetailModal(): void {
    this.detailRequest?.unsubscribe(); this.detailLoading.set(false);
    this.previewRequests.forEach((request) => request.unsubscribe());
    this.previewRequests = [];
    Object.values(this.attachmentUrls()).forEach((url) => URL.revokeObjectURL(url));
    this.attachmentUrls.set({});
    this.attachmentError.set('');
    this.activeOrder.set(null);
  }

  ngOnDestroy(): void { this.listRequest?.unsubscribe(); this.closeDetailModal(); }

  buildCustomerWhatsAppUrl(order: Pick<OrderAdmin, 'phone' | 'customerName' | 'orderReference'>): string {
    const cleanPhone = order.phone.replace(/\D/g, '');
    const message = `Hola ${order.customerName} 👋 Te saludamos de Leart Store respecto a tu pedido ${order.orderReference}.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
}
