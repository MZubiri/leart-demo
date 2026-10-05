import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PRODUCTS, Product } from '../../store/products';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  readonly products = signal<Product[]>(PRODUCTS);
  readonly loading = signal(false);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.http.get<Product[]>(`${environment.apiUrl}/public/products`).subscribe({
      next: (apiProducts) => {
        if (apiProducts && apiProducts.length > 0) {
          this.products.set(apiProducts);
        }
        this.loading.set(false);
      },
      error: () => {
        // Keep fallback PRODUCTS
        this.loading.set(false);
      },
    });
  }

  getProductById(id: string): Product | undefined {
    return this.products().find((p) => p.id === id);
  }
}
