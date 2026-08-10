import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicTransparenciaResponse } from '../interfaces/public-transparencia-response.interface';
import { TransparenciaService } from '../transparencia.service';

/**
 * Endpoint público de transparencia.
 * Ruta final (con prefijo global `api`): GET /api/public/transparencia
 *
 * Intencionalmente sin JwtAuthGuard / RolesGuard.
 */
@ApiTags('Transparencia pública')
@Controller('public/transparencia')
export class PublicTransparenciaController {
  constructor(private readonly transparenciaService: TransparenciaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar publicaciones activas de transparencia para la Landing Page',
  })
  @ApiOkResponse({
    type: PublicTransparenciaResponse,
    description: 'Listado público de documentos e imágenes activos.',
  })
  async findAll(): Promise<PublicTransparenciaResponse> {
    return this.transparenciaService.findPublicPublicaciones();
  }
}
