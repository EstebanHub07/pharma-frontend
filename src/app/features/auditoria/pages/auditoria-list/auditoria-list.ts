import { DatePipe } from '@angular/common';
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
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs';
import { Pagina } from '../../../../core/models/pagina';
import { mensajeError } from '../../../../core/utils/https-errors';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { ACCIONES_AUDITORIA, EventoAuditoria } from '../../models/evento-auditoria.model';
import { AuditoriaService } from '../../services/auditoria-service';

const texto = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

@Component({
  selector: 'app-auditoria-list',
  imports: [ReactiveFormsModule, DatePipe, Paginador],
  templateUrl: './auditoria-list.html',
  styleUrl: './auditoria-list.css',
})
export class AuditoriaList {
  private readonly fb = inject(FormBuilder);
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly router = inject(Router);

  // Filtros y página llegan de la URL (?usuario=vendedor&accion=VENTA_REGISTRADA&desde=...&hasta=...&pagina=0)
  readonly pagina = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  readonly tamanio = input(20, { transform: (v: unknown) => numberAttribute(v, 20) });
  readonly usuario = input<string | null, unknown>(null, { transform: texto });
  readonly accion = input<string | null, unknown>(null, { transform: texto });
  readonly desde = input<string | null, unknown>(null, { transform: texto });
  readonly hasta = input<string | null, unknown>(null, { transform: texto });

  protected readonly acciones = ACCIONES_AUDITORIA;
  protected readonly errorFiltro = signal<string | null>(null);
  protected readonly filtros = this.fb.group({
    usuario: this.fb.control<string | null>(null),
    accion: this.fb.control<string | null>(null),
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });

  protected readonly eventos = rxResource({
    params: () => ({
      filtro: { usuario: this.usuario(), accion: this.accion(), desde: this.desde(), hasta: this.hasta() },
      pagina: this.pagina(),
      tamanio: this.tamanio(),
    }),
    stream: ({ params }) => this.auditoriaService.buscar(params.filtro, params.pagina, params.tamanio),
  });

  protected readonly pag = linkedSignal<
    Pagina<EventoAuditoria> | undefined,
    Pagina<EventoAuditoria> | undefined
  >({
    source: () => this.eventos.value(),
    computation: (nueva, previa) => nueva ?? previa?.value,
  });

  protected readonly error = computed(() => {
    if (this.errorFiltro()) return this.errorFiltro();
    const err = this.eventos.error();
    return err instanceof HttpErrorResponse ? mensajeError(err) : err ? 'No se pudo cargar la bitácora.' : null;
  });

  constructor() {
    effect(() => {
      this.filtros.setValue(
        { usuario: this.usuario(), accion: this.accion(), desde: this.desde(), hasta: this.hasta() },
        { emitEvent: false },
      );
    });
    // Se espera 300 ms para no consultar con cada letra del usuario.
    this.filtros.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.aplicarFiltros());
  }

  protected limpiar(): void {
    this.filtros.reset({ usuario: null, accion: null, desde: null, hasta: null }, { emitEvent: false });
    this.aplicarFiltros();
  }

  protected irAPagina(pagina: number): void {
    this.navegar({ pagina });
  }

  protected cambiarTamanio(tamanio: number): void {
    this.navegar({ tamanio, pagina: 0 });
  }

  private aplicarFiltros(): void {
    const { usuario, accion, desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.errorFiltro.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.errorFiltro.set(null);
    this.navegar({ usuario: usuario?.trim() || null, accion, desde, hasta, pagina: 0 });
  }

  private navegar(cambios: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }
}
