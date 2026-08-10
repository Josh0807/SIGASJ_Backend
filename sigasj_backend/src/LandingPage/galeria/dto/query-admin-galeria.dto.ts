import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

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

export class QueryAdminGaleriaDto {
  @ApiPropertyOptional({ example: true })
  @Transform(parseOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial en el título.',
    example: 'proyecto',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  titulo?: string;
}
