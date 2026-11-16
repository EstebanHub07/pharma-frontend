/** Refleja AuditoriaEventoDTO de PharmaBackend. */
export interface EventoAuditoria {
  id: number;
  fecha: string;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId: number | null;
  detalle: string | null;
  requestId: string | null;
}

export interface FiltroAuditoria {
  usuario: string | null;
  accion: string | null;
  desde: string | null;
  hasta: string | null;
}

/** Acciones que registra el backend (para el filtro). */
export const ACCIONES_AUDITORIA = [
  'LOGIN_EXITOSO',
  'LOGIN_FALLIDO',
  'VENTA_REGISTRADA',
  'PRECIO_MODIFICADO',
  'PRODUCTO_ELIMINADO',
  'CLIENTE_REGISTRADO',
  'CATEGORIA_ELIMINADA',
] as const;
