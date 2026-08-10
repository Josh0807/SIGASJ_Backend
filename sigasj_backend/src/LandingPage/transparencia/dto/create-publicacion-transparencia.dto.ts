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
 * Metadatos para registrar una publicación (el archivo va en multipart `archivo`).
 */
export class CreatePublicacionTransparenciaDto {
  @ApiProperty({ maxLength: 200, example: 'Informe de calidad del agua 2025' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre!: string;

  @ApiProperty({
    maxLength: 500,
    example: 'Resultados del análisis trimestral',
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descripcionBreve!: string;

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
