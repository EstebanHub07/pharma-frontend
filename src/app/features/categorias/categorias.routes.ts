import { Routes } from '@angular/router';
const formulario = () =>
  import('./pages/categoria-form/categoria-form').then((m) => m.CategoriaForm);
export const CATEGORIAS_ROUTES: Routes = [
  {
    path: '',
    title: 'Categorías',
    loadComponent: () =>
      import('./pages/categoria-list/categoria-list').then((m) => m.CategoriaList),
  },
  { path: 'nuevo', title: 'Nueva categoría', loadComponent: formulario },
  { path: ':id/editar', title: 'Editar categoría', loadComponent: formulario },
];
