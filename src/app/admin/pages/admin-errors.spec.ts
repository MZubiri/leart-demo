import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AdminService, OrderSummary, PagedOrders } from '../../core/services/admin.service';
import { ProductsService } from '../../core/services/products.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { PRODUCTS } from '../../store/products';
import { AdminOrdersComponent } from './admin-orders.component';
import { AdminProductsComponent } from './admin-products.component';
import { AdminSettingsComponent } from './admin-settings.component';
import { AdminDashboardComponent } from './admin-dashboard.component';

const failure = () => new HttpErrorResponse({ status: 503, error: { message: 'INTERNAL PRIVATE DETAIL' } });
const summary: OrderSummary = { id: 1, orderReference: 'TEST', customerName: 'Cliente', phone: '573001112233', productTitle: 'Cuadro', status: 'Pendiente', createdAt: '2026-01-01', attachmentCount: 0 };
const result: PagedOrders = { items: [summary], page: 1, pageSize: 20, total: 1 };

describe('Visible and recoverable administrative failures', () => {
  it('does not show a failed order load as empty and allows retry', () => {
    const api = { getOrders: vi.fn().mockReturnValueOnce(throwError(failure)).mockReturnValueOnce(of(result)) };
    TestBed.configureTestingModule({ imports: [AdminOrdersComponent], providers: [{ provide: AdminService, useValue: api }] });
    const fixture = TestBed.createComponent(AdminOrdersComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar los pedidos');
    expect(fixture.nativeElement.textContent).not.toContain('No hay pedidos con el estado');
    fixture.componentInstance.loadOrders(); fixture.detectChanges(); expect(fixture.componentInstance.orders()).toHaveLength(1);
  });

  it('cancels obsolete filter requests and retains confirmed data after a later failure', () => {
    const old = new Subject<PagedOrders>(), current = new Subject<PagedOrders>();
    const api = { getOrders: vi.fn().mockReturnValueOnce(of(result)).mockReturnValueOnce(old).mockReturnValueOnce(current) };
    TestBed.configureTestingModule({ imports: [AdminOrdersComponent], providers: [{ provide: AdminService, useValue: api }] });
    const fixture = TestBed.createComponent(AdminOrdersComponent); fixture.detectChanges(); const page = fixture.componentInstance;
    page.filterByStatus('Completado'); page.filterByStatus('Pendiente');
    old.next({ ...result, items: [] }); expect(page.orders()).toEqual([summary]);
    current.error(failure()); expect(page.orders()).toEqual([summary]); expect(page.loadedStatus()).toBe('Todos');
    expect(page.loadError()).not.toContain('PRIVATE');
  });

  it('does not report status or deletion success when the operation fails', () => {
    const api = { getOrders: () => of(result), updateOrderStatus: () => throwError(failure), deleteOrder: () => throwError(failure) };
    TestBed.configureTestingModule({ imports: [AdminOrdersComponent], providers: [{ provide: AdminService, useValue: api }] });
    const fixture = TestBed.createComponent(AdminOrdersComponent); fixture.detectChanges(); const page = fixture.componentInstance;
    const control = fixture.nativeElement.querySelector('select') as HTMLSelectElement; control.value = 'Completado';
    page.onStatusChange(summary, 'Completado', control); expect(control.value).toBe('Pendiente');
    expect(page.orders()[0].status).toBe('Pendiente'); expect(page.notice()).toBe(''); expect(page.actionError()).not.toBe('');
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true); page.deleteOrder(summary);
    expect(page.orders()).toHaveLength(1); expect(page.notice()).toBe('');
  });

  it('preserves product form and image while exposing validation and upload errors', () => {
    const api = { getProducts: () => of([PRODUCTS[0]]), updateProduct: () => throwError(() => new HttpErrorResponse({ status: 400, error: { errors: { Variants: ['Selecciona una variante.'] } } })), uploadProductImage: () => throwError(failure) };
    TestBed.configureTestingModule({ imports: [AdminProductsComponent], providers: [{ provide: AdminService, useValue: api }, { provide: ProductsService, useValue: { refresh: vi.fn() } }] });
    const fixture = TestBed.createComponent(AdminProductsComponent); fixture.detectChanges(); const page = fixture.componentInstance;
    page.openEditModal(PRODUCTS[0]); page.formName.set('Conservar nombre'); page.saveModalProduct();
    expect(page.modalOpen()).toBe(true); expect(page.formName()).toBe('Conservar nombre'); expect(page.modalError()).toContain('Selecciona una variante');
    const original = page.formImage(); page.onUploadFile({ target: { files: [new File(['test'], 'photo.png')] } } as unknown as Event);
    expect(page.formImage()).toBe(original); expect(page.uploading()).toBe(false); expect(page.modalError()).toContain('No se pudo subir');
  });

  it('preserves the last product list and mutation values on errors', () => {
    const api = { getProducts: vi.fn().mockReturnValueOnce(of([PRODUCTS[0]])).mockReturnValueOnce(throwError(failure)), toggleProductActive: () => throwError(failure), deleteProduct: () => throwError(failure) };
    TestBed.configureTestingModule({ imports: [AdminProductsComponent], providers: [{ provide: AdminService, useValue: api }, { provide: ProductsService, useValue: { refresh: vi.fn() } }] });
    const fixture = TestBed.createComponent(AdminProductsComponent); fixture.detectChanges(); const page = fixture.componentInstance;
    page.toggleActive(PRODUCTS[0]); expect(page.products()[0]).toEqual(PRODUCTS[0]); expect(page.actionError()).not.toBe('');
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true); page.deleteProduct(PRODUCTS[0]); expect(page.products()).toHaveLength(1);
    page.loadProducts(); expect(page.products()).toHaveLength(1); expect(page.loadError()).not.toBe('');
  });

  it('shows creation errors, preserves the form and confirms only a successful retry', () => {
    const refresh = vi.fn();
    const api = { getProducts: () => of([]), createProduct: vi.fn().mockReturnValueOnce(throwError(failure)).mockReturnValueOnce(of(PRODUCTS[0])) };
    TestBed.configureTestingModule({ imports: [AdminProductsComponent], providers: [{ provide: AdminService, useValue: api }, { provide: ProductsService, useValue: { refresh } }] });
    const fixture = TestBed.createComponent(AdminProductsComponent); fixture.detectChanges(); const page = fixture.componentInstance;
    page.openCreateModal(); page.formName.set('Producto pendiente'); page.saveModalProduct(); fixture.detectChanges();
    expect(page.modalOpen()).toBe(true); expect(page.modalSaving()).toBe(false); expect(page.formName()).toBe('Producto pendiente');
    expect(fixture.nativeElement.textContent).toContain('No se pudo crear el producto');
    expect(page.notice()).toBe(''); expect(refresh).not.toHaveBeenCalled(); expect(page.modalError()).not.toContain('PRIVATE');
    page.saveModalProduct(); expect(page.modalOpen()).toBe(false); expect(page.notice()).toBe('Producto creado.'); expect(refresh).toHaveBeenCalledOnce();
  });

  it('does not save default settings after a load error', () => {
    const api = { getSettings: () => throwError(failure), updateSettings: vi.fn() };
    TestBed.configureTestingModule({ imports: [AdminSettingsComponent], providers: [{ provide: AdminService, useValue: api }, { provide: SettingsService, useValue: {} }, { provide: AuthService, useValue: {} }] });
    const fixture = TestBed.createComponent(AdminSettingsComponent); fixture.detectChanges();
    fixture.componentInstance.saveSettings(); expect(api.updateSettings).not.toHaveBeenCalled(); expect(fixture.componentInstance.loadingError()).not.toBe('');
  });

  it('shows unavailable dashboard metrics instead of false zero counts', () => {
    TestBed.configureTestingModule({ imports: [AdminDashboardComponent], providers: [provideRouter([]), { provide: AdminService, useValue: { getDashboard: () => throwError(failure) } }] });
    const fixture = TestBed.createComponent(AdminDashboardComponent); fixture.detectChanges();
    expect(fixture.componentInstance.hasData()).toBe(false); expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar las métricas');
    expect(fixture.nativeElement.textContent).not.toContain('Aún no se han recibido pedidos');
  });
});
