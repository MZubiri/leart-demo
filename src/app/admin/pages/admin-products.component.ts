import { ModalDialogDirective } from '../../shared/modal-dialog.directive';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { httpErrorMessage } from '../../core/services/http-error';
import { CommonModule } from '@angular/common';
import { DestroyRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, ProductWriteRequest } from '../../core/services/admin.service';
import { ProductsService } from '../../core/services/products.service';
import { Category, Product } from '../../store/products';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [ModalDialogDirective, CommonModule, FormsModule],
  template: `
    <div class="products-page">
      <div class="page-header">
        <div>
          <h1>Gestión de Productos</h1>
          <p>Administra los productos del catálogo, fotos, descripciones y límites de minifiguras.</p>
        </div>
        <button type="button" class="btn-create" [disabled]="loading() || !!loadError() || mutating()" (click)="openCreateModal()">
          <span>＋ Nuevo Producto</span>
        </button>
      </div>

      @if (loadError()) { <div role="alert">{{ loadError() }} @if (products().length) { <p>Se conservan los últimos productos cargados.</p> } <button type="button" (click)="loadProducts()">Reintentar carga</button></div> }
      @if (actionError()) { <p role="alert">{{ actionError() }}</p> }
      @if (mutating()) { <p role="status">Guardando cambio...</p> }
      @if (notice()) { <p role="status">{{ notice() }}</p> }
      <!-- Filters Bar -->
      <div class="filter-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input aria-label="Buscar productos" name="productControl1"
            type="text"
            placeholder="Buscar por nombre o detalle..."
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
          />
        </div>

        <div class="category-filters">
          @for (cat of categories; track cat) {
            <button
              type="button"
              class="cat-chip"
              [class.active]="selectedCategory() === cat"
              (click)="selectedCategory.set(cat)"
            >
              {{ cat }}
            </button>
          }
        </div>
      </div>

      <!-- Products Table -->
      <div class="table-card">
        @if (loading()) {
          <div class="table-loading">Cargando productos...</div>
        } @else if (loadError() && products().length === 0) { <p>El catálogo no está disponible.</p> } @else if (filteredProducts().length === 0) {
          <div class="table-empty">No se encontraron productos con estos criterios.</div>
        } @else {
          <div class="table-responsive">
            <table class="products-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre y Slug</th>
                  <th>Categoría</th>
                  <th>Detalle / Piezas</th>
                  <th>Capacidad</th>
                  <th>Estado</th>
                  <th class="actions-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (prod of filteredProducts(); track prod.id) {
                  <tr [class.inactive-row]="!prod.isActive">
                    <td class="col-img">
                      <img [src]="prod.image" [alt]="prod.name" (error)="onImgError($event)" />
                    </td>
                    <td>
                      <div class="name-col">
                        <strong>{{ prod.name }}</strong>
                        <small><code>{{ prod.id }}</code> · {{ prod.kicker }}</small>
                      </div>
                    </td>
                    <td>
                      <span class="cat-badge">{{ prod.category }}</span>
                    </td>
                    <td>{{ prod.detail }}</td>
                    <td>
                      <small>{{ prod.minFigures }} a {{ prod.maxFigures }} figs @if (prod.allowsPets) { + 🐶 }</small>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="toggle-btn"
                        [class.active]="prod.isActive"
                        [disabled]="mutating() || loading() || !!loadError()" (click)="toggleActive(prod)"
                      >
                        {{ prod.isActive ? 'Activo' : 'Pausado' }}
                      </button>
                    </td>
                    <td class="col-actions">
                      <button type="button" class="btn-action edit" [disabled]="mutating() || loading() || !!loadError()" (click)="openEditModal(prod)">
                        Editar
                      </button>
                      <button type="button" class="btn-action delete" [disabled]="mutating() || loading() || !!loadError()" (click)="deleteProduct(prod)">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Create / Edit Modal -->
      @if (modalOpen()) {
        <div class="modal-backdrop" data-modal-layer (click)="closeModal()">
          <div leartModal (modalDismiss)="closeModal()" aria-labelledby="product-dialog-title" class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 id="product-dialog-title">{{ isEditing() ? 'Editar Producto' : 'Crear Nuevo Producto' }}</h2>
              <button type="button" class="close-btn" aria-label="Cerrar diálogo" (click)="closeModal()">×</button>
            </div>

            <form (ngSubmit)="saveModalProduct()" class="modal-form">
              @if (modalError()) { <p role="alert">{{ modalError() }}</p> }
              @if (uploading()) { <p role="status">Subiendo imagen...</p> }
              <fieldset [disabled]="modalSaving() || uploading()" style="border:0;padding:0;margin:0;min-width:0"><div class="form-grid">
                <div class="field-group full">
                  <label for="prodName">Nombre del producto *</label>
                  <input name="prodName"
                    id="prodName"
                    type="text"
                    required
                    [ngModel]="formName()"
                    (ngModelChange)="formName.set($event)"
                    placeholder="Ej: Cuadro Aniversario Amor"
                  />
                </div>

                <div class="field-group">
                  <label for="prodKicker">Kicker (Subtítulo corto)</label>
                  <input name="prodKicker"
                    id="prodKicker"
                    type="text"
                    [ngModel]="formKicker()"
                    (ngModelChange)="formKicker.set($event)"
                    placeholder="Ej: Tu historia enmarcada"
                  />
                </div>

                <div class="field-group">
                  <label for="prodCategory">Categoría *</label>
                  <select name="prodCategory"
                    id="prodCategory"
                    [ngModel]="formCategory()"
                    (ngModelChange)="formCategory.set($event)"
                  >
                    @for (cat of realCategories; track cat) {
                      <option [value]="cat">{{ cat }}</option>
                    }
                  </select>
                </div>

                <div class="field-group">
                  <label for="prodDetail">Detalle o piezas</label>
                  <input name="prodDetail"
                    id="prodDetail"
                    type="text"
                    [ngModel]="formDetail()"
                    (ngModelChange)="formDetail.set($event)"
                    placeholder="Ej: 140 piezas / Tamaños S, M y L"
                  />
                </div>

                <div class="field-group">
                  <label for="prodTag">Etiqueta (tag)</label>
                  <input name="prodTag"
                    id="prodTag"
                    type="text"
                    [ngModel]="formTag()"
                    (ngModelChange)="formTag.set($event)"
                    placeholder="Ej: Grupo 1 / Cotizar"
                  />
                </div>

                <div class="field-group full">
                  <label for="product-image-url">Imagen del Producto</label>
                  <div class="image-upload-row">
                    <input id="product-image-url" name="productControl2"
                      type="text"
                      [ngModel]="formImage()"
                      (ngModelChange)="formImage.set($event)"
                      placeholder="Ruta local o URL (/catalog-assets/... o /uploads/...)"
                      class="img-input"
                    />
                    <label class="btn-file-upload">
                      <span>📁 Subir Imagen</span>
                      <input type="file" aria-label="Subir imagen de producto JPEG PNG o WebP" accept="image/jpeg,image/png,image/webp" (change)="onUploadFile($event)" style="position:absolute;width:1px;height:1px;opacity:0;" />
                    </label>
                  </div>
                  @if (formImage()) {
                    <div class="img-preview">
                      <img [src]="formImage()" alt="Vista previa" (error)="onImgError($event)" />
                      <small>{{ formImage() }}</small>
                    </div>
                  }
                </div>

                <div class="field-group full">
                  <label for="prodDesc">Descripción detallada</label>
                  <textarea name="prodDesc"
                    id="prodDesc"
                    rows="3"
                    [ngModel]="formDescription()"
                    (ngModelChange)="formDescription.set($event)"
                    placeholder="Descripción para la ficha técnica..."
                  ></textarea>
                </div>

                <div class="field-group">
                  <label for="minFig">Min. Figuras</label>
                  <input name="minFig"
                    id="minFig"
                    type="number"
                    min="1"
                    max="10"
                    [ngModel]="formMinFigures()"
                    (ngModelChange)="formMinFigures.set($event)"
                  />
                </div>

                <div class="field-group">
                  <label for="maxFig">Máx. Figuras</label>
                  <input name="maxFig"
                    id="maxFig"
                    type="number"
                    min="1"
                    max="12"
                    [ngModel]="formMaxFigures()"
                    (ngModelChange)="formMaxFigures.set($event)"
                  />
                </div>

                <div class="field-group full check-row">
                  <label class="checkbox-label">
                    <input name="productControl3"
                      type="checkbox"
                      [ngModel]="formAllowsPets()"
                      (ngModelChange)="formAllowsPets.set($event)"
                    />
                    <span>Permite mascotas</span>
                  </label>
                  <label class="checkbox-label">
                    <input name="productControl4"
                      type="checkbox"
                      [ngModel]="formAllowsAccessories()"
                      (ngModelChange)="formAllowsAccessories.set($event)"
                    />
                    <span>Permite accesorios</span>
                  </label>
                  <label class="checkbox-label">
                    <input name="productControl5"
                      type="checkbox"
                      [ngModel]="formIsActive()"
                      (ngModelChange)="formIsActive.set($event)"
                    />
                    <span>Producto Activo en Tienda</span>
                  </label>
                </div>

                <div class="field-group">
                  <label for="prodGroup">Grupo</label>
                  <input id="prodGroup" name="prodGroup" type="text" [ngModel]="formGroup()" (ngModelChange)="formGroup.set($event)" />
                </div>
                <div class="field-group">
                  <label for="prodBasePrice">Precio base (COP)</label>
                  <input id="prodBasePrice" name="prodBasePrice" type="number" min="0" [ngModel]="formBasePrice()" (ngModelChange)="formBasePrice.set($event)" />
                </div>
                <div class="field-group">
                  <label for="prodCode">Código</label>
                  <input id="prodCode" name="prodCode" type="text" [ngModel]="formCode()" (ngModelChange)="formCode.set($event)" />
                </div>
                <div class="field-group">
                  <label for="prodOrder">Orden de visualización</label>
                  <input id="prodOrder" name="prodOrder" type="number" min="0" [ngModel]="formDisplayOrder()" (ngModelChange)="formDisplayOrder.set($event)" />
                </div>
                <div class="field-group">
                  <label for="prodVariants">Presentaciones (una por línea)</label>
                  <textarea id="prodVariants" name="prodVariants" rows="3" [ngModel]="formVariants()" (ngModelChange)="formVariants.set($event)"></textarea>
                </div>
                <div class="field-group">
                  <label for="prodOccasions">Ocasiones (una por línea)</label>
                  <textarea id="prodOccasions" name="prodOccasions" rows="3" [ngModel]="formOccasions()" (ngModelChange)="formOccasions.set($event)"></textarea>
                </div>

                <div class="field-group full">
                  <label for="prodRule">Regla comercial</label>
                  <input name="prodRule"
                    id="prodRule"
                    type="text"
                    [ngModel]="formRule()"
                    (ngModelChange)="formRule.set($event)"
                    placeholder="Ej: Máximo cuatro minifiguras. El valor cambia según figuras..."
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
                <button type="submit" [disabled]="modalSaving() || uploading()" class="btn-submit">
                  @if (modalSaving()) {
                    <span>Guardando...</span>
                  } @else {
                    <span>{{ isEditing() ? 'Actualizar Producto' : 'Crear Producto' }}</span>
                  }
                </button>
              </div>
              </fieldset></form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .products-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
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
    .btn-create {
      background: #0f1419;
      color: #ffffff;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: background 0.15s, transform 0.1s;
    }
    .btn-create:hover { background: #232d36; transform: translateY(-1px); }
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f9fafb;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      padding: 0.4rem 0.75rem;
      min-width: 280px;
    }
    .search-box input {
      border: none;
      background: transparent;
      font-size: 0.9rem;
      outline: none;
      width: 100%;
    }
    .category-filters {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .cat-chip {
      padding: 0.4rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      color: #4b5563;
      cursor: pointer;
      transition: all 0.15s;
    }
    .cat-chip:hover { border-color: #9ca3af; }
    .cat-chip.active {
      background: #0f1419;
      color: #ffffff;
      border-color: #0f1419;
    }
    .table-card {
      background: #ffffff;
      border-radius: 0.85rem;
      border: 1px solid #e5e7eb;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .table-responsive {
      overflow-x: auto;
    }
    .products-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }
    .products-table th {
      padding: 0.85rem 1rem;
      background: #f9fafb;
      color: #4b5563;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
    }
    .products-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
    }
    .inactive-row {
      opacity: 0.6;
      background: #fafafa;
    }
    .col-img img {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 0.4rem;
      border: 1px solid #e5e7eb;
      background: #f3f4f6;
    }
    .name-col {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .name-col strong { color: #111827; }
    .name-col small { color: #6b7280; }
    .name-col code { background: #f3f4f6; padding: 0.1rem 0.25rem; border-radius: 0.2rem; }
    .cat-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #f3f4f6;
      color: #374151;
    }
    .toggle-btn {
      padding: 0.3rem 0.65rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      background: #fee2e2;
      color: #991b1b;
      transition: background 0.15s;
    }
    .toggle-btn.active {
      background: #dcfce7;
      color: #166534;
    }
    .col-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .btn-action {
      padding: 0.35rem 0.65rem;
      border-radius: 0.35rem;
      font-size: 0.78rem;
      font-weight: 600;
      border: 1px solid #d1d5db;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-action.edit:hover { background: #f3f4f6; border-color: #9ca3af; }
    .btn-action.delete { color: #dc2626; border-color: #fecaca; }
    .btn-action.delete:hover { background: #fef2f2; }
    .table-loading, .table-empty {
      padding: 3rem;
      text-align: center;
      color: #9ca3af;
    }

    /* Modal styles */
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
      max-width: 650px;
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
    .modal-header h2 { font-size: 1.2rem; font-weight: 800; color: #111827; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #9ca3af; }
    .close-btn:hover { color: #111; }
    .modal-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-grid .full { grid-column: 1 / -1; }
    .field-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .field-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
    .field-group input, .field-group select, .field-group textarea {
      padding: 0.65rem 0.8rem;
      border: 1px solid #d1d5db;
      border-radius: 0.4rem;
      font-size: 0.9rem;
    }
    .image-upload-row { display: flex; gap: 0.5rem; }
    .img-input { flex: 1; }
    .btn-file-upload {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 0.65rem 0.9rem;
      border-radius: 0.4rem;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-file-upload:hover { background: #e5e7eb; }
    .img-preview {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #f9fafb;
      border-radius: 0.4rem;
    }
    .img-preview img { width: 50px; height: 50px; object-fit: cover; border-radius: 0.3rem; }
    .img-preview small { font-size: 0.75rem; color: #6b7280; word-break: break-all; }
    .check-row { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-top: 0.25rem; }
    .checkbox-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }
    .btn-cancel {
      padding: 0.65rem 1rem;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 0.4rem;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
    }
    .btn-submit {
      padding: 0.65rem 1.25rem;
      background: #0f1419;
      color: #ffffff;
      border: none;
      border-radius: 0.4rem;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
    }
    .btn-file-upload:focus-within { outline: 3px solid #2563eb; outline-offset: 3px; }
    .btn-submit:hover:not(:disabled) { background: #232d36; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  `],
})
export class AdminProductsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly publicProducts = inject(ProductsService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(''); readonly actionError = signal(''); readonly notice = signal('');
  readonly modalError = signal(''); readonly uploading = signal(false); readonly mutating = signal(false);
  private listRequest?: Subscription;
  readonly searchTerm = signal('');
  readonly selectedCategory = signal<string>('Todos');

  readonly categories = ['Todos', 'Cuadros', 'Sets armables', 'Cajas acrílicas', 'Mini momentos', 'Mini Box', 'Llaveros', 'Minifiguras'];
  readonly realCategories: Category[] = ['Cuadros', 'Sets armables', 'Cajas acrílicas', 'Mini momentos', 'Mini Box', 'Llaveros', 'Minifiguras'];

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const cat = this.selectedCategory();
    return this.products().filter((p) => {
      const matchCat = cat === 'Todos' || p.category === cat;
      const matchTerm = !term || `${p.name} ${p.id} ${p.detail} ${p.kicker}`.toLowerCase().includes(term);
      return matchCat && matchTerm;
    });
  });

  // Modal State
  readonly modalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly modalSaving = signal(false);
  readonly currentEditingId = signal<string | null>(null);

  readonly formName = signal('');
  readonly formGroup = signal('');
  readonly formBasePrice = signal<number | null>(null);
  readonly formCode = signal('');
  readonly formDisplayOrder = signal(0);
  readonly formVariants = signal('');
  readonly formOccasions = signal('');
  readonly formKicker = signal('');
  readonly formCategory = signal<Category>('Sets armables');
  readonly formDetail = signal('');
  readonly formTag = signal('');
  readonly formImage = signal('');
  readonly formDescription = signal('');
  readonly formMinFigures = signal(1);
  readonly formMaxFigures = signal(8);
  readonly formAllowsPets = signal(true);
  readonly formAllowsAccessories = signal(true);
  readonly formRule = signal('');
  readonly formIsActive = signal(true);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.listRequest?.unsubscribe(); this.loadError.set(''); this.loading.set(true);
    this.listRequest = this.admin.getProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (list) => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: error => { this.loadError.set(httpErrorMessage(error, 'No se pudieron cargar los productos.')); this.loading.set(false); },
    });
  }

  toggleActive(product: Product): void {
    if (this.mutating() || this.loading() || this.loadError()) return;
    this.mutating.set(true); this.actionError.set(''); this.notice.set('');
    this.admin.toggleProductActive(product.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.mutating.set(false); this.products.update(list => list.map(item => item.id === product.id ? { ...item, isActive: result.isActive } : item)); this.notice.set('Disponibilidad guardada.'); this.publicProducts.refresh(); },
      error: error => { this.mutating.set(false); this.actionError.set(httpErrorMessage(error, 'No se pudo cambiar la disponibilidad.')); },
    });
  }

  deleteProduct(product: Product): void {
    if (this.mutating() || this.loading() || this.loadError() || !confirm('¿Eliminar el producto "' + product.name + '"?')) return;
    this.mutating.set(true); this.actionError.set(''); this.notice.set('');
    this.admin.deleteProduct(product.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.mutating.set(false); this.products.update(list => list.filter(item => item.id !== product.id)); this.notice.set('Producto eliminado.'); this.publicProducts.refresh(); },
      error: error => { this.mutating.set(false); this.actionError.set(httpErrorMessage(error, 'No se pudo eliminar el producto.')); },
    });
  }

  openCreateModal(): void {
    this.modalError.set('');
    this.isEditing.set(false);
    this.currentEditingId.set(null);
    this.formName.set('');
    this.formGroup.set('');
    this.formBasePrice.set(null);
    this.formCode.set('');
    this.formDisplayOrder.set(0);
    this.formVariants.set('');
    this.formOccasions.set('');
    this.formKicker.set('');
    this.formCategory.set('Sets armables');
    this.formDetail.set('');
    this.formTag.set('Grupo 1');
    this.formImage.set('');
    this.formDescription.set('');
    this.formMinFigures.set(1);
    this.formMaxFigures.set(4);
    this.formAllowsPets.set(true);
    this.formAllowsAccessories.set(true);
    this.formRule.set('El valor depende del grupo del set y la cantidad de figuras.');
    this.formIsActive.set(true);
    this.modalOpen.set(true);
  }

  openEditModal(p: Product): void {
    this.modalError.set('');
    this.isEditing.set(true);
    this.currentEditingId.set(p.id);
    this.formName.set(p.name);
    this.formGroup.set(p.group ?? '');
    this.formBasePrice.set(p.basePrice ?? null);
    this.formCode.set(p.code ?? '');
    this.formDisplayOrder.set(p.displayOrder ?? 0);
    this.formVariants.set(p.variants.join('\n'));
    this.formOccasions.set(p.occasion.join('\n'));
    this.formKicker.set(p.kicker);
    this.formCategory.set(p.category);
    this.formDetail.set(p.detail);
    this.formTag.set(p.tag || '');
    this.formImage.set(p.image);
    this.formDescription.set(p.description);
    this.formMinFigures.set(p.minFigures);
    this.formMaxFigures.set(p.maxFigures);
    this.formAllowsPets.set(Boolean(p.allowsPets));
    this.formAllowsAccessories.set(Boolean(p.allowsAccessories));
    this.formRule.set(p.rule);
    this.formIsActive.set(p.isActive !== false);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (this.modalSaving() || this.uploading()) return;
    this.modalOpen.set(false);
  }

  onUploadFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || this.uploading() || this.modalSaving()) return;
    this.uploading.set(true); this.modalError.set('');
    this.admin.uploadProductImage(file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.uploading.set(false); this.formImage.set(res.url);
      },
      error: error => { this.uploading.set(false); this.modalError.set(httpErrorMessage(error, 'No se pudo subir la imagen.')); },
    });
  }

  saveModalProduct(): void {
    if (this.modalSaving() || this.uploading()) return;
    if (!this.formName().trim()) { this.modalError.set('El nombre es obligatorio.'); return; }
    this.modalError.set('');

    this.modalSaving.set(true);

    const payload: ProductWriteRequest = {
      name: this.formName().trim(),
      kicker: this.formKicker().trim(),
      category: this.formCategory(),
      detail: this.formDetail().trim(),
      tag: this.formTag().trim(),
      image: this.formImage().trim() || '/images/cuadro-personalizado.webp',
      description: this.formDescription().trim(),
      minFigures: Number(this.formMinFigures()),
      maxFigures: Number(this.formMaxFigures()),
      allowsPets: this.formAllowsPets(),
      allowsAccessories: this.formAllowsAccessories(),
      rule: this.formRule().trim(),
      isActive: this.formIsActive(),
      group: this.formGroup().trim(),
      basePrice: this.formBasePrice() ?? undefined,
      code: this.formCode().trim(),
      displayOrder: Number(this.formDisplayOrder()),
      variants: this.formVariants().split('\n').map((value) => value.trim()).filter(Boolean),
      occasion: this.formOccasions().split('\n').map((value) => value.trim()).filter(Boolean),
    };

    if (this.isEditing() && this.currentEditingId()) {
      this.admin.updateProduct(this.currentEditingId()!, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (updated) => {
          this.modalSaving.set(false);
          this.modalOpen.set(false); this.notice.set('Producto guardado.');
          this.loadProducts();
          this.publicProducts.refresh();
        },
        error: error => { this.modalSaving.set(false); this.modalError.set(httpErrorMessage(error, 'No se pudo guardar el producto.')); },
      });
    } else {
      this.admin.createProduct(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (created) => {
          this.modalSaving.set(false);
          this.modalOpen.set(false); this.notice.set('Producto creado.');
          this.loadProducts();
          this.publicProducts.refresh();
        },
        error: error => { this.modalSaving.set(false); this.modalError.set(httpErrorMessage(error, 'No se pudo crear el producto.')); },
      });
    }
  }

  onImgError(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith('/images/cuadro-personalizado.webp')) image.src = '/images/cuadro-personalizado.webp';
  }
}
