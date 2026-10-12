import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/https-errors';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { EstadoVenta, FiltroVentas, Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

const TAMANIO_PAGINA = 10;

@Component({
  selector: 'app-venta-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './venta-list.html',
  styleUrl: './venta-list.css',
})
export class VentaList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly document = inject(DOCUMENT);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly pagina = signal(0);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtros = this.fb.group({
    clienteId: this.fb.control<number | null>(null),
    estado: this.fb.control<EstadoVenta | null>(null),
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });
  protected readonly resultado = signal<PaginaResponse<Venta>>({
    contenido: [], pagina: 0, tamanio: TAMANIO_PAGINA, totalElementos: 0, totalPaginas: 0, ultima: true,
  });
  protected readonly totalPagina = computed(() =>
    this.resultado()
      .contenido.filter((venta) => venta.estado === 'REGISTRADA')
      .reduce((suma, venta) => suma + venta.total, 0),
  );

  ngOnInit(): void {
    this.clienteService.listar().subscribe({
      next: (clientes) => this.clientes.set(clientes),
      error: (error: HttpErrorResponse) => this.error.set(mensajeError(error)),
    });
    this.cargar();
  }

  protected buscar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.pagina.set(0);
    this.cargar();
  }

  protected limpiar(): void {
    this.filtros.reset();
    this.buscar();
  }

  protected irA(pagina: number): void {
    this.pagina.set(pagina);
    this.cargar();
  }

  protected paginasMostradas(): number {
    return Math.max(1, this.resultado().totalPaginas);
  }

  protected imprimirConsulta(): void {
    this.document.defaultView?.print();
  }

  protected resumenFiltros(): string {
    const filtro = this.filtros.getRawValue();
    const cliente = this.clientes().find((item) => item.id === filtro.clienteId);
    return [
      cliente ? `cliente ${cliente.apellidos}, ${cliente.nombres}` : '',
      filtro.estado ? `estado ${filtro.estado}` : '',
      filtro.desde ? `desde ${filtro.desde}` : '',
      filtro.hasta ? `hasta ${filtro.hasta}` : '',
    ]
      .filter(Boolean)
      .join(' · ') || 'ninguno (todas las ventas)';
  }

  private cargar(): void {
    const filtro: FiltroVentas = this.filtros.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    this.ventaService.buscar(filtro, this.pagina(), TAMANIO_PAGINA).subscribe({
      next: (resultado) => {
        this.resultado.set(resultado);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }
}
