import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { mensajeError } from '../../../../core/utils/https-errors';
import { redondear } from '../../../../core/utils/numeros';
import { coincide } from '../../../../core/utils/texto';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { Producto } from '../../../productos/models/producto.model';
import { ProductoService } from '../../../productos/services/producto-service';
import { VentaRequest } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

interface LineaForm {
  productoId: FormControl<number | null>;
  cantidad: FormControl<number | null>;
}

const MAX_RESULTADOS = 6;

@Component({
  selector: 'app-venta-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './venta-form.html',
  styleUrl: './venta-form.css',
})
export class VentaForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly productoService = inject(ProductoService);
  private readonly router = inject(Router);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly confirmando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly imprimirAlRegistrar = signal(true);

  protected readonly form = this.fb.group({
    clienteId: this.fb.control<number | null>(null, Validators.required),
    detalles: this.fb.array<FormGroup<LineaForm>>([], Validators.required),
  });

  protected readonly buscarCliente = new FormControl('', { nonNullable: true });
  protected readonly buscarProducto = new FormControl('', { nonNullable: true });
  private readonly textoCliente = toSignal(this.buscarCliente.valueChanges, { initialValue: '' });
  private readonly textoProducto = toSignal(this.buscarProducto.valueChanges, { initialValue: '' });
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly tieneBusquedaCliente = computed(() => this.textoCliente().trim().length > 0);
  protected readonly tieneBusquedaProducto = computed(() => this.textoProducto().trim().length > 0);
  protected readonly clienteElegido = computed(() =>
    this.clientes().find((cliente) => cliente.id === this.form.controls.clienteId.value) ?? null,
  );
  protected readonly clientesEncontrados = computed(() => {
    const texto = this.textoCliente().trim();
    return texto
      ? this.clientes()
          .filter((cliente) => cliente.estado && coincide(texto, cliente.nombres, cliente.apellidos, cliente.dni))
          .slice(0, MAX_RESULTADOS)
      : [];
  });
  protected readonly productosEncontrados = computed(() => {
    const texto = this.textoProducto().trim();
    return texto
      ? this.productos()
          .filter((producto) => producto.estado && coincide(texto, producto.nombre, producto.categoriaNombre))
          .slice(0, MAX_RESULTADOS)
      : [];
  });
  protected readonly lineas = computed(() => {
    this.valores();
    return this.detalles.controls.map((linea) => {
      const producto = this.productos().find((item) => item.id === linea.controls.productoId.value);
      const cantidad = Number(linea.controls.cantidad.value) || 0;
      return { linea, producto, cantidad, subtotal: redondear((producto?.precio ?? 0) * cantidad) };
    });
  });
  protected readonly total = computed(() => redondear(this.lineas().reduce((suma, linea) => suma + linea.subtotal, 0)));

  get detalles() {
    return this.form.controls.detalles;
  }

  ngOnInit(): void {
    forkJoin({
      clientes: this.clienteService.listar(),
      productos: this.productoService.listar(0, 100, 'nombre', 'asc'),
    }).subscribe({
      next: ({ clientes, productos }) => {
        this.clientes.set(clientes);
        this.productos.set(productos.contenido);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  protected elegirCliente(cliente: Cliente): void {
    this.form.controls.clienteId.setValue(cliente.id);
    this.buscarCliente.setValue('');
  }

  protected cambiarCliente(): void {
    this.form.controls.clienteId.setValue(null);
  }

  protected agregarProducto(producto: Producto): void {
    const existente = this.detalles.controls.find((linea) => linea.controls.productoId.value === producto.id);
    if (existente) {
      existente.controls.cantidad.setValue((existente.controls.cantidad.value ?? 0) + 1);
    } else {
      this.detalles.push(
        this.fb.group<LineaForm>({
          productoId: this.fb.control(producto.id, Validators.required),
          cantidad: this.fb.control(1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]),
        }),
      );
    }
    this.buscarProducto.setValue('');
  }

  protected agregarPrimero(evento: Event): void {
    evento.preventDefault();
    const producto = this.productosEncontrados()[0];
    if (producto) this.agregarProducto(producto);
  }

  protected quitarLinea(indice: number): void {
    this.detalles.removeAt(indice);
  }

  protected cantidadEnDetalle(productoId: number): number {
    return this.detalles.controls.find((linea) => linea.controls.productoId.value === productoId)?.controls.cantidad.value ?? 0;
  }

  protected excedeStock(indice: number): boolean {
    const linea = this.lineas()[indice];
    return !!linea?.producto && linea.cantidad > linea.producto.stock;
  }

  protected revisar(): void {
    this.error.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.detalles.controls.some((_, indice) => this.excedeStock(indice))) {
      if (this.detalles.controls.some((_, indice) => this.excedeStock(indice))) {
        this.error.set('Corrija las cantidades que superan el stock disponible.');
      }
      return;
    }
    this.confirmando.set(true);
  }

  protected volverAEditar(): void {
    this.confirmando.set(false);
  }

  protected confirmar(): void {
    const clienteId = this.form.controls.clienteId.value;
    if (!clienteId || this.guardando()) return;
    const dto: VentaRequest = {
      clienteId,
      detalles: this.detalles.controls.map((linea) => ({
        productoId: Number(linea.controls.productoId.value),
        cantidad: Number(linea.controls.cantidad.value),
      })),
    };
    this.guardando.set(true);
    this.ventaService.registrar(dto).subscribe({
      next: (venta) =>
        this.router.navigate(['/ventas', venta.id], {
          queryParams: { registrada: 1, imprimir: this.imprimirAlRegistrar() ? 1 : null },
        }),
      error: (error: HttpErrorResponse) => {
        this.error.set(mensajeError(error));
        this.guardando.set(false);
        this.confirmando.set(false);
      },
    });
  }
}
