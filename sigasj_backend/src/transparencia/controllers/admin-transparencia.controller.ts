import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
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
import { CreatePublicacionTransparenciaDto } from '../dto/create-publicacion-transparencia.dto';
import { QueryAdminTransparenciaDto } from '../dto/query-admin-transparencia.dto';
import { ReorderTransparenciaDto } from '../dto/reorder-transparencia.dto';
import { UpdatePublicacionTransparenciaDto } from '../dto/update-publicacion-transparencia.dto';
import { UpdateTransparenciaEstadoDto } from '../dto/update-transparencia-estado.dto';
import { PublicacionTransparencia } from '../entities/publicacion-transparencia.entity';
import { TransparenciaService } from '../services/transparencia.service';

/**
 * Administración de publicaciones de transparencia.
 * Ruta final (prefijo global `api`): /api/admin/transparencia
 */
@ApiTags('Transparencia administrativa')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Sin token, token inválido o token vencido.',
})
@ApiForbiddenResponse({
  description:
    'Autenticado pero sin rol permitido (p. ej. Fontanero, Abonado).',
})
@Controller('admin/transparencia')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMINISTRADORA, RolUsuario.SECRETARIA_EJECUTIVA)
export class AdminTransparenciaController {
  constructor(private readonly transparenciaService: TransparenciaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar publicaciones de transparencia (administración)',
    description:
      'Incluye activas e inactivas. Permite filtrar por estado y nombre.',
  })
  @ApiOkResponse({ type: PublicacionTransparencia, isArray: true })
  async findAll(
    @Query() query: QueryAdminTransparenciaDto,
  ): Promise<PublicacionTransparencia[]> {
    return this.transparenciaService.findAllAdmin(query);
  }

  @Patch('orden')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reorganizar el orden de las publicaciones',
    description:
      'Recibe identificadores y posiciones. Valida duplicados y aplica el cambio en una transacción.',
  })
  @ApiOkResponse({ type: PublicacionTransparencia, isArray: true })
  async reorder(
    @Body() dto: ReorderTransparenciaDto,
  ): Promise<PublicacionTransparencia[]> {
    return this.transparenciaService.reorderAdmin(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener una publicación por id (administración)' })
  @ApiOkResponse({ type: PublicacionTransparencia })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PublicacionTransparencia> {
    return this.transparenciaService.findOneAdmin(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['archivo', 'nombre', 'descripcionBreve'],
      properties: {
        archivo: { type: 'string', format: 'binary' },
        nombre: { type: 'string' },
        descripcionBreve: { type: 'string' },
        ordenVisualizacion: { type: 'integer' },
        activo: { type: 'boolean' },
      },
    },
  })
  @ApiOperation({
    summary: 'Registrar una nueva publicación',
    description:
      'Sube el archivo y guarda sus metadatos. El usuario creador se toma del JWT.',
  })
  @ApiCreatedResponse({ type: PublicacionTransparencia })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreatePublicacionTransparenciaDto,
    @CurrentUser('idUsuario') idUsuarioAutenticado: number,
  ): Promise<PublicacionTransparencia> {
    return this.transparenciaService.createAdmin(
      dto,
      file,
      idUsuarioAutenticado,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar nombre y descripción de una publicación',
    description: 'No reemplaza el archivo asociado.',
  })
  @ApiOkResponse({ type: PublicacionTransparencia })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePublicacionTransparenciaDto,
  ): Promise<PublicacionTransparencia> {
    return this.transparenciaService.updateAdmin(id, dto);
  }

  @Patch(':id/estado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar o desactivar una publicación',
    description:
      'Las publicaciones inactivas no aparecen en la sección pública.',
  })
  @ApiOkResponse({ type: PublicacionTransparencia })
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransparenciaEstadoDto,
  ): Promise<PublicacionTransparencia> {
    return this.transparenciaService.updateEstadoAdmin(id, dto);
  }

  @Patch(':id/archivo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['archivo'],
      properties: {
        archivo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Reemplazar el archivo de una publicación' })
  @ApiOkResponse({ type: PublicacionTransparencia })
  async replaceFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PublicacionTransparencia> {
    return this.transparenciaService.replaceFileAdmin(id, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una publicación',
    description: 'Elimina el registro y su archivo asociado.',
  })
  @ApiNoContentResponse()
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.transparenciaService.removeAdmin(id);
  }
}
