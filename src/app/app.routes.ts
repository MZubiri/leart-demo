import { Routes } from '@angular/router';
import { CatalogPage } from './pages/catalog.page';
import { HomePage } from './pages/home.page';
import { ProductPage } from './pages/product.page';
import { PersonalizationPage } from './pages/personalization.page';

export const routes: Routes = [
  { path:'',component:HomePage,title:'Leart Store — Tu historia, pieza por pieza' },
  { path:'catalogo',component:CatalogPage,title:'Catálogo | Leart Store' },
  { path:'personalizacion',component:PersonalizationPage,title:'Personaliza tu pedido | Leart Store' },
  { path:'producto/:id',component:ProductPage,title:'Producto | Leart Store' },
  { path:'**',redirectTo:'' }
];
