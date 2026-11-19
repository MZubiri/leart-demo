import { HttpErrorResponse } from '@angular/common/http';

export function httpErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0) return fallback + ' No se pudo confirmar la respuesta; revisa la conexión y el estado antes de repetir una operación.';
  if (error.status >= 500) return fallback + ' El servidor no pudo completarla. Reintenta más tarde.';
  const body = error.error;
  if (body?.errors && typeof body.errors === 'object') {
    const messages = Object.entries(body.errors).flatMap(([field, values]) => Array.isArray(values)
      ? values.filter(value => typeof value === 'string').map(value => field + ': ' + value) : []);
    if (messages.length) return messages.slice(0, 6).join(' ').slice(0, 1200);
  }
  return typeof body?.message === 'string' ? body.message.slice(0, 1200) : fallback;
}
