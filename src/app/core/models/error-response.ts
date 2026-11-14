export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors: Record<string, string> | null;
  /** Identificador de la petición en el log del backend (X-Request-Id). */
  requestId?: string | null;
}
