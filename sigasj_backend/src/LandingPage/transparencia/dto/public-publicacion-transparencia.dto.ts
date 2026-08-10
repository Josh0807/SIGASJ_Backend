import { ApiProperty } from '@nestjs/swagger';
import { TipoArchivoTransparencia } from '../enums/tipo-archivo-transparencia.enum';

/**
 * DTO público de una publicación de transparencia para la Landing Page.
 *
 * Adaptación respecto a la entidad:
 * - idPublicacionTransparencia → id
 * - descripcionBreve → descripcion
 * - archivoUrl → archivoUrl
 * - tipoArchivo → tipo
 */
export class PublicPublicacionTransparenciaDto {
  @ApiProperty({ example: 1 })
  id!: string | number;

  @ApiProperty({ example: 'Informe de calidad del agua 2025' })
  nombre!: string;

  @ApiProperty({ example: 'Resultados del análisis trimestral' })
  descripcion!: string;

  @ApiProperty({ example: '/uploads/transparencia/informe-2025.pdf' })
  archivoUrl!: string;

  @ApiProperty({ enum: TipoArchivoTransparencia, example: TipoArchivoTransparencia.PDF })
  tipo!: TipoArchivoTransparencia;
}
