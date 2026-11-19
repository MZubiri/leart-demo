import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

describe('Configured message templates', () => {
  it('uses saved templates, preserves omitted details and never recursively substitutes user data', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(SettingsService), http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/public/settings').flush({ storeName: 'Tienda', whatsAppNumber: '573001112233', announcementText: '', instagramUrl: '',
      whatsAppQuoteTemplate: 'Oferta especial: {lines}', whatsAppPersonalizationTemplate: 'Recibido {reference} para {name}' });
    expect(service.buildQuoteMessage('2x Cuadro')).toBe('Oferta especial: 2x Cuadro');
    service.settings.update(value => ({ ...value, whatsAppQuoteTemplate: 'Nuevo saludo' }));
    expect(service.buildQuoteMessage('2x Cuadro')).toContain('2x Cuadro');
    const values = { reference: 'R-123', name: '{phone}', phone: '573001112233', story: 'Historia original' };
    const message = service.buildPersonalizationMessage(values, true);
    expect(message).toContain('Recibido R-123 para {phone}'); expect(message).toContain('Teléfono: 573001112233');
    expect(message).toContain('Historia original');
    expect(service.buildPersonalizationMessage(values, false)).toContain('todavía no está confirmado');
    expect(service.buildPersonalizationMessage(values, false)).not.toContain('Recibido');
    http.verify();
  });
});
