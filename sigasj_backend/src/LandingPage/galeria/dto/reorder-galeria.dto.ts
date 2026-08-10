import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderGaleriaItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  idFotografiaGaleria!: number;

  @ApiProperty({ example: 0, description: 'Posición en la galería pública' })
  @IsInt()
  @Min(0)
  ordenVisualizacion!: number;
}

/**
 * Payload para PATCH /api/admin/galeria/orden.
 */
export class ReorderGaleriaDto {
  @ApiProperty({ type: [ReorderGaleriaItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderGaleriaItemDto)
  fotografias!: ReorderGaleriaItemDto[];
}
