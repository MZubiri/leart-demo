import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PricingRules } from '../../store/pricing';

@Injectable({ providedIn: 'root' })
export class PricingService {
  private readonly http = inject(HttpClient);
  readonly rules = signal<PricingRules | null>(null);
  readonly error = signal('');
  constructor() { this.refresh(); }
  refresh(): void {
    this.error.set('');
    this.http.get<PricingRules>(`${environment.apiUrl}/public/pricing`).subscribe({
      next: (rules) => {
        if (!rules || rules.currency !== 'COP' || !rules.frames || !rules.sets || !rules.variants || !rules.frameLimits || !rules.moments || !rules.extraPrices || !rules.defaultLimits || !rules.acrylic || !rules.acrylicPetLimits) {
          this.rules.set(null); this.error.set('Las tarifas no están disponibles. Intenta de nuevo.'); return;
        }
        this.rules.set(rules);
      },
      error: () => { this.rules.set(null); this.error.set('No se pudieron cargar las tarifas. Intenta de nuevo.'); },
    });
  }
}
