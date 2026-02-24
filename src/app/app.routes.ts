import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [

  // ================= LOGIN ROUTE =================
  {
    path: 'login',
    loadComponent: () =>
      import('./app/login/login.component')
        .then(m => m.LoginComponent)
  },

  // ================= CUSTOMER ROUTES =================
  {
    path: 'customers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./customer/customer-list/customer-list.component')
        .then(m => m.CustomerListComponent)
  },
  {
    path: 'customers/add',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./customer/customer-add/add.component')
        .then(m => m.AddComponent)
  },
  {
    path: 'customers/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./customer/customer-edit/customer-edit.component')
        .then(m => m.CustomerEditComponent)
  },

  // ================= QUOTE ROUTES =================
  {
    path: 'quotes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./quote/quote-list/quote-list.component')
        .then(m => m.QuoteListComponent)
  },
  {
    path: 'quotes/add',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./quote/quote-add/quote-add.component')
        .then(m => m.QuoteAddComponent)
  },
  {
    path: 'quotes/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./quote/quote-edit/quote-edit.component')
        .then(m => m.QuoteEditComponent)
  },
  {
    path: 'quotes/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./quote/quote-edit/quote-edit.component')
        .then(m => m.QuoteEditComponent)
  },

  // ================= DEFAULT ROUTE =================
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // ================= FALLBACK ROUTE =================
  {
    path: '**',
    redirectTo: '/login'
  }
];
