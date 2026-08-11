import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

type FechasVisibilidad = {
  fechaInicioVisibilidad?: string | Date | null;
  fechaVencimiento?: string | Date | null;
};

/**
 * Parsea una fecha de calendario (date-only) sin inventar offsets de TZ.
 * Devuelve null si el valor es inválido o no representa un día real.
 */
export function parseDateOnly(value: string | Date): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

/**
 * Regla de dominio: si hay fechaVencimiento, debe ser >= fechaInicioVisibilidad.
 * Fechas inválidas → false.
 * Si falta alguno de los dos (p. ej. PATCH parcial sin ambos), no valida aquí.
 */
export function isFechaVencimientoGteInicio(
  fechaInicioVisibilidad?: string | Date | null,
  fechaVencimiento?: string | Date | null,
): boolean {
  if (fechaVencimiento == null || fechaVencimiento === '') {
    return true;
  }

  if (fechaInicioVisibilidad == null || fechaInicioVisibilidad === '') {
    return true;
  }

  const inicio = parseDateOnly(fechaInicioVisibilidad);
  const vencimiento = parseDateOnly(fechaVencimiento);

  if (!inicio || !vencimiento) {
    return false;
  }

  return vencimiento >= inicio;
}

@ValidatorConstraint({ name: 'fechaVencimientoGteInicio', async: false })
export class FechaVencimientoGteInicioConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as FechasVisibilidad;
    return isFechaVencimientoGteInicio(
      object.fechaInicioVisibilidad,
      object.fechaVencimiento,
    );
  }

  defaultMessage(): string {
    return 'fechaVencimiento debe ser mayor o igual que fechaInicioVisibilidad';
  }
}
