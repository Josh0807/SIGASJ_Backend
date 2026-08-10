import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

const parseBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true' || value === true) {
    return true;
  }
  if (value === 'false' || value === false) {
    return false;
  }
  return value;
};

/**
 * Payload exclusivo para PATCH /api/admin/galeria/:id/estado.
 */
export class UpdateGaleriaEstadoDto {
  @ApiProperty({ example: true, description: 'true = visible en galería pública' })
  @Transform(parseBoolean)
  @IsBoolean()
  activo!: boolean;
}
