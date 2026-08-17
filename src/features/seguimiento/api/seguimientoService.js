import { db } from '../../../shared/db.js';
import { mensajeEstadoAveria, mensajeEstadoSolicitud } from '../../../shared/utils/constants.js';
import { textoRequerido } from '../../../shared/utils/helpers.js';
import { buscarAveria } from '../../averias/api/averiaService.js';
import { toAveriaResponse } from '../../averias/api/types.js';

export function consultarSeguimiento(numeroSeguimiento) {
  const numero = textoRequerido(numeroSeguimiento).toUpperCase();
  if (!numero) return null;

  if (numero.startsWith('AV-')) {
    const averia = buscarAveria(numero);
    if (!averia) return null;
    return {
      numeroSeguimiento: averia.NumeroSeguimiento,
      tipo: 'AV',
      estado: averia.Estado,
      mensajeEstado: mensajeEstadoAveria(averia.Estado),
      detalleAveria: toAveriaResponse(averia),
    };
  }

  if (numero.startsWith('SOL-')) {
    const solicitud = db
      .prepare('SELECT * FROM Solicitudes WHERE UPPER(NumeroSeguimiento) = ?')
      .get(numero);
    if (!solicitud) return null;
    return {
      numeroSeguimiento: solicitud.NumeroSeguimiento,
      tipo: 'SOL',
      estado: solicitud.Estado,
      mensajeEstado: mensajeEstadoSolicitud(solicitud.Estado),
    };
  }

  return null;
}
