/**
 * Reglas de vigencia públicas (provisionales hasta existir la entidad real).
 * Los nombres de campo deben alinearse a la entidad cuando esté disponible.
 * La consulta TypeORM deberá replicar estas mismas condiciones en BD.
 */
export type PublicVisibilityRow = {
  activo?: boolean | null;
  fechaInicioVisibilidad?: Date | string | null;
  fechaVencimiento?: Date | string | null;
  fechaPublicacion?: Date | string | null;
  fechaCreacion?: Date | string | null;
};

const toTime = (value: Date | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
};

/** activo + inicio <= ahora + (vencimiento >= ahora OR vencimiento IS NULL) */
export const isPubliclyVisible = (
  row: PublicVisibilityRow,
  now: Date = new Date(),
): boolean => {
  if (row.activo !== true) {
    return false;
  }

  const nowTime = now.getTime();
  const start = toTime(row.fechaInicioVisibilidad);

  if (start === null || start > nowTime) {
    return false;
  }

  const end = toTime(row.fechaVencimiento);
  if (end === null) {
    return true;
  }

  return end >= nowTime;
};

/** fechaPublicacion DESC, fechaCreacion DESC */
export const comparePublicComunicadoOrder = (
  a: PublicVisibilityRow,
  b: PublicVisibilityRow,
): number => {
  const pubA = toTime(a.fechaPublicacion) ?? 0;
  const pubB = toTime(b.fechaPublicacion) ?? 0;
  if (pubA !== pubB) {
    return pubB - pubA;
  }

  const createdA = toTime(a.fechaCreacion) ?? 0;
  const createdB = toTime(b.fechaCreacion) ?? 0;
  return createdB - createdA;
};
