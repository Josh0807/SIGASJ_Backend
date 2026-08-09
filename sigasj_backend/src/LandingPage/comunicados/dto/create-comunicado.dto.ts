import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
} from 'class-validator';
import { EstadoComunicado } from '../enums/estado-comunicado.enum';
import { TipoComunicado } from '../enums/tipo-comunicado.enum';
import { FechaVencimientoGteInicioConstraint } from '../validators/fecha-vencimiento-gte-inicio.validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const emptyToNull = ({ value }: { value: unknown }) => {
  if (value === '' || value === undefined) {
    return null;
  }
  return typeof value === 'string' ? value.trim() : value;
};

/**
 * Payload administrativo para crear un comunicado.
 *
 * No declara (y el ValidationPipe admin rechaza con forbidNonWhitelisted):
 * idUsuarioCreador, idUsuarioModificador, fechaCreacion, fechaActualizacion,
 * usuarioCreador, usuarioModificador.
 */
export class CreateComunicadoDto {
  @ApiProperty({ maxLength: 200, example: 'Corte programado de agua' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo!: string;

  @ApiProperty({ maxLength: 500, example: 'Resumen breve del aviso' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descripcionBreve!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Detalle completo del comunicado',
  })
  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  contenido?: string | null;

  @ApiProperty({ enum: TipoComunicado, example: TipoComunicado.CORTE_DE_AGUA })
  @IsEnum(TipoComunicado)
  tipoComunicado!: TipoComunicado;

  @ApiProperty({ example: '2026-08-08' })
  @IsDateString()
  fechaPublicacion!: string;

  @ApiProperty({ example: '2026-08-08' })
  @IsDateString()
  fechaInicioVisibilidad!: string;

  @ApiPropertyOptional({ nullable: true, example: '2026-08-15' })
  @Transform(emptyToNull)
  @IsOptional()
  @IsDateString()
  @Validate(FechaVencimientoGteInicioConstraint)
  fechaVencimiento?: string | null;

  @ApiProperty({ enum: EstadoComunicado, example: EstadoComunicado.ACTIVO })
  @IsEnum(EstadoComunicado)
  estado!: EstadoComunicado;

  @ApiPropertyOptional({
    nullable: true,
    maxLength: 2048,
    example: 'https://ejemplo.com/imagen.jpg',
  })
  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imagenUrl?: string | null;
}
