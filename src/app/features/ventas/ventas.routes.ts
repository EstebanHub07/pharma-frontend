import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso-guard';
// Cada página se descarga por separado: abrir la consulta de ventas ya no
// trae el formulario de registro ni el comprobante (Sesión 13, autónoma A.2).
export const VENTAS_ROUTES: Routes = [
  {
    path: '',
    title: 'Consulta de ventas',
    loadComponent: () => import('./pages/venta-list/venta-list').then((m) => m.VentaList),
  },
  {
    path: 'nueva',
    title: 'Nueva venta',
    canActivate: [permisoGuard],
    data: { permiso: 'VENTAS_REGISTRAR' },
    loadComponent: () => import('./pages/venta-form/venta-form').then((m) => m.VentaForm),
  },
  {
    path: ':id',
    title: 'Detalle de venta',
    loadComponent: () => import('./pages/venta-detalle/venta-detalle').then((m) => m.VentaDetalle),
  },
];
