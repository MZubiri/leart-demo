import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import rulesData from '../../backend/Leart.Api/Data/pricing-rules.json';
import { App } from './app';
import { PricingService } from './core/services/pricing.service';
import { ProductsService } from './core/services/products.service';
import { SettingsService } from './core/services/settings.service';
import { PricingRules } from './store/pricing';
import { PRODUCTS } from './store/products';

describe('Guided quote', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([]),
      { provide: ProductsService, useValue: { products: signal(PRODUCTS.filter(product => product.isActive !== false)) } },
      { provide: PricingService, useValue: { rules: signal(rulesData as PricingRules), error: signal('') } },
      { provide: SettingsService, useValue: { settings: signal({ announcementText: '', instagramUrl: '' }), buildWhatsAppUrl: (message: string) => message } },
    ] });
  });
  afterEach(() => { document.body.style.overflow = ''; });

  it('selects the matching product and price for a generic group choice', async () => {
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    const app = fixture.componentInstance;
    app.store.openCustomizer(); await fixture.whenStable();
    app.chooseCategory('Sets armables'); app.chooseVariant('Grupo 4');
    expect(app.selectedProduct()?.group).toBe('Grupo 4');
    expect(app.priceQuote().totalPrice).toBe(165000);
  });

  it('stops the figure counter at the specific product maximum', async () => {
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    const app = fixture.componentInstance;
    app.store.openCustomizer(PRODUCTS.find(product => product.id === 'set-hockey')!);
    await fixture.whenStable();
    for (let i = 0; i < 10; i++) app.changeFigures(1);
    expect(app.figures()).toBe(4); expect(app.canIncreaseFigures()).toBe(false);
    expect(app.canAdd()).toBe(true);
  });
});
