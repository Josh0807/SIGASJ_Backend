import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
export class PublicComunicadoDto {
  @ApiProperty({ example: 1 })
  id!: string | number;

  @ApiProperty({ example: 'Corte programado de agua' })
  titulo!: string;

  @ApiPropertyOptional({ example: 'Resumen breve del aviso' })
  descripcion?: string | null;

  @ApiPropertyOptional({ example: 'Contenido completo opcional' })
  contenido?: string | null;

  @ApiPropertyOptional({ example: 'Corte de agua' })
  tipo?: string | null;

  @ApiPropertyOptional({ example: '2026-08-08' })
  fechaPublicacion?: string | null;

  @ApiPropertyOptional({ example: '2026-08-15' })
  fechaVencimiento?: string | null;

  @ApiPropertyOptional({ example: 'https://ejemplo.com/imagen.jpg' })
  imagenUrl?: string | null;
}
