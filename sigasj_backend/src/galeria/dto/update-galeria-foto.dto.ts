import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const emptyToNull = ({ value }: { value: unknown }) => {
  if (value === '' || value === undefined) {
    return null;
  }
  return typeof value === 'string' ? value.trim() : value;
};

const parseOptionalInt = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
};

/**
 * Actualiza título, descripción, texto alternativo, orden o estado.
 * No modifica la imagen (usar PATCH .../imagen).
 */
export class UpdateGaleriaFotoDto {
  @ApiPropertyOptional({ maxLength: 150 })
  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  titulo?: string | null;

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string | null;

  @ApiPropertyOptional({ maxLength: 255 })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  textoAlternativo?: string;

  @ApiPropertyOptional({ example: 1 })
  @Transform(parseOptionalInt)
  @IsOptional()
  @IsInt()
  @Min(0)
  ordenVisualizacion?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
