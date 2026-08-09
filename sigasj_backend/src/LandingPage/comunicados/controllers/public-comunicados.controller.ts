import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ComunicadosService } from '../comunicados.service';
import { PublicComunicadosResponse } from '../interfaces/public-comunicados-response.interface';

/**
 * Endpoint público de comunicados.
 * Ruta final (con prefijo global `api`): GET /api/public/comunicados
 *
 * Intencionalmente sin JwtAuthGuard / RolesGuard (ni APP_GUARD en el módulo).
 * Los guards administrativos viven solo en AdminComunicadosController.
 */
@ApiTags('Comunicados públicos')
@Controller('public/comunicados')
export class PublicComunicadosController {
  constructor(private readonly comunicadosService: ComunicadosService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar comunicados visibles públicamente',
    description:
      'Devuelve comunicados activos dentro de la ventana de visibilidad.',
  })
  @ApiOkResponse({ type: PublicComunicadosResponse })
  async findAll(): Promise<PublicComunicadosResponse> {
    return this.comunicadosService.findPublicComunicados();
  }
}
