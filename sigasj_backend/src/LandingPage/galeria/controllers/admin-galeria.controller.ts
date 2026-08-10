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
  UsePipes,
  ValidationPipe,
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
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { RolUsuario } from '../../../auth/enums/rol-usuario.enum';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { GaleriaService } from '../galeria.service';
import { CreateGaleriaFotoDto } from '../dto/create-galeria-foto.dto';
import { QueryAdminGaleriaDto } from '../dto/query-admin-galeria.dto';
import { UpdateGaleriaFotoDto } from '../dto/update-galeria-foto.dto';
import { FotografiaGaleria } from '../entities/fotografia-galeria.entity';

const adminValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

/**
 * Administración de la galería pública.
 * Ruta final (prefijo global `api`): /api/admin/galeria
 */
@ApiTags('Galería administrativa')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Sin token, token inválido o token vencido.',
})
@ApiForbiddenResponse({
  description:
    'Autenticado pero sin rol permitido (p. ej. Fontanero, Abonado).',
})
@Controller('admin/galeria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMINISTRADORA, RolUsuario.SECRETARIA_EJECUTIVA)
@UsePipes(adminValidationPipe)
export class AdminGaleriaController {
  constructor(private readonly galeriaService: GaleriaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar fotografías de la galería (administración)',
    description:
      'Incluye activas e inactivas. Permite filtrar por estado y título.',
  })
  @ApiOkResponse({ type: FotografiaGaleria, isArray: true })
  async findAll(
    @Query() query: QueryAdminGaleriaDto,
  ): Promise<FotografiaGaleria[]> {
    return this.galeriaService.findAllAdmin(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener una fotografía por id (administración)' })
  @ApiOkResponse({ type: FotografiaGaleria })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FotografiaGaleria> {
    return this.galeriaService.findOneAdmin(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imagen'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagen', 'textoAlternativo'],
      properties: {
        imagen: { type: 'string', format: 'binary' },
        titulo: { type: 'string' },
        descripcion: { type: 'string' },
        textoAlternativo: { type: 'string' },
        ordenVisualizacion: { type: 'integer' },
        activo: { type: 'boolean' },
      },
    },
  })
  @ApiOperation({
    summary: 'Registrar una nueva fotografía',
    description:
      'Sube la imagen y guarda sus metadatos. El usuario creador se toma del JWT.',
  })
  @ApiCreatedResponse({ type: FotografiaGaleria })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateGaleriaFotoDto,
    @CurrentUser('idUsuario') idUsuarioAutenticado: number,
  ): Promise<FotografiaGaleria> {
    return this.galeriaService.createAdmin(
      dto,
      file,
      idUsuarioAutenticado,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar información de una fotografía',
    description: 'No reemplaza el archivo de imagen.',
  })
  @ApiOkResponse({ type: FotografiaGaleria })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGaleriaFotoDto,
  ): Promise<FotografiaGaleria> {
    return this.galeriaService.updateAdmin(id, dto);
  }

  @Patch(':id/imagen')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('imagen'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagen'],
      properties: {
        imagen: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Reemplazar el archivo de una fotografía' })
  @ApiOkResponse({ type: FotografiaGaleria })
  async replaceImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FotografiaGaleria> {
    return this.galeriaService.replaceImageAdmin(id, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una fotografía',
    description: 'Elimina el registro y su archivo asociado.',
  })
  @ApiNoContentResponse()
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.galeriaService.removeAdmin(id);
  }
}
