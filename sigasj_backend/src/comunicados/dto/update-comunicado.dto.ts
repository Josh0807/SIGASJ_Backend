import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateComunicadoDto } from './create-comunicado.dto';

/**
 * Payload administrativo para actualizar un comunicado.
 * No permite cambiar `estado` (usar PATCH .../estado).
 *
 * Campos de auditoría / usuarios NO forman parte del DTO; si llegan en el body
 * el ValidationPipe admin responde 400 (forbidNonWhitelisted).
 *
 * Hereda la regla fechaVencimiento >= fechaInicioVisibilidad cuando ambas
 * fechas vienen en el body. Si el PATCH envía solo una, validar en el servicio
 * contra el registro existente.
 */
export class UpdateComunicadoDto extends PartialType(
  OmitType(CreateComunicadoDto, ['estado'] as const),
) {}
