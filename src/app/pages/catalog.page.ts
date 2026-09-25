import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CATEGORY_SHOWCASE, Category } from '../store/products';
import { StoreService } from '../store/store.service';

@Component({ selector:'app-catalog-page',standalone:true,imports:[FormsModule,RouterLink],templateUrl:'./catalog.page.html' })
export class CatalogPage {
  readonly categories=['Todos','Cuadros','Sets armables','Cajas acrílicas','Llaveros','Minifiguras'] as const;
  readonly categoryShowcase=CATEGORY_SHOWCASE;
  readonly occasions=['Todas','Pareja','Familia','Cumpleaños','Aniversario','Profesiones','Graduación','Amigos','Deportes'] as const;
  readonly search=signal(''); readonly category=signal<'Todos'|Category>('Todos'); readonly occasion=signal('Todas'); readonly visible=signal(12);
  readonly results=computed(()=>{const term=this.search().trim().toLowerCase();return this.store.products.filter(p=>(this.category()==='Todos'||p.category===this.category())&&(this.occasion()==='Todas'||p.occasion.includes(this.occasion()))&&(!term||`${p.name} ${p.kicker} ${p.detail}`.toLowerCase().includes(term)));});
  readonly shown=computed(()=>this.results().slice(0,this.visible()));
  constructor(readonly store:StoreService){}
  setCategory(value:'Todos'|Category){this.category.set(value);this.visible.set(12);}
  count(value:typeof this.categories[number]):number{return value==='Todos'?this.store.products.length:this.store.products.filter(product=>product.category===value).length;}
  clear(){this.search.set('');this.category.set('Todos');this.occasion.set('Todas');this.visible.set(12);}
}
