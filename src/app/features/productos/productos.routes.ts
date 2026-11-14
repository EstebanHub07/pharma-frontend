import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso-guard';
// El listado no usa formularios: separar el formulario evita descargar
// @angular/forms al abrir Productos (Sesión 13, autónoma A.2).
const formulario = () =>
  import('./pages/producto-form/producto-form').then((m) => m.ProductoForm);
export const PRODUCTOS_ROUTES: Routes = [
  {
    path: '',
    title: 'Productos',
    loadComponent: () => import('./pages/producto-list/producto-list').then((m) => m.ProductoList),
  },
  {
    path: 'nuevo',
    title: 'Nuevo producto',
    canActivate: [permisoGuard],
    data: { permiso: 'CATALOGO_ESCRIBIR' },
    loadComponent: formulario,
  },
  {
    path: ':id/editar',
    title: 'Editar producto',
    canActivate: [permisoGuard],
    data: { permiso: 'CATALOGO_ESCRIBIR' },
    loadComponent: formulario,
  },
];
