import type { PublicGaleriaFotoDto } from '../dto/public-galeria-foto.dto';

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

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  return undefined;
};

const asRequiredString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
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
 * Proyecta un registro/entidad hacia el DTO público de galería.
 */
export const toPublicGaleriaFotoDto = (
  source: unknown,
): PublicGaleriaFotoDto | null => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return null;
  }

  const record = source as SourceRecord;
  const id = asId(firstPresent(record, ['id', 'idFotografiaGaleria']));
  const imagenUrl = asRequiredString(
    firstPresent(record, ['imagenUrl', 'imageUrl', 'imagen']),
  );
  const textoAlternativo = asRequiredString(
    firstPresent(record, ['textoAlternativo', 'alt', 'altText']),
  );

  if (id === undefined || !imagenUrl || !textoAlternativo) {
    return null;
  }

  const dto: PublicGaleriaFotoDto = {
    id,
    imagenUrl,
    textoAlternativo,
  };

  const titulo = asNullableString(firstPresent(record, ['titulo', 'title']));
  if (titulo !== undefined) {
    dto.titulo = titulo;
  }

  const descripcion = asNullableString(
    firstPresent(record, ['descripcion', 'description']),
  );
  if (descripcion !== undefined) {
    dto.descripcion = descripcion;
  }

  return dto;
};
