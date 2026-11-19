import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface PublicSettings {
  storeName: string;
  whatsAppNumber: string;
  announcementText: string;
  instagramUrl: string;
  whatsAppQuoteTemplate: string;
  whatsAppPersonalizationTemplate: string;
}

const DEFAULT_SETTINGS: PublicSettings = {
  storeName: 'Leart Store',
  whatsAppNumber: '',
  announcementText: 'Hecho en Medellín · Envíos a toda Colombia',
  instagramUrl: 'https://www.instagram.com/leart.store/',
  whatsAppQuoteTemplate: 'Hola Leart 👋 Quiero cotizar esta selección:\n\n{lines}\n\nMi nombre es:\nCiudad de envío:\nFecha en que lo necesito:',
  whatsAppPersonalizationTemplate: 'Hola Leart 👋 Ya realicé mi pedido y quiero completar la información de personalización.',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  readonly settings = signal<PublicSettings>(DEFAULT_SETTINGS);
  readonly loaded = signal(false);
  readonly error = signal('');
  readonly canContact = computed(() => {
    const number = this.settings().whatsAppNumber.replace(/\D/g, '');
    return this.loaded() && !this.error() && /^\d{8,15}$/.test(number) && number !== '573000000000';
  });

  constructor() {
    this.fetchSettings();
  }

  fetchSettings(): void {
    this.loaded.set(false);
    this.error.set('');
    this.http.get<PublicSettings>(`${environment.apiUrl}/public/settings`).subscribe({
      next: (data) => {
        const keys: (keyof PublicSettings)[] = ['storeName', 'whatsAppNumber', 'announcementText', 'instagramUrl', 'whatsAppQuoteTemplate', 'whatsAppPersonalizationTemplate'];
        if (!data || !keys.every((key) => typeof data[key] === 'string')) {
          this.settings.set(DEFAULT_SETTINGS); this.loaded.set(true); this.error.set('No se pudo leer el contacto de la tienda.'); return;
        }
        this.settings.set(data);
        this.loaded.set(true);
      },
      error: () => {
        this.settings.set(DEFAULT_SETTINGS);
        this.error.set('No se pudo consultar el contacto de la tienda.');
        this.loaded.set(true);
      },
    });
  }

  buildWhatsAppUrl(message: string): string {
    if (!this.canContact()) return '';
    const number = this.settings().whatsAppNumber.replace(/\D/g, '');
    const cleanNumber = number ? number : '';
    return cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
}
