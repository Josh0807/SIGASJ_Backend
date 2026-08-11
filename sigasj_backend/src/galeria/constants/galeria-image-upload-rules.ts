/** Tamaño máximo por imagen: 5 MB. */
export const GALERIA_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Formatos permitidos para la galería pública. */
export const GALERIA_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type GaleriaAllowedMimeType = (typeof GALERIA_ALLOWED_MIME_TYPES)[number];

/** Extensiones válidas por tipo MIME. */
export const GALERIA_MIME_TO_EXTENSIONS: Record<
  GaleriaAllowedMimeType,
  readonly string[]
> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

/** Carpeta relativa al directorio de trabajo donde se guardan las imágenes. */
export const GALERIA_UPLOAD_SUBDIR = 'uploads/galeria';

/** Prefijo público de URL para servir las imágenes almacenadas. */
export const GALERIA_PUBLIC_URL_PREFIX = '/uploads/galeria';
