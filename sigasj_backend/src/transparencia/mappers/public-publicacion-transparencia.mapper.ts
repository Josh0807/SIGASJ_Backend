import type { PublicPublicacionTransparenciaDto } from '../dto/public-publicacion-transparencia.dto';
import { TipoArchivoTransparencia } from '../enums/tipo-archivo-transparencia.enum';

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

const asRequiredString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const asTipoArchivo = (
  value: unknown,
): TipoArchivoTransparencia | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  const allowed = Object.values(TipoArchivoTransparencia) as string[];

  return allowed.includes(normalized)
    ? (normalized as TipoArchivoTransparencia)
    : undefined;
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
 * Proyecta un registro/entidad hacia el DTO público de transparencia.
 */
export const toPublicPublicacionTransparenciaDto = (
  source: unknown,
): PublicPublicacionTransparenciaDto | null => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return null;
  }

  const record = source as SourceRecord;
  const id = asId(
    firstPresent(record, ['id', 'idPublicacionTransparencia']),
  );
  const nombre = asRequiredString(firstPresent(record, ['nombre', 'name']));
  const descripcion = asRequiredString(
    firstPresent(record, ['descripcion', 'descripcionBreve', 'description']),
  );
  const archivoUrl = asRequiredString(
    firstPresent(record, ['archivoUrl', 'fileUrl', 'archivo']),
  );
  const tipo = asTipoArchivo(
    firstPresent(record, ['tipo', 'tipoArchivo', 'type']),
  );

  if (
    id === undefined ||
    !nombre ||
    !descripcion ||
    !archivoUrl ||
    !tipo
  ) {
    return null;
  }

  return {
    id,
    nombre,
    descripcion,
    archivoUrl,
    tipo,
  };
};
