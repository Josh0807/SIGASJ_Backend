import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EstadoComunicado } from '../enums/estado-comunicado.enum';

/**
 * Payload exclusivo para PATCH /api/admin/comunicados/:id/estado.
 * Solo `estado`. idUsuarioModificador lo fija el JWT en el servicio.
 */
export class UpdateEstadoComunicadoDto {
  @ApiProperty({ enum: EstadoComunicado, example: EstadoComunicado.INACTIVO })
  @IsEnum(EstadoComunicado)
  estado!: EstadoComunicado;
}
