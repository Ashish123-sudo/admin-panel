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

  // ================= SETTINGS ROUTES =================
  {
    path: 'settings/terms',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./settings/tc-library/tc-library.component')
        .then(m => m.TcLibraryComponent)
  },
  {
    path: 'settings/templates',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./settings/tc-template/tc-template-list.component')
        .then(m => m.TcTemplateListComponent)
  },
  {
    path: 'settings/templates/add',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./settings/tc-template/tc-template-add.component')
        .then(m => m.TcTemplateAddComponent)
  },
  {
    path: 'settings/templates/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./settings/tc-template/tc-template-add.component')
        .then(m => m.TcTemplateAddComponent)
  },
  {
    path: 'settings/currencies',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./settings/currencies/currencies.component')
        .then(m => m.CurrenciesComponent)
  },
  {
    path: 'settings/roles',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./settings/roles/roles.component')
        .then(m => m.RolesComponent)
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