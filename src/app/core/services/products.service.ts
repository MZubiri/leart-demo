import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../../store/products';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  readonly products = signal<Product[]>([]);
  private request?: Subscription;
  readonly loaded = signal(false);
  readonly error = signal('');
  readonly loading = signal(false);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.request = this.http.get<Product[]>(`${environment.apiUrl}/public/products`).subscribe({
      next: (apiProducts) => {
        if (!Array.isArray(apiProducts)) {
          this.products.set([]); this.error.set('No se pudo leer el catálogo.');
        } else this.products.set(apiProducts.filter((product) => product.isActive !== false));
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loaded.set(true);
        this.error.set('No se pudo cargar el catálogo. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  getProductById(id: string): Product | undefined {
    return this.products().find((p) => p.id === id);
  }
}
