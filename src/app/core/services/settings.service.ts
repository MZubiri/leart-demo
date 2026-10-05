import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
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
  whatsAppNumber: '573000000000',
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

  constructor() {
    this.fetchSettings();
  }

  fetchSettings(): void {
    this.http.get<PublicSettings>(`${environment.apiUrl}/public/settings`).subscribe({
      next: (data) => {
        this.settings.set(data);
        this.loaded.set(true);
      },
      error: () => {
        // Fallback to defaults gracefully if backend is offline
        this.loaded.set(true);
      },
    });
  }

  buildWhatsAppUrl(message: string): string {
    const number = this.settings().whatsAppNumber.replace(/\D/g, '');
    const cleanNumber = number ? number : '';
    return cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
}
