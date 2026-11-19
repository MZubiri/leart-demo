import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SettingsService } from '../core/services/settings.service';
import { PersonalizationPage } from './personalization.page';

describe('Personalization submission', () => {
  let page: PersonalizationPage;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PersonalizationPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: SettingsService, useValue: { buildWhatsAppUrl: (message: string) => message } }],
    });
    page = TestBed.createComponent(PersonalizationPage).componentInstance;
    http = TestBed.inject(HttpTestingController);
    page.order.set('TEST-REFERENCE'); page.name.set('Cliente'); page.product.set('Cuadros');
  });
  afterEach(() => http.verify());

  it('requires a phone before sending', () => {
    expect(page.ready()).toBe(false);
    page.submitOrder();
    http.expectNone('/api/public/personalization');
  });

  it('keeps data and photos and never claims success after a rejected request', () => {
    page.phone.set('573001112233');
    const file = new File(['test'], 'reference.png', { type: 'image/png' });
    page.selectedFiles.set([file]); page.photoNames.set([file.name]);
    page.submitOrder();
    http.expectOne('/api/public/personalization').flush({ message: 'Revisa los datos.' }, { status: 400, statusText: 'Bad Request' });
    expect(page.submitted()).toBe(false);
    expect(page.submitting()).toBe(false);
    expect(page.selectedFiles()).toEqual([file]);
    expect(page.order()).toBe('TEST-REFERENCE');
    expect(page.errorMessage()).toBe('Revisa los datos.');
    expect(page.whatsappUrl()).toContain('todavía no está confirmado');
  });

  it('does not duplicate concurrent or completed submissions', () => {
    page.phone.set('573001112233');
    page.submitOrder(); page.submitOrder();
    http.expectOne('/api/public/personalization').flush({ orderReference: 'CONFIRMED', attachments: [] });
    expect(page.submitted()).toBe(true);
    expect(page.submittedReference()).toBe('CONFIRMED');
    page.submitOrder();
    http.expectNone('/api/public/personalization');
  });

  it('treats a network error as unconfirmed and preserves the form', () => {
    page.phone.set('573001112233'); page.submitOrder();
    http.expectOne('/api/public/personalization').error(new ProgressEvent('error'));
    expect(page.submitted()).toBe(false);
    expect(page.errorMessage()).toContain('No se pudo confirmar');
    expect(page.name()).toBe('Cliente');
  });
});
