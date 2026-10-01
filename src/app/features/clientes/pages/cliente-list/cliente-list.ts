import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../../core/utils/https-errors';
import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';

@Component({
  selector: 'app-cliente-list',
  imports: [RouterLink],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteList implements OnInit {
  private readonly clienteService = inject(ClienteService);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');
  protected readonly filtradas = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    return this.clientes().filter((cliente) =>
      [cliente.dni, cliente.nombres, cliente.apellidos].some((valor) =>
        valor.toLowerCase().includes(texto),
      ),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.clienteService.listar().subscribe({
      next: (respuesta) => {
        this.clientes.set(respuesta);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected eliminar(cliente: Cliente): void {
    if (!confirm(`¿Eliminar al cliente "${cliente.nombres} ${cliente.apellidos}"?`)) {
      return;
    }
    this.clienteService.eliminar(cliente.id).subscribe({
      next: () => this.clientes.update((lista) => lista.filter((c) => c.id !== cliente.id)),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}
