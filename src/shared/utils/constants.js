export const Roles = {
  Admin: 'admin',
  Fontanero: 'fontanero',
};

export const ESTADOS_AVERIA = [
  'Pendiente',
  'En revision',
  'Asignada',
  'En proceso',
  'Finalizada',
  'Cancelada',
  'No se pudo atender',
];

export const ESTADOS_AVERIA_FONTANERO = [
  'En proceso',
  'Finalizada',
  'No se pudo atender',
];

export const PRIORIDADES_AVERIA = ['Baja', 'Media', 'Alta', 'Urgente'];

export const TIPOS_AVERIA = [
  'Fuga de agua',
  'Tuberia dañada',
  'Falta de agua',
  'Medidor dañado',
  'Otro',
  'Fuga',
  'Baja presion',
  'Ruptura de tuberia',
];

export const TIPOS_SOLICITUD = [
  'Nueva conexion',
  'Disponibilidad de agua',
  'Suspension temporal',
  'Cancelacion del servicio',
  'Cambio de titular',
];

export const TIPOS_ACTIVIDAD_PLOMERIA = [
  'Control de Fugas',
  'Toma de presion',
  'Visita de Campo',
  'Control de Aforos',
  'Control Operativo',
];

export const PRIORIDADES_ACTIVIDAD = ['Baja', 'Media', 'Alta'];

export const ESTADOS_ACTIVIDAD_PLOMERIA = ['Pendiente', 'En progreso', 'Completado'];

export const TIPOS_ACTIVIDAD_FONTANERO = [
  'Reparacion de averia',
  'Lectura de medidor',
  'Cambio de medidor',
  'Revision de tuberia',
  'Instalacion de servicio',
  'Mantenimiento preventivo',
  'Revision de presion de agua',
  'Otro',
];

export const ESTADOS_ACTIVIDAD_FONTANERO = ['Pendiente', 'En proceso', 'Finalizada'];

export const ESTADOS_VALIDACION_ACTIVIDAD = ['Pendiente', 'Validada', 'Rechazada'];

export const ESTADOS_LECTURA_MEDIDOR = [
  'Pendiente',
  'Registrada',
  'Con inconsistencia',
  'Revisada',
];

export function normalizarEstadoAveria(estado) {
  switch (estado) {
    case 'Recibido':
      return 'Pendiente';
    case 'En atencion':
      return 'En proceso';
    case 'Atendido':
      return 'Finalizada';
    default:
      return estado;
  }
}

export function esEstadoAveriaAdmin(estado) {
  return ESTADOS_AVERIA.includes(estado) || ['Recibido', 'En atencion', 'Atendido'].includes(estado);
}

export function siguienteEstadoActividad(estadoActual) {
  if (estadoActual === 'Pendiente') return 'En progreso';
  if (estadoActual === 'En progreso') return 'Completado';
  return 'Pendiente';
}

export function mensajeEstadoAveria(estadoInterno) {
  switch (normalizarEstadoAveria(estadoInterno)) {
    case 'Pendiente':
      return 'Estado: Reporte recibido, pendiente de revision por la ASADA.';
    case 'En revision':
      return 'Estado: En revision por el equipo administrativo.';
    case 'Asignada':
      return 'Estado: Asignada a un fontanero para atencion.';
    case 'En proceso':
      return 'Estado: Un fontanero esta atendiendo el reporte.';
    case 'Finalizada':
      return 'Estado: Averia atendida y finalizada.';
    case 'Cancelada':
      return 'Estado: Reporte cancelado por la administracion.';
    case 'No se pudo atender':
      return 'Estado: No fue posible atender el reporte.';
    default:
      return 'Estado: Reporte recibido, pendiente de revision por la ASADA.';
  }
}

export function mensajeEstadoSolicitud(estadoInterno) {
  switch (estadoInterno) {
    case 'Aprobada':
      return 'Estado: Solicitud aprobada por la ASADA.';
    case 'Rechazada':
      return 'Estado: Solicitud rechazada. Contacte la ASADA para mas detalle.';
    default:
      return 'Estado: En revision por la Secretaria Ejecutiva';
  }
}
