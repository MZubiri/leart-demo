import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
  // Public Routes (Lazy Loaded)
  {
    path: '',
    loadComponent: () => import('./pages/home.page').then((m) => m.HomePage),
    title: 'Leart Store — Tu historia, pieza por pieza',
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./pages/catalog.page').then((m) => m.CatalogPage),
    title: 'Catálogo | Leart Store',
  },
  {
    path: 'personalizacion',
    loadComponent: () => import('./pages/personalization.page').then((m) => m.PersonalizationPage),
    title: 'Personaliza tu pedido | Leart Store',
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./pages/product.page').then((m) => m.ProductPage),
    title: 'Producto | Leart Store',
  },

  // Admin Routes (Lazy Loaded)
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/pages/admin-login.component').then((m) => m.AdminLoginComponent),
    title: 'Acceso Admin | Leart Store',
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [adminAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/pages/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
        title: 'Dashboard | Leart Admin',
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./admin/pages/admin-settings.component').then((m) => m.AdminSettingsComponent),
        title: 'Configuración WhatsApp | Leart Admin',
      },
      {
        path: 'productos',
        loadComponent: () => import('./admin/pages/admin-products.component').then((m) => m.AdminProductsComponent),
        title: 'Productos | Leart Admin',
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./admin/pages/admin-orders.component').then((m) => m.AdminOrdersComponent),
        title: 'Pedidos y Fotos | Leart Admin',
      },
    ],
  },

  { path: '**', redirectTo: '' },
];

