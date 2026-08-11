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
 * Payload exclusivo para PATCH /api/admin/transparencia/:id/estado.
 */
export class UpdateTransparenciaEstadoDto {
  @ApiProperty({
    example: true,
    description: 'true = visible en la sección pública de transparencia',
  })
  @Transform(parseBoolean)
  @IsBoolean()
  activo!: boolean;
}
