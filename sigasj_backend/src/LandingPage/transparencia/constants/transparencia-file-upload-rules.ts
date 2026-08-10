/** Tamaño máximo por archivo: 10 MB (PDF e imágenes). */
export const TRANSPARENCIA_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Formatos permitidos en la sección de transparencia (PBI 1.8). */
export const TRANSPARENCIA_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export type TransparenciaAllowedMimeType =
  (typeof TRANSPARENCIA_ALLOWED_MIME_TYPES)[number];

/** Extensiones válidas por tipo MIME. */
export const TRANSPARENCIA_MIME_TO_EXTENSIONS: Record<
  TransparenciaAllowedMimeType,
  readonly string[]
> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

/** Carpeta relativa al directorio de trabajo donde se guardan los archivos. */
export const TRANSPARENCIA_UPLOAD_SUBDIR = 'uploads/transparencia';

/** Prefijo público de URL para servir los archivos almacenados. */
export const TRANSPARENCIA_PUBLIC_URL_PREFIX = '/uploads/transparencia';
