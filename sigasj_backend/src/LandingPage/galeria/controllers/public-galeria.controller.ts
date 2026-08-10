import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GaleriaService } from '../galeria.service';
import type { PublicGaleriaResponse } from '../interfaces/public-galeria-response.interface';

/**
 * Endpoint público de galería.
 * Ruta final (con prefijo global `api`): GET /api/public/galeria
 *
 * Intencionalmente sin JwtAuthGuard / RolesGuard.
 */
@ApiTags('Galería pública')
@Controller('public/galeria')
export class PublicGaleriaController {
  constructor(private readonly galeriaService: GaleriaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar fotografías activas de la galería pública' })
  @ApiOkResponse({ description: 'Listado público de fotografías activas.' })
  async findAll(): Promise<PublicGaleriaResponse> {
    return this.galeriaService.findPublicFotografias();
  }
}
