import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolUsuario } from '../../auth/enums/rol-usuario.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ComunicadosService } from '../services/comunicados.service';
import { CreateComunicadoDto } from '../dto/create-comunicado.dto';
import { UpdateComunicadoDto } from '../dto/update-comunicado.dto';
import { UpdateEstadoComunicadoDto } from '../dto/update-estado-comunicado.dto';
import { Comunicado } from '../entities/comunicado.entity';

/**
 * Administración de comunicados.
 * Ruta final (prefijo global `api`): /api/admin/comunicados
 *
 * Acceso: Administradora | Secretaria Ejecutiva (JWT + RolesGuard).
 * Auditoría (creador/modificador) solo desde `@CurrentUser` / JWT.
 */
@ApiTags('Comunicados administrativos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Sin token, token inválido o token vencido.',
})
@ApiForbiddenResponse({
  description:
    'Autenticado pero sin rol permitido (p. ej. Fontanero, Abonado).',
})
@Controller('admin/comunicados')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMINISTRADORA, RolUsuario.SECRETARIA_EJECUTIVA)
export class AdminComunicadosController {
  constructor(private readonly comunicadosService: ComunicadosService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar todos los comunicados (administración)',
    description:
      'Incluye activos, inactivos, vigentes, vencidos y programados. Sin filtros del endpoint público.',
  })
  @ApiOkResponse({ type: Comunicado, isArray: true })
  async findAll(): Promise<Comunicado[]> {
    return this.comunicadosService.findAllAdmin();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un comunicado por id (administración)' })
  @ApiOkResponse({ type: Comunicado })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Comunicado> {
    return this.comunicadosService.findOneAdmin(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear comunicado',
    description:
      'idUsuarioCreador y fechaCreacion los fija el Back-end (JWT + @CreateDateColumn).',
  })
  @ApiCreatedResponse({ type: Comunicado })
  async create(
    @Body() dto: CreateComunicadoDto,
    @CurrentUser('idUsuario') idUsuarioAutenticado: number,
  ): Promise<Comunicado> {
    return this.comunicadosService.createAdmin(dto, idUsuarioAutenticado);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar campos editables de un comunicado',
    description:
      'No permite cambiar el estado. idUsuarioModificador y fechaActualizacion los fija el Back-end.',
  })
  @ApiOkResponse({ type: Comunicado })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComunicadoDto,
    @CurrentUser('idUsuario') idUsuarioAutenticado: number,
  ): Promise<Comunicado> {
    return this.comunicadosService.updateAdmin(id, dto, idUsuarioAutenticado);
  }

  @Patch(':id/estado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar únicamente el estado de un comunicado',
    description:
      'Registra idUsuarioModificador desde el JWT; fechaActualizacion vía @UpdateDateColumn.',
  })
  @ApiOkResponse({ type: Comunicado })
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoComunicadoDto,
    @CurrentUser('idUsuario') idUsuarioAutenticado: number,
  ): Promise<Comunicado> {
    return this.comunicadosService.updateEstadoAdmin(
      id,
      dto,
      idUsuarioAutenticado,
    );
  }
}
