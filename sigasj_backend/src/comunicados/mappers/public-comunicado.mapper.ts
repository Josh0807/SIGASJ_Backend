import type { PublicComunicadoDto } from '../dto/public-comunicado.dto';

type SourceRecord = Record<string, unknown>;

const asId = (value: unknown): string | number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  return undefined;
};

const asNullableString = (value: unknown): string | null | undefined => {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  return undefined;
};

const firstPresent = (source: SourceRecord, keys: string[]): unknown => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];
      if (value !== undefined) {
        return value;
      }
    }
  }
  return undefined;
};

/**
 * Proyecta un registro/entidad hacia el DTO público.
 * Solo expone campos permitidos para la Landing Page.
 */
export const toPublicComunicadoDto = (
  source: unknown,
): PublicComunicadoDto | null => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return null;
  }

  const record = source as SourceRecord;
  const id = asId(firstPresent(record, ['id', 'idComunicado']));
  const titulo = asNullableString(firstPresent(record, ['titulo', 'title']));

  if (id === undefined || !titulo) {
    return null;
  }

  const dto: PublicComunicadoDto = {
    id,
    titulo,
  };

  const descripcion = asNullableString(
    firstPresent(record, ['descripcion', 'descripcionBreve', 'summary']),
  );
  if (descripcion !== undefined) {
    dto.descripcion = descripcion;
  }

  const contenido = asNullableString(
    firstPresent(record, ['contenido', 'content']),
  );
  if (contenido !== undefined) {
    dto.contenido = contenido;
  }

  const tipo = asNullableString(
    firstPresent(record, ['tipo', 'tipoComunicado', 'type']),
  );
  if (tipo !== undefined) {
    dto.tipo = tipo;
  }

  const fechaPublicacion = asNullableString(
    firstPresent(record, ['fechaPublicacion', 'publishedAt']),
  );
  if (fechaPublicacion !== undefined) {
    dto.fechaPublicacion = fechaPublicacion;
  }

  const fechaVencimiento = asNullableString(
    firstPresent(record, ['fechaVencimiento', 'expiresAt']),
  );
  if (fechaVencimiento !== undefined) {
    dto.fechaVencimiento = fechaVencimiento;
  }

  const imagenUrl = asNullableString(
    firstPresent(record, ['imagenUrl', 'imageUrl', 'imagen']),
  );
  if (imagenUrl !== undefined) {
    dto.imagenUrl = imagenUrl;
  }

  return dto;
};
