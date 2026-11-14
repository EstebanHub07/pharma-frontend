import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Pagina } from '../../../core/models/pagina';
import { FiltroVentas, Venta, VentaRequest } from '../models/venta.model';

interface PaginaApiResponse<T> {
  contenido?: T[];
  content?: T[];
  pagina?: number;
  number?: number;
  tamanio?: number;
  size?: number;
  totalElementos?: number;
  totalElements?: number;
  totalPaginas?: number;
  totalPages?: number;
  ultima?: boolean;
  last?: boolean;
}

const normalizarPagina = <T>(respuesta: PaginaApiResponse<T> | T[]): Pagina<T> => {
  if (Array.isArray(respuesta)) {
    return {
      contenido: respuesta,
      pagina: 0,
      tamanio: respuesta.length,
      totalElementos: respuesta.length,
      totalPaginas: 1,
      ultima: true,
    };
  }

  return {
    contenido: respuesta.contenido ?? respuesta.content ?? [],
    pagina: respuesta.pagina ?? respuesta.number ?? 0,
    tamanio: respuesta.tamanio ?? respuesta.size ?? 0,
    totalElementos: respuesta.totalElementos ?? respuesta.totalElements ?? 0,
    totalPaginas: respuesta.totalPaginas ?? respuesta.totalPages ?? 0,
    ultima: respuesta.ultima ?? respuesta.last ?? true,
  };
};

@Service()
export class VentaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ventas`;

  registrar(dto: VentaRequest): Observable<Venta> {
    return this.http.post<Venta>(this.url, dto);
  }

  obtener(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.url}/${id}`);
  }

  buscar(filtro: FiltroVentas, pagina: number, tamanio = 10): Observable<Pagina<Venta>> {
    let params = new HttpParams()
      .set('ordenarPor', 'fecha')
      .set('direccion', 'desc')
      .set('pagina', pagina)
      .set('tamanio', tamanio);
    if (filtro.clienteId !== null) params = params.set('clienteId', filtro.clienteId);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    return this.http
      .get<PaginaApiResponse<Venta> | Venta[]>(`${this.url}/buscar`, { params })
      .pipe(map(normalizarPagina));
  }
}
