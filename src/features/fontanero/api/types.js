import { formatearFecha } from '../../../shared/utils/helpers.js';

export function toActividadFontaneroResponse(actividad) {
  const fecha = new Date(actividad.FechaActividad);
  return {
    id: actividad.Id,
    fontanero: actividad.FontaneroNombre,
    fechaActividad: formatearFecha(actividad.FechaActividad),
    fechaActividadIso: Number.isNaN(fecha.getTime())
      ? actividad.FechaActividad
      : fecha.toISOString().slice(0, 10),
    horaInicio: actividad.HoraInicio,
    horaFin: actividad.HoraFin,
    tipo: actividad.Tipo,
    descripcion: actividad.Descripcion,
    ubicacion: actividad.Ubicacion,
    numeroAveriaVinculada: actividad.NumeroAveriaVinculada,
    lecturaMedidorId: actividad.LecturaMedidorId,
    materialesUtilizados: actividad.MaterialesUtilizados,
    observaciones: actividad.Observaciones,
    estado: actividad.Estado,
    estadoValidacion: actividad.EstadoValidacion,
    observacionValidacion: actividad.ObservacionValidacion,
    fechaCreacion: formatearFecha(actividad.FechaCreacion),
    fechaActualizacion: formatearFecha(actividad.FechaActualizacion),
  };
}
