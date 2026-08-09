import { ApiProperty } from '@nestjs/swagger';
import { PublicComunicadoDto } from '../dto/public-comunicado.dto';

/**
 * Respuesta del listado público.
 * No hay interceptor global de envoltura: esta es la única capa `{ data, total }`.
 */
export class PublicComunicadosResponse {
  @ApiProperty({ type: [PublicComunicadoDto] })
  data!: PublicComunicadoDto[];

  @ApiProperty({ example: 0 })
  total!: number;
}
