import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin/admin-layout.component';
import { AdminDashboardComponent } from './admin/pages/admin-dashboard.component';
import { AdminLoginComponent } from './admin/pages/admin-login.component';
import { AdminOrdersComponent } from './admin/pages/admin-orders.component';
import { AdminProductsComponent } from './admin/pages/admin-products.component';
import { AdminSettingsComponent } from './admin/pages/admin-settings.component';
import { adminAuthGuard } from './core/guards/admin-auth.guard';
import { CatalogPage } from './pages/catalog.page';
import { HomePage } from './pages/home.page';
import { PersonalizationPage } from './pages/personalization.page';
import { ProductPage } from './pages/product.page';

export const routes: Routes = [
  // Public Routes
  { path: '', component: HomePage, title: 'Leart Store — Tu historia, pieza por pieza' },
  { path: 'catalogo', component: CatalogPage, title: 'Catálogo | Leart Store' },
  { path: 'personalizacion', component: PersonalizationPage, title: 'Personaliza tu pedido | Leart Store' },
  { path: 'producto/:id', component: ProductPage, title: 'Producto | Leart Store' },

  // Admin Routes
  { path: 'admin/login', component: AdminLoginComponent, title: 'Acceso Admin | Leart Store' },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent, title: 'Dashboard | Leart Admin' },
      { path: 'configuracion', component: AdminSettingsComponent, title: 'Configuración WhatsApp | Leart Admin' },
      { path: 'productos', component: AdminProductsComponent, title: 'Productos | Leart Admin' },
      { path: 'pedidos', component: AdminOrdersComponent, title: 'Pedidos y Fotos | Leart Admin' },
    ],
  },

  { path: '**', redirectTo: '' },
];
