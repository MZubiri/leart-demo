import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PRODUCTS } from '../../store/products';
import { ProductsService } from './products.service';
import { SettingsService } from './settings.service';

describe('Catalog and contact availability', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('accepts an empty catalog and clears unavailable stale products on an error', () => {
    const service = TestBed.inject(ProductsService), http = TestBed.inject(HttpTestingController);
    expect(service.products()).toEqual([]);
    http.expectOne('/api/public/products').flush([]);
    expect(service.products()).toEqual([]); expect(service.loaded()).toBe(true); expect(service.error()).toBe('');
    service.refresh(); http.expectOne('/api/public/products').flush([PRODUCTS[0]]);
    expect(service.products()).toHaveLength(1);
    service.refresh(); http.expectOne('/api/public/products').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(service.products()).toEqual([]); expect(service.error()).not.toBe('');
  });

  it('never substitutes an example number when settings fail', () => {
    const service = TestBed.inject(SettingsService), http = TestBed.inject(HttpTestingController);
    expect(service.buildWhatsAppUrl('test')).toBe('');
    http.expectOne('/api/public/settings').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(service.canContact()).toBe(false); expect(service.buildWhatsAppUrl('test')).toBe('');
  });
});
