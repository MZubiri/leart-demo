import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import rulesData from '../../../backend/Leart.Api/Data/pricing-rules.json';
import { PricingRules } from './pricing';
import { PricingService } from '../core/services/pricing.service';
import { ProductsService } from '../core/services/products.service';
import { SettingsService } from '../core/services/settings.service';
import { PRODUCTS } from './products';
import { CartConfiguration, StoreService } from './store.service';

describe('Quotation lines', () => {
  const small: CartConfiguration = { variant: 'Talla S', figures: 1, pets: 0, accessories: false, occasion: 'Familia', estimatedPrice: 96000 };
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [
      { provide: PricingService, useValue: { rules: signal(rulesData as PricingRules) } },
      { provide: ProductsService, useValue: { products: signal(PRODUCTS), loaded: signal(true), loading: signal(false), error: signal('') } },
      { provide: SettingsService, useValue: { canContact: signal(true), buildWhatsAppUrl: (message: string) => message } },
    ] });
  });
  afterEach(() => { document.body.style.overflow = ''; });

  it('keeps different variants separate and only groups equivalent selections', () => {
    const store = TestBed.inject(StoreService);
    store.add(PRODUCTS[0], 'Primera', small);
    store.add(PRODUCTS[0], 'Segunda', { ...small, variant: 'Talla M', estimatedPrice: 124000 });
    store.add(PRODUCTS[0], 'Primera', { ...small });
    expect(store.cartLines()).toHaveLength(2);
    expect(store.cartLines().map(line => line.quantity)).toEqual([2, 1]);
    const [first, second] = store.cartLines();
    store.updateNote(first.id, 'Nota editada'); store.changeQuantity(second.id, 1);
    expect(store.cartLines()[0].note).toBe('Nota editada');
    expect(store.cartLines()[1].note).toBe('Segunda');
    expect(store.cartLines()[1].quantity).toBe(2);
    expect(store.whatsappUrl()).toContain('Talla S');
    expect(store.whatsappUrl()).toContain('Talla M');
  });

  it('migrates legacy selections without erasing their notes', () => {
    localStorage.setItem('leart-cart', JSON.stringify({ 'cuadro-personalizado': { quantity: 2, note: 'Detalles históricos' } }));
    const store = TestBed.inject(StoreService);
    expect(store.cartLines()[0].product.id).toBe('cuadro-1-persona');
    expect(store.cartLines()[0].quantity).toBe(2);
    expect(store.cartLines()[0].note).toBe('Detalles históricos');
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem('leart-cart')!).version).toBe(2);
  });

  it('ignores malformed saved lines instead of breaking the quote', () => {
    localStorage.setItem('leart-cart', JSON.stringify({ version: 2, lines: { bad: { quantity: -1, productId: 'test', note: 'x' } } }));
    expect(TestBed.inject(StoreService).cartLines()).toEqual([]);
  });
  it('never revives a removed product from bundled seed data', () => {
    const store = TestBed.inject(StoreService);
    store.add(PRODUCTS[0], 'Conservar hasta revisar', small);
    TestBed.inject(ProductsService).products.set([]);
    expect(store.cartLines()).toEqual([]);
    expect(store.hasUnavailableLines()).toBe(true);
    expect(store.canSendQuote()).toBe(false);
    expect(store.whatsappUrl()).toBe('');
    expect(Object.keys(store.cart())).toHaveLength(1);
    store.removeUnavailableLines();
    expect(Object.keys(store.cart())).toHaveLength(0);
  });
});
