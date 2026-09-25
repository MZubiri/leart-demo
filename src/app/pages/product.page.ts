import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreService } from '../store/store.service';

@Component({ selector:'app-product-page',standalone:true,imports:[RouterLink],templateUrl:'./product.page.html' })
export class ProductPage {
  readonly id=signal('');
  readonly activeImage=signal('');
  readonly product=computed(()=>this.store.products.find(item=>item.id===this.id()));
  readonly gallery=computed(()=>{
    const product=this.product();
    if(!product) return [];
    const extras:Record<string,string[]>={
      'Cuadros':['/catalog-assets/minifiguras/4c0e83a7-4e34-4bfa-82ec-d0f8f3b15c39.jpg'],
      'Sets armables':['/catalog-assets/sets/4af8d6ef-79eb-4bb0-8dce-915751a36f31.jpg','/catalog-assets/sets/c0015487-850f-4e69-ba49-f0f11976840e.jpg'],
      'Cajas acrílicas':['/catalog-assets/minibox/462fcdf5-8fe1-48a2-8887-faa841811c09.png','/catalog-assets/minibox/f639f9d0-9aa9-4b9a-a278-594ce0a45ed2.png'],
      'Llaveros':['/catalog-assets/minifiguras/9cc3d850-256f-4a59-b551-85b0a7fe033c.jpg'],
      'Minifiguras':['/catalog-assets/minifiguras/4037580f-c387-4ccd-b648-b61693339f95.jpg','/catalog-assets/minifiguras/9cc3d850-256f-4a59-b551-85b0a7fe033c.jpg'],
    };
    return [product.image,...extras[product.category]].filter((image,index,all)=>all.indexOf(image)===index);
  });
  readonly related=computed(()=>this.store.products.filter(item=>item.category===this.product()?.category&&item.id!==this.product()?.id).slice(0,3));
  constructor(private route:ActivatedRoute,readonly store:StoreService){this.route.paramMap.subscribe(params=>{this.id.set(params.get('id')||'');setTimeout(()=>this.activeImage.set(this.product()?.image||''));});}
}
