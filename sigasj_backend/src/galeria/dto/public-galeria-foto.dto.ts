/**
 * DTO público de una fotografía de galería para la Landing Page.
 *
 * Expone únicamente la información visible al visitante.
 * No incluye datos administrativos ni de auditoría.
 */
export type PublicGaleriaFotoDto = {
  id: string | number;
  titulo?: string | null;
  descripcion?: string | null;
  imagenUrl: string;
  textoAlternativo: string;
};
