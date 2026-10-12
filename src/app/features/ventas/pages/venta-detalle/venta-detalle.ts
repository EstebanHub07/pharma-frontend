import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../../core/utils/https-errors';
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
  private readonly document = inject(DOCUMENT);
  readonly id = input<string>();
  readonly registrada = input<string>();
  readonly imprimir = input<string>();

  protected readonly venta = signal<Venta | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.id());
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('El identificador de venta no es válido.');
      return;
    }
    this.ventaService.obtener(id).subscribe({
      next: (venta) => {
        this.venta.set(venta);
        if (this.imprimir() === '1') setTimeout(() => this.imprimirComprobante());
      },
      error: (error: HttpErrorResponse) => this.error.set(mensajeError(error)),
    });
  }

  protected imprimirComprobante(): void {
    this.document.defaultView?.print();
  }
}
