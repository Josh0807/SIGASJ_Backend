/**
 * DTO público de un comunicado para la Landing Page.
 *
 * Nombres alineados al contrato que ya consume el Front-end
 * (`mapPublicAnnouncement`: id, titulo, descripcion, contenido, tipo,
 * fechaPublicacion, imagenUrl).
 *
 * Adaptación respecto al ejemplo conceptual de la tarea:
 * - idComunicado → id
 * - descripcionBreve → descripcion
 * - tipoComunicado → tipo
 *
 * No incluye creador, auditoría interna ni datos administrativos.
 */
export type PublicComunicadoDto = {
  id: string | number;
  titulo: string;
  descripcion?: string | null;
  contenido?: string | null;
  tipo?: string | null;
  fechaPublicacion?: string | null;
  fechaVencimiento?: string | null;
  imagenUrl?: string | null;
};
