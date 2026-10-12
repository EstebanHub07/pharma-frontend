import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { mensajeError } from '../../../../core/utils/https-errors';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

@Component({
  selector: 'app-venta-detalle',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './venta-detalle.html',
  styleUrl: './venta-detalle.css',
})
export class VentaDetalle implements OnInit {
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly document = inject(DOCUMENT);
  readonly id = input<string>();
  readonly registrada = input<string>();
  readonly imprimir = input<string>();

  protected readonly venta = signal<Venta | null>(null);
  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly fechaImpresion = signal(new Date());
  protected readonly numero = computed(() => String(this.venta()?.id ?? '').padStart(6, '0'));
  protected readonly unidades = computed(() =>
    (this.venta()?.detalles ?? []).reduce((suma, detalle) => suma + detalle.cantidad, 0),
  );

  ngOnInit(): void {
    const id = Number(this.id());
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('El identificador de venta no es válido.');
      return;
    }
    this.ventaService
      .obtener(id)
      .pipe(
        switchMap((venta) =>
          this.clienteService.obtener(venta.clienteId).pipe(
            catchError(() => of(null)),
            map((cliente) => ({ venta, cliente })),
          ),
        ),
      )
      .subscribe({
      next: ({ venta, cliente }) => {
        this.venta.set(venta);
        this.cliente.set(cliente);
        if (this.imprimir() === '1') setTimeout(() => this.imprimirComprobante());
      },
      error: (error: HttpErrorResponse) => this.error.set(mensajeError(error)),
    });
  }

  protected imprimirComprobante(): void {
    this.fechaImpresion.set(new Date());
    this.document.defaultView?.print();
  }
}
