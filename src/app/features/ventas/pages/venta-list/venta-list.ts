import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, of } from 'rxjs';
import { Pagina } from '../../../../core/models/pagina';
import { mensajeError } from '../../../../core/utils/https-errors';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { EstadoVenta, Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Paginador } from '../../../../shared/components/paginador/paginador';

const texto = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

@Component({
  selector: 'app-venta-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, SiPermiso, Paginador],
  templateUrl: './venta-list.html',
  styleUrl: './venta-list.css',
})
export class VentaList {
  private readonly fb = inject(FormBuilder);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  // Página y filtros llegan de la URL (?pagina=4&tamanio=10&clienteId=3&estado=REGISTRADA&desde=...&hasta=...)
  readonly pagina = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  readonly tamanio = input(10, { transform: (v: unknown) => numberAttribute(v, 10) });
  readonly clienteId = input<number | null, unknown>(null, {
    transform: (v: unknown) => numberAttribute(v, 0) || null,
  });
  readonly estado = input<EstadoVenta | null, unknown>(null, {
    transform: (v: unknown) => (texto(v) as EstadoVenta | null),
  });
  readonly desde = input<string | null, unknown>(null, { transform: texto });
  readonly hasta = input<string | null, unknown>(null, { transform: texto });

  protected readonly clientes = toSignal(
    this.clienteService.listar().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );
  protected readonly errorFiltro = signal<string | null>(null);
  protected readonly fechaImpresion = signal(new Date());
  protected readonly filtros = this.fb.group({
    clienteId: this.fb.control<number | null>(null),
    estado: this.fb.control<EstadoVenta | null>(null),
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });

  protected readonly ventas = rxResource({
    params: () => ({
      filtro: {
        clienteId: this.clienteId(),
        estado: this.estado(),
        desde: this.desde(),
        hasta: this.hasta(),
      },
      pagina: this.pagina(),
      tamanio: this.tamanio(),
    }),
    stream: ({ params }) => this.ventaService.buscar(params.filtro, params.pagina, params.tamanio),
  });

  // Conserva la página anterior mientras llega la nueva (sin parpadeo)
  protected readonly pag = linkedSignal<Pagina<Venta> | undefined, Pagina<Venta> | undefined>({
    source: () => this.ventas.value(),
    computation: (nueva, previa) => nueva ?? previa?.value,
  });

  protected readonly error = computed(() => {
    if (this.errorFiltro()) return this.errorFiltro();
    const err = this.ventas.error();
    return err instanceof HttpErrorResponse ? mensajeError(err) : err ? 'No se pudo cargar la lista.' : null;
  });
  protected readonly totalPagina = computed(() =>
    (this.pag()?.contenido ?? [])
      .filter((venta) => venta.estado === 'REGISTRADA')
      .reduce((suma, venta) => suma + venta.total, 0),
  );

  constructor() {
    // La URL manda: el formulario refleja los filtros vigentes (también tras F5).
    effect(() => {
      this.filtros.setValue(
        { clienteId: this.clienteId(), estado: this.estado(), desde: this.desde(), hasta: this.hasta() },
        { emitEvent: false },
      );
    });
    // Cambiar cualquier filtro vuelve a la primera página.
    this.filtros.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.aplicarFiltros());
  }

  protected buscar(): void {
    this.aplicarFiltros();
  }

  protected limpiar(): void {
    this.filtros.reset({ clienteId: null, estado: null, desde: null, hasta: null }, { emitEvent: false });
    this.aplicarFiltros();
  }

  protected irAPagina(pagina: number): void {
    this.navegar({ pagina });
  }

  protected cambiarTamanio(tamanio: number): void {
    this.navegar({ tamanio, pagina: 0 });
  }

  protected imprimirConsulta(): void {
    this.fechaImpresion.set(new Date());
    this.document.defaultView?.print();
  }

  protected resumenFiltros(): string {
    const cliente = this.clientes().find((item) => item.id === this.clienteId());
    return [
      cliente ? `cliente ${cliente.apellidos}, ${cliente.nombres}` : '',
      this.estado() ? `estado ${this.estado()}` : '',
      this.desde() ? `desde ${this.desde()}` : '',
      this.hasta() ? `hasta ${this.hasta()}` : '',
    ]
      .filter(Boolean)
      .join(' · ') || 'ninguno (todas las ventas)';
  }

  private aplicarFiltros(): void {
    const { clienteId, estado, desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.errorFiltro.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.errorFiltro.set(null);
    // La página 7 del filtro anterior puede no existir con el filtro nuevo.
    this.navegar({ clienteId, estado, desde, hasta, pagina: 0 });
  }

  private navegar(cambios: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }
}
