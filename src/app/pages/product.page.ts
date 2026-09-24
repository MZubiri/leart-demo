import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreService } from '../store/store.service';

@Component({ selector:'app-product-page',standalone:true,imports:[RouterLink],templateUrl:'./product.page.html' })
export class ProductPage {
  readonly id=signal('');
  readonly activeImage=signal('');
  readonly product=computed(()=>this.store.products.find(item=>item.id===this.id()));
  readonly gallery=computed(()=>this.product()?[this.product()!.image,'/catalog-assets/sets/4af8d6ef-79eb-4bb0-8dce-915751a36f31.jpg','/catalog-assets/sets/c0015487-850f-4e69-ba49-f0f11976840e.jpg']:[]);
  readonly related=computed(()=>this.store.products.filter(item=>item.category===this.product()?.category&&item.id!==this.product()?.id).slice(0,3));
  constructor(private route:ActivatedRoute,readonly store:StoreService){this.route.paramMap.subscribe(params=>{this.id.set(params.get('id')||'');setTimeout(()=>this.activeImage.set(this.product()?.image||''));});}
}
