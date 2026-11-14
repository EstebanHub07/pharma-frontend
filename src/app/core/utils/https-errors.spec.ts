import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { codigoSeguimiento, mensajeError } from './https-errors';

describe('mensajeError', () => {
  it('agrega el código de seguimiento que envía el backend', () => {
    const err = new HttpErrorResponse({
      status: 409,
      error: { message: 'Stock insuficiente', requestId: 'a1b2c3d4' },
    });
    expect(mensajeError(err)).toBe('Stock insuficiente (Código de seguimiento: a1b2c3d4)');
  });

  it('usa la cabecera X-Request-Id si el cuerpo no trae requestId', () => {
    const err = new HttpErrorResponse({
      status: 502,
      statusText: 'Bad Gateway',
      headers: new HttpHeaders({ 'X-Request-Id': 'ffee0011' }),
    });
    expect(codigoSeguimiento(err)).toBe('ffee0011');
  });

  it('no agrega código si no hay conexión', () => {
    const err = new HttpErrorResponse({ status: 0 });
    expect(mensajeError(err)).not.toContain('Código de seguimiento');
  });
});
