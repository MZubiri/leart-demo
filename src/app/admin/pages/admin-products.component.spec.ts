import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { ProductsService } from '../../core/services/products.service';
import { PRODUCTS } from '../../store/products';
import { AdminProductsComponent } from './admin-products.component';

describe('Product editor', () => {
  it('registers independent named controls and preserves their displayed values', async () => {
    const product = { ...PRODUCTS[0], name: 'Nombre original', kicker: 'Subtítulo propio', rule: 'Regla diferente' };
    TestBed.configureTestingModule({
      imports: [AdminProductsComponent],
      providers: [
        { provide: AdminService, useValue: { getProducts: () => of([product]) } },
        { provide: ProductsService, useValue: { refresh: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(AdminProductsComponent);
    fixture.detectChanges();
    fixture.componentInstance.openEditModal(product);
    await fixture.whenStable(); fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('#prodName') as HTMLInputElement;
    const kicker = fixture.nativeElement.querySelector('#prodKicker') as HTMLInputElement;
    const rule = fixture.nativeElement.querySelector('#prodRule') as HTMLInputElement;
    expect(name.value).toBe('Nombre original');
    expect(kicker.value).toBe('Subtítulo propio');
    expect(rule.value).toBe('Regla diferente');
    name.value = 'Nombre editado'; name.dispatchEvent(new Event('input'));
    await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.componentInstance.formName()).toBe('Nombre editado');
    expect(kicker.value).toBe('Subtítulo propio');
    expect(rule.value).toBe('Regla diferente');
  });
});
