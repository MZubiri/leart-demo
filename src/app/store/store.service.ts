import { computed, effect, Injectable, signal } from '@angular/core';
import { PRODUCTS, Product } from './products';

export interface CartLine { product:Product; quantity:number; note:string; }

@Injectable({ providedIn:'root' })
export class StoreService {
  readonly products = PRODUCTS;
  readonly cart = signal<Record<string,{ quantity:number; note:string }>>(this.loadCart());
  readonly cartOpen = signal(false);
  readonly customizerOpen = signal(false);
  readonly cartCount = computed(() => Object.values(this.cart()).reduce((total,line) => total + line.quantity,0));
  readonly cartLines = computed<CartLine[]>(() => Object.entries(this.cart()).map(([id,line]) => ({ product:this.products.find(product => product.id === id)!,...line })).filter(line => line.product));

  constructor() { effect(() => localStorage.setItem('leart-cart',JSON.stringify(this.cart()))); }
  private loadCart():Record<string,{quantity:number;note:string}> { try { return JSON.parse(localStorage.getItem('leart-cart') || '{}'); } catch { return {}; } }
  add(product:Product,note=''):void { this.cart.update(cart => ({...cart,[product.id]:{quantity:(cart[product.id]?.quantity || 0)+1,note:note || cart[product.id]?.note || ''}})); this.openCart(); }
  changeQuantity(id:string,change:number):void { this.cart.update(cart => { const updated={...cart}; const next=(updated[id]?.quantity || 0)+change; if(next<=0) delete updated[id]; else updated[id]={...updated[id],quantity:next}; return updated; }); }
  updateNote(id:string,note:string):void { this.cart.update(cart => ({...cart,[id]:{...cart[id],note}})); }
  clear():void { this.cart.set({}); }
  openCart():void { this.cartOpen.set(true); document.body.style.overflow='hidden'; }
  closeCart():void { this.cartOpen.set(false); document.body.style.overflow=''; }
  openCustomizer():void { this.customizerOpen.set(true); document.body.style.overflow='hidden'; }
  closeCustomizer():void { this.customizerOpen.set(false); document.body.style.overflow=''; }
  whatsappUrl():string {
    const lines=this.cartLines().map(line => `• ${line.quantity}x ${line.product.name} (${line.product.detail})${line.note ? ` — ${line.note}` : ''}`);
    return `https://wa.me/?text=${encodeURIComponent(`Hola Leart 👋 Quisiera cotizar:\n\n${lines.join('\n')}\n\nMi nombre es:`)}`;
  }
}
