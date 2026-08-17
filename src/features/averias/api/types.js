import {
  mensajeEstadoAveria,
  normalizarEstadoAveria,
} from '../../../shared/utils/constants.js';
import { formatearFecha } from '../../../shared/utils/helpers.js';

function crearFoto(nombre, base64) {
  if (!base64) return null;
  return {
    nombre: nombre || 'evidencia.jpg',
    vistaPrevia: base64,
  };
}

export function toAveriaResponse(averia) {
  const estado = normalizarEstadoAveria(averia.Estado);
  return {
    numeroSeguimiento: averia.NumeroSeguimiento,
    nombre: averia.Nombre,
    telefono: averia.Telefono,
    correo: averia.Correo,
    direccion: averia.Direccion,
    tipo: averia.Tipo,
    descripcion: averia.Descripcion,
    fecha: formatearFecha(averia.FechaCreacion),
    estado,
    prioridad: averia.Prioridad,
    mensajeEstado: mensajeEstadoAveria(estado),
    fontaneroAsignado: averia.FontaneroNombre || null,
    notasAtencion: averia.NotasAtencion,
    observacionesAdmin: averia.ObservacionesAdmin,
    descripcionTrabajo: averia.DescripcionTrabajo,
    materialesUtilizados: averia.MaterialesUtilizados,
    fechaUltimaActualizacion: formatearFecha(averia.FechaUltimaActualizacion),
    foto: crearFoto(averia.FotoNombre, averia.FotoBase64),
    evidenciaTrabajo: crearFoto(averia.EvidenciaTrabajoNombre, averia.EvidenciaTrabajoBase64),
  };
}

export function toHistorialResponse(historial) {
  return {
    accion: historial.Accion,
    valorAnterior: historial.ValorAnterior,
    valorNuevo: historial.ValorNuevo,
    usuario: historial.Usuario,
    fecha: formatearFecha(historial.Fecha),
  };
}
