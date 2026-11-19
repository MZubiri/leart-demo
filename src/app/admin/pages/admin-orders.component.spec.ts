import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AdminService, OrderAdmin, OrderSummary } from '../../core/services/admin.service';
import { AdminOrdersComponent } from './admin-orders.component';
import { of as rxOf, Subject as RxSubject } from 'rxjs';

describe('Bounded order navigation', () => {
  it('requests pages and loads full details only when opened', () => {
    const summary: OrderSummary = { id: 1, orderReference: 'TEST', customerName: 'Cliente', phone: '573001112233', productTitle: 'Cuadros', status: 'Pendiente', createdAt: '2026-01-01', attachmentCount: 0 };
    const detail = new RxSubject<OrderAdmin>();
    const api = { getOrders: vi.fn(() => rxOf({ items: [summary], page: 1, pageSize: 20, total: 45 })), getOrderById: vi.fn(() => detail), getAttachment: vi.fn() };
    TestBed.configureTestingModule({ imports: [AdminOrdersComponent], providers: [{ provide: AdminService, useValue: api }] });
    const fixture = TestBed.createComponent(AdminOrdersComponent); fixture.detectChanges(); const page = fixture.componentInstance;
    expect(api.getOrders).toHaveBeenCalledWith('Todos', 1, 20); expect(api.getOrderById).not.toHaveBeenCalled();
    page.goPage(2); expect(api.getOrders).toHaveBeenLastCalledWith('Todos', 2, 20);
    page.openDetailModal(summary); expect(page.activeOrder()).toBeNull(); expect(page.detailLoading()).toBe(true);
    detail.next({ ...summary, peopleDetails: 'Detalle', story: '', phrase: '', requirements: '', attachments: [] });
    expect(page.activeOrder()?.peopleDetails).toBe('Detalle'); expect(api.getAttachment).not.toHaveBeenCalled();
    page.filterByStatus('Pendiente'); expect(api.getOrders).toHaveBeenLastCalledWith('Pendiente', 1, 20);
  });
});
