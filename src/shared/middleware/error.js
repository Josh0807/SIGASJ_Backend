import { HttpError } from '../errors.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  if (err?.status && err.message) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err?.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({
    message: 'Ocurrio un error interno. Intente nuevamente.',
  });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ message: 'Ruta no encontrada.' });
}
