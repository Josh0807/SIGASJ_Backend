import { ApiProperty } from '@nestjs/swagger';
import { PublicPublicacionTransparenciaDto } from '../dto/public-publicacion-transparencia.dto';

/**
 * Respuesta del listado público de transparencia.
 */
export class PublicTransparenciaResponse {
  @ApiProperty({ type: [PublicPublicacionTransparenciaDto] })
  data!: PublicPublicacionTransparenciaDto[];

  @ApiProperty({ example: 0 })
  total!: number;
}
