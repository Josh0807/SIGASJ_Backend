export class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.errors = errors;
  }
}

export function badRequest(message, errors) {
  return new HttpError(400, message, errors);
}

export function unauthorized(message = 'Sesion no valida.') {
  return new HttpError(401, message);
}

export function forbidden(message) {
  return new HttpError(403, message);
}

export function notFound(message) {
  return new HttpError(404, message);
}
