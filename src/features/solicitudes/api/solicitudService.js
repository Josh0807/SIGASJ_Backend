import { db } from '../../../shared/db.js';
import { badRequest } from '../../../shared/errors.js';
import { TIPOS_SOLICITUD } from '../../../shared/utils/constants.js';
import { nowIso, textoRequerido } from '../../../shared/utils/helpers.js';
import { generarNumero } from '../../../shared/utils/secuencia.js';

export function crearSolicitud(dto) {
  const tipo = textoRequerido(dto.tipo);
  if (!TIPOS_SOLICITUD.includes(tipo)) {
    throw badRequest('El tipo de solicitud seleccionado no es valido.');
  }

  const numeroSeguimiento = generarNumero('SOL');
  db.prepare(`
    INSERT INTO Solicitudes (
      NumeroSeguimiento, Nombre, Cedula, Telefono, Correo, Direccion, Tipo, Descripcion, Estado, FechaCreacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'En revision', ?)
  `).run(
    numeroSeguimiento,
    textoRequerido(dto.nombre),
    textoRequerido(dto.cedula),
    textoRequerido(dto.telefono),
    textoRequerido(dto.correo),
    textoRequerido(dto.direccion),
    tipo,
    textoRequerido(dto.descripcion),
    nowIso(),
  );

  return {
    numeroSeguimiento,
    mensaje: `Solicitud registrada correctamente. Numero de seguimiento: ${numeroSeguimiento}`,
  };
}
