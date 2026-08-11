import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const emptyToNull = ({ value }: { value: unknown }) => {
  if (value === '' || value === undefined) {
    return null;
  }
  return typeof value === 'string' ? value.trim() : value;
};

const parseOptionalBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return value;
};

const parseOptionalInt = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
};

/**
 * Metadatos para registrar una fotografía (el archivo va en multipart `imagen`).
 * No acepta idUsuarioCreador ni fechas de auditoría.
 */
export class CreateGaleriaFotoDto {
  @ApiPropertyOptional({ maxLength: 150, example: 'Asamblea comunitaria' })
  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  titulo?: string | null;

  @ApiPropertyOptional({ maxLength: 500, example: 'Actividad reciente de la ASADA' })
  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string | null;

  @ApiProperty({
    maxLength: 255,
    example: 'Personas participando en la asamblea',
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  textoAlternativo!: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @Transform(parseOptionalInt)
  @IsOptional()
  @IsInt()
  @Min(0)
  ordenVisualizacion?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @Transform(parseOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
