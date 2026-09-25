import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORY_SHOWCASE } from '../store/products';
import { StoreService } from '../store/store.service';

@Component({ selector:'app-home-page', standalone:true, imports:[RouterLink], templateUrl:'./home.page.html' })
export class HomePage {
  readonly store=inject(StoreService);
  readonly categories=CATEGORY_SHOWCASE;
  readonly featured=this.store.products.slice(0,5);
}
