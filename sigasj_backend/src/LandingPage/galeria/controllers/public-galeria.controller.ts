import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { GaleriaService } from '../galeria.service';
import type { PublicGaleriaResponse } from '../interfaces/public-galeria-response.interface';

/**
 * Endpoint público de galería.
 * Ruta final (con prefijo global `api`): GET /api/public/galeria
 *
 * Sin autenticación: el proyecto aún no tiene AuthGuard global.
 */
@Controller('public/galeria')
export class PublicGaleriaController {
  constructor(private readonly galeriaService: GaleriaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<PublicGaleriaResponse> {
    return this.galeriaService.findPublicFotografias();
  }
}
