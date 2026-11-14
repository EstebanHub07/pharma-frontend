import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  numberAttribute,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Pagina } from '../../../../core/models/pagina';
import { mensajeError } from '../../../../core/utils/https-errors';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { Direccion, OrdenProducto, Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto-service';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Paginador } from '../../../../shared/components/paginador/paginador';

@Component({
  selector: 'app-producto-list',
  imports: [RouterLink, CurrencyPipe, SiPermiso, Paginador],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
})
export class ProductoList {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);

  // Llegan de la URL (?pagina=2&tamanio=20&orden=nombre&dir=asc&categoriaId=7)
  readonly pagina = input(0, {
    transform: (v: unknown) => numberAttribute(v, 0),
  });
  readonly tamanio = input(20, {
    transform: (v: unknown) => numberAttribute(v, 20),
  });
  readonly orden = input<OrdenProducto, unknown>('nombre', {
    transform: (v: unknown) => (v as OrdenProducto) || 'nombre',
  });
  readonly dir = input<Direccion, unknown>('asc', {
    transform: (v: unknown) => (v === 'desc' ? 'desc' : 'asc'),
  });
  readonly categoriaId = input<number | null, unknown>(null, {
    transform: (v: unknown) => numberAttribute(v, 0) || null,
  });

  protected readonly productos = rxResource({
    params: () => ({
      pagina: this.pagina(),
      tamanio: this.tamanio(),
      ordenarPor: this.orden(),
      direccion: this.dir(),
    }),
    stream: ({ params }) => this.productoService.listar(params),
  });

  // Conserva la página anterior mientras llega la nueva (sin parpadeo)
  protected readonly pag = linkedSignal<
    Pagina<Producto> | undefined,
    Pagina<Producto> | undefined
  >({
    source: () => this.productos.value(),
    computation: (nueva, previa) => nueva ?? previa?.value,
  });

  protected readonly categorias = toSignal(
    this.categoriaService.listar().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );
  protected readonly nombreCategoriaFiltro = computed(
    () => this.categorias().find((c) => c.id === this.categoriaId())?.nombre ?? this.categoriaId(),
  );
  /** El filtro de categoría se aplica sobre la página actual (el API no filtra por categoría). */
  protected readonly filas = computed(() => {
    const filtro = this.categoriaId();
    const lista = this.pag()?.contenido ?? [];
    return filtro === null ? lista : lista.filter((p) => p.categoriaId === filtro);
  });
  protected readonly error = computed(() => {
    const err = this.productos.error();
    return err instanceof HttpErrorResponse ? mensajeError(err) : err ? 'No se pudo cargar la lista.' : null;
  });

  protected irAPagina(pagina: number): void {
    this.navegar({ pagina });
  }

  protected cambiarTamanio(tamanio: number): void {
    this.navegar({ tamanio, pagina: 0 }); // vuelve a la primera
  }

  protected ordenarPor(campo: OrdenProducto): void {
    const dir =
      this.orden() === campo && this.dir() === 'asc' ? 'desc' : 'asc';
    this.navegar({ orden: campo, dir, pagina: 0 });
  }

  protected filtrarPorCategoria(valor: string): void {
    this.navegar({ categoriaId: valor || null });
  }

  protected darDeBaja(producto: Producto): void {
    if (!confirm(`¿Dar de baja el producto "${producto.nombre}"?`)) {
      return;
    }
    this.productoService.darDeBaja(producto.id).subscribe({
      next: () => this.productos.reload(),
      error: (err: HttpErrorResponse) => alert(mensajeError(err)),
    });
  }

  private navegar(cambios: Record<string, string | number | null>): void {
    this.router.navigate([], {
      queryParams: cambios,
      queryParamsHandling: 'merge',
    });
  }
}
