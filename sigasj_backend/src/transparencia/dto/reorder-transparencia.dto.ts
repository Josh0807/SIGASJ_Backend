import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderTransparenciaItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  idPublicacionTransparencia!: number;

  @ApiProperty({ example: 0, description: 'Posición en la sección pública' })
  @IsInt()
  @Min(0)
  ordenVisualizacion!: number;
}

/**
 * Payload para PATCH /api/admin/transparencia/orden.
 */
export class ReorderTransparenciaDto {
  @ApiProperty({ type: [ReorderTransparenciaItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderTransparenciaItemDto)
  publicaciones!: ReorderTransparenciaItemDto[];
}
