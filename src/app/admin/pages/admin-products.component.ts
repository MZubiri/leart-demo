import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { ProductsService } from '../../core/services/products.service';
import { Category, Product } from '../../store/products';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="products-page">
      <div class="page-header">
        <div>
          <h1>Gestión de Productos</h1>
          <p>Administra los productos del catálogo, fotos, descripciones y límites de minifiguras.</p>
        </div>
        <button type="button" class="btn-create" (click)="openCreateModal()">
          <span>＋ Nuevo Producto</span>
        </button>
      </div>

      <!-- Filters Bar -->
      <div class="filter-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
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
        } @else if (filteredProducts().length === 0) {
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
                        (click)="toggleActive(prod)"
                      >
                        {{ prod.isActive ? 'Activo' : 'Pausado' }}
                      </button>
                    </td>
                    <td class="col-actions">
                      <button type="button" class="btn-action edit" (click)="openEditModal(prod)">
                        Editar
                      </button>
                      <button type="button" class="btn-action delete" (click)="deleteProduct(prod)">
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
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ isEditing() ? 'Editar Producto' : 'Crear Nuevo Producto' }}</h2>
              <button type="button" class="close-btn" (click)="closeModal()">×</button>
            </div>

            <form (ngSubmit)="saveModalProduct()" class="modal-form">
              <div class="form-grid">
                <div class="field-group full">
                  <label for="prodName">Nombre del producto *</label>
                  <input
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
                  <input
                    id="prodKicker"
                    type="text"
                    [ngModel]="formKicker()"
                    (ngModelChange)="formKicker.set($event)"
                    placeholder="Ej: Tu historia enmarcada"
                  />
                </div>

                <div class="field-group">
                  <label for="prodCategory">Categoría *</label>
                  <select
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
                  <input
                    id="prodDetail"
                    type="text"
                    [ngModel]="formDetail()"
                    (ngModelChange)="formDetail.set($event)"
                    placeholder="Ej: 140 piezas / Tamaños S, M y L"
                  />
                </div>

                <div class="field-group">
                  <label for="prodTag">Etiqueta (Tag / Grupo)</label>
                  <input
                    id="prodTag"
                    type="text"
                    [ngModel]="formTag()"
                    (ngModelChange)="formTag.set($event)"
                    placeholder="Ej: Grupo 1 / Cotizar"
                  />
                </div>

                <div class="field-group full">
                  <label>Imagen del Producto</label>
                  <div class="image-upload-row">
                    <input
                      type="text"
                      [ngModel]="formImage()"
                      (ngModelChange)="formImage.set($event)"
                      placeholder="Ruta local o URL (/catalog-assets/... o /uploads/...)"
                      class="img-input"
                    />
                    <label class="btn-file-upload">
                      <span>📁 Subir Imagen</span>
                      <input type="file" accept="image/*" (change)="onUploadFile($event)" style="display: none;" />
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
                  <textarea
                    id="prodDesc"
                    rows="3"
                    [ngModel]="formDescription()"
                    (ngModelChange)="formDescription.set($event)"
                    placeholder="Descripción para la ficha técnica..."
                  ></textarea>
                </div>

                <div class="field-group">
                  <label for="minFig">Min. Figuras</label>
                  <input
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
                  <input
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
                    <input
                      type="checkbox"
                      [ngModel]="formAllowsPets()"
                      (ngModelChange)="formAllowsPets.set($event)"
                    />
                    <span>Permite mascotas</span>
                  </label>
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      [ngModel]="formAllowsAccessories()"
                      (ngModelChange)="formAllowsAccessories.set($event)"
                    />
                    <span>Permite accesorios</span>
                  </label>
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      [ngModel]="formIsActive()"
                      (ngModelChange)="formIsActive.set($event)"
                    />
                    <span>Producto Activo en Tienda</span>
                  </label>
                </div>

                <div class="field-group full">
                  <label for="prodRule">Regla comercial</label>
                  <input
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
                <button type="submit" [disabled]="modalSaving()" class="btn-submit">
                  @if (modalSaving()) {
                    <span>Guardando...</span>
                  } @else {
                    <span>{{ isEditing() ? 'Actualizar Producto' : 'Crear Producto' }}</span>
                  }
                </button>
              </div>
            </form>
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
    .btn-submit:hover:not(:disabled) { background: #232d36; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  `],
})
export class AdminProductsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly publicProducts = inject(ProductsService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
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
    this.loading.set(true);
    this.admin.getProducts().subscribe({
      next: (list) => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  toggleActive(product: Product): void {
    this.admin.toggleProductActive(product.id).subscribe({
      next: (res) => {
        this.products.update((list) =>
          list.map((p) => (p.id === product.id ? { ...p, isActive: res.isActive } : p)),
        );
        this.publicProducts.refresh();
      },
    });
  }

  deleteProduct(product: Product): void {
    if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
      this.admin.deleteProduct(product.id).subscribe({
        next: () => {
          this.products.update((list) => list.filter((p) => p.id !== product.id));
          this.publicProducts.refresh();
        },
      });
    }
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.currentEditingId.set(null);
    this.formName.set('');
    this.formKicker.set('');
    this.formCategory.set('Sets armables');
    this.formDetail.set('');
    this.formTag.set('Grupo 1');
    this.formImage.set('');
    this.formDescription.set('');
    this.formMinFigures.set(1);
    this.formMaxFigures.set(8);
    this.formAllowsPets.set(true);
    this.formAllowsAccessories.set(true);
    this.formRule.set('El valor depende del grupo del set y la cantidad de figuras.');
    this.formIsActive.set(true);
    this.modalOpen.set(true);
  }

  openEditModal(p: Product): void {
    this.isEditing.set(true);
    this.currentEditingId.set(p.id);
    this.formName.set(p.name);
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
    this.modalOpen.set(false);
  }

  onUploadFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.admin.uploadProductImage(file).subscribe({
      next: (res) => {
        this.formImage.set(res.url);
      },
    });
  }

  saveModalProduct(): void {
    if (!this.formName().trim()) return;

    this.modalSaving.set(true);

    const payload: Partial<Product> = {
      name: this.formName().trim(),
      kicker: this.formKicker().trim(),
      category: this.formCategory(),
      detail: this.formDetail().trim(),
      tag: this.formTag().trim(),
      image: this.formImage().trim() || '/images/cuadro-personalizado.png',
      description: this.formDescription().trim(),
      minFigures: Number(this.formMinFigures()),
      maxFigures: Number(this.formMaxFigures()),
      allowsPets: this.formAllowsPets(),
      allowsAccessories: this.formAllowsAccessories(),
      rule: this.formRule().trim(),
      isActive: this.formIsActive(),
      variants: [this.formTag() || 'Individual'],
      occasion: ['Cumpleaños', 'Aniversario'],
    };

    if (this.isEditing() && this.currentEditingId()) {
      this.admin.updateProduct(this.currentEditingId()!, payload).subscribe({
        next: (updated) => {
          this.modalSaving.set(false);
          this.modalOpen.set(false);
          this.loadProducts();
          this.publicProducts.refresh();
        },
        error: () => this.modalSaving.set(false),
      });
    } else {
      this.admin.createProduct(payload).subscribe({
        next: (created) => {
          this.modalSaving.set(false);
          this.modalOpen.set(false);
          this.loadProducts();
          this.publicProducts.refresh();
        },
        error: () => this.modalSaving.set(false),
      });
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = '/images/cuadro-personalizado.png';
  }
}
