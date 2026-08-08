import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ComunicadosService } from '../comunicados.service';
import type { PublicComunicadosResponse } from '../interfaces/public-comunicados-response.interface';

/**
 * Endpoint público de comunicados.
 * Ruta final (con prefijo global `api`): GET /api/public/comunicados
 *
 * Sin autenticación: el proyecto aún no tiene AuthGuard global.
 * Errores inesperados: los gestiona el servicio (500) + capa HTTP de Nest.
 */
@Controller('public/comunicados')
export class PublicComunicadosController {
  constructor(private readonly comunicadosService: ComunicadosService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<PublicComunicadosResponse> {
    return this.comunicadosService.findPublicComunicados();
  }
}
