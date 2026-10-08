import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatCop } from '../store/pricing';
import { CATEGORY_SHOWCASE } from '../store/products';
import { StoreService } from '../store/store.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.page.html',
})
export class HomePage {
  readonly store = inject(StoreService);
  readonly categories = CATEGORY_SHOWCASE;

  get featured() {
    return this.store.productsSignal().slice(0, 6);
  }

  formatPrice(amount?: number): string {
    return amount ? formatCop(amount) : '';
  }
}
