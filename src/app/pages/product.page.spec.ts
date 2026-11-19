import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import source from '../../../backend/Leart.Api/Data/pricing-rules.json';
import { PricingService } from '../core/services/pricing.service';
import { PricingRules } from '../store/pricing';
import { PRODUCTS } from '../store/products';
import { StoreService } from '../store/store.service';
import { ProductPage } from './product.page';

describe('Product detail prices from the API', () => {
  it('updates the background label with loaded rates and requests a quote when they are absent', () => {
    const product = PRODUCTS.find(item => item.category === 'Cajas acrílicas')!;
    const rules = signal<PricingRules | null>(structuredClone(source) as PricingRules);
    TestBed.configureTestingModule({ imports: [ProductPage], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: product.id })) } },
      { provide: PricingService, useValue: { rules } },
      { provide: StoreService, useValue: { productsSignal: signal([product]), catalogLoading: signal(false), catalogLoaded: signal(true), catalogError: signal('') } },
    ] });
    const fixture = TestBed.createComponent(ProductPage); fixture.detectChanges();
    const label = () => Array.from(fixture.nativeElement.querySelectorAll('.includes li') as NodeListOf<HTMLElement>)
      .find(item => item.textContent?.includes('Fondo temático'))!.textContent!.replace(/\s/g, '');
    expect(label()).toContain('personalizadopor$8.000');
    rules.update(value => ({ ...value!, extraPrices: { ...value!.extraPrices, fondoPersonalizado: 9000 } })); fixture.detectChanges();
    expect(label()).toContain('personalizadopor$9.000');
    rules.set(null); fixture.detectChanges();
    expect(label()).toContain('personalizadosujetoacotización');
    expect(label()).not.toContain('$9.000');
    expect(label()).not.toContain('$8.000');
  });
});
