import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Actualiza nombre y descripción breve.
 * No modifica el archivo (usar PATCH .../archivo).
 */
export class UpdatePublicacionTransparenciaDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descripcionBreve?: string;
}
