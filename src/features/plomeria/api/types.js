import { formatearFecha } from '../../../shared/utils/helpers.js';

export function toActividadPlomeriaResponse(actividad) {
  return {
    id: actividad.Id,
    tipo: actividad.Tipo,
    cliente: actividad.Cliente,
    ubicacion: actividad.Ubicacion,
    descripcion: actividad.Descripcion,
    fecha: formatearFecha(actividad.FechaCreacion),
    fechaActualizacion: formatearFecha(actividad.FechaActualizacion),
    estado: actividad.Estado,
    prioridad: actividad.Prioridad,
    notasSeguimiento: actividad.NotasSeguimiento,
    numeroAveriaVinculada: actividad.NumeroAveriaVinculada,
  };
}
