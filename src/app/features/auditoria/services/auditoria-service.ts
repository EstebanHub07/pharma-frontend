import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Pagina } from '../../../core/models/pagina';
import { EventoAuditoria, FiltroAuditoria } from '../models/evento-auditoria.model';

@Service()
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auditoria`;

  buscar(filtro: FiltroAuditoria, pagina: number, tamanio: number): Observable<Pagina<EventoAuditoria>> {
    let params = new HttpParams().set('pagina', pagina).set('tamanio', tamanio);
    if (filtro.usuario) params = params.set('usuario', filtro.usuario);
    if (filtro.accion) params = params.set('accion', filtro.accion);
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    return this.http.get<Pagina<EventoAuditoria>>(this.url, { params });
  }
}
