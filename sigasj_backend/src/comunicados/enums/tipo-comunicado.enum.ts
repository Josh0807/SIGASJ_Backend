/**
 * Catálogo estable de tipos de comunicado.
 * No existía enum/catálogo previo reutilizable en el proyecto.
 */
export enum TipoComunicado {
  CORTE_DE_AGUA = 'Corte de agua',
  MANTENIMIENTO = 'Mantenimiento',
  REPARACION = 'Reparación',
  EMERGENCIA = 'Emergencia',
  REUNION = 'Reunión',
  AVISO_GENERAL = 'Aviso general',
  SUSPENSION_TEMPORAL_DEL_SERVICIO = 'Suspensión temporal del servicio',
  OTRO = 'Otro',
}
