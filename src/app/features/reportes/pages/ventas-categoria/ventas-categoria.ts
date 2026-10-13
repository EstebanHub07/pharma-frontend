import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { mensajeError } from '../../../../core/utils/https-errors';
import { porcentajeDe } from '../../../../core/utils/porcentaje';
import { VentaPorCategoria } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte-service';

@Component({
  selector: 'app-ventas-categoria',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './ventas-categoria.html',
  styleUrl: './ventas-categoria.css',
})
export class VentasCategoria implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reporteService = inject(ReporteService);

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly reportes = signal<VentaPorCategoria[]>([]);
  protected readonly filtros = this.fb.group({
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });
  protected readonly mayorMonto = computed(() =>
    this.reportes().reduce((mayor, reporte) => Math.max(mayor, reporte.montoTotal), 0),
  );
  protected readonly totalUnidades = computed(() =>
    this.reportes().reduce((total, reporte) => total + reporte.cantidadVendida, 0),
  );
  protected readonly montoGeneral = computed(() =>
    this.reportes().reduce((total, reporte) => total + reporte.montoTotal, 0),
  );

  ngOnInit(): void {
    this.generar();
  }

  protected generar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.ventasPorCategoria(desde, hasta).subscribe({
      next: (reportes) => {
        this.reportes.set(reportes);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  protected porcentaje(reporte: VentaPorCategoria): number {
    return porcentajeDe(reporte.montoTotal, this.mayorMonto());
  }
}
