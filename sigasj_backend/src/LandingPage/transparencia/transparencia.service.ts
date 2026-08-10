import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import type { CreatePublicacionTransparenciaDto } from './dto/create-publicacion-transparencia.dto';
import type { PublicPublicacionTransparenciaDto } from './dto/public-publicacion-transparencia.dto';
import type { QueryAdminTransparenciaDto } from './dto/query-admin-transparencia.dto';
import type { UpdatePublicacionTransparenciaDto } from './dto/update-publicacion-transparencia.dto';
import { PublicacionTransparencia } from './entities/publicacion-transparencia.entity';
import type { PublicTransparenciaResponse } from './interfaces/public-transparencia-response.interface';
import { toPublicPublicacionTransparenciaDto } from './mappers/public-publicacion-transparencia.mapper';
import { TransparenciaFileUploadService } from './services/transparencia-file-upload.service';

const PUBLIC_QUERY_ERROR_MESSAGE =
  'No fue posible consultar las publicaciones de transparencia en este momento.';

const ADMIN_QUERY_ERROR_MESSAGE =
  'No fue posible procesar la operación de transparencia en este momento.';

@Injectable()
export class TransparenciaService {
  private readonly logger = new Logger(TransparenciaService.name);

  constructor(
    @InjectRepository(PublicacionTransparencia)
    private readonly publicacionRepository: Repository<PublicacionTransparencia>,
    private readonly transparenciaFileUploadService: TransparenciaFileUploadService,
  ) {}

  async findPublicPublicaciones(): Promise<PublicTransparenciaResponse> {
    try {
      const rows = await this.loadActivePublicRows();
      const data = rows
        .map((row) => toPublicPublicacionTransparenciaDto(row))
        .filter(
          (item): item is PublicPublicacionTransparenciaDto => item !== null,
        );

      return {
        data,
        total: data.length,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        'Error inesperado al consultar transparencia pública',
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(PUBLIC_QUERY_ERROR_MESSAGE);
    }
  }

  async findAllAdmin(
    query: QueryAdminTransparenciaDto,
  ): Promise<PublicacionTransparencia[]> {
    try {
      const where = this.buildAdminWhere(query);

      return await this.publicacionRepository.find({
        where,
        order: {
          ordenVisualizacion: 'ASC',
          idPublicacionTransparencia: 'ASC',
        },
      });
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al listar publicaciones administrativas',
      );
    }
  }

  async findOneAdmin(
    idPublicacionTransparencia: number,
  ): Promise<PublicacionTransparencia> {
    try {
      const publicacion = await this.publicacionRepository.findOne({
        where: { idPublicacionTransparencia },
      });

      if (!publicacion) {
        throw new NotFoundException(
          `No se encontró la publicación con id ${idPublicacionTransparencia}.`,
        );
      }

      return publicacion;
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al consultar una publicación administrativa',
      );
    }
  }

  async createAdmin(
    dto: CreatePublicacionTransparenciaDto,
    file: Express.Multer.File | undefined,
    idUsuarioAutenticado: number,
  ): Promise<PublicacionTransparencia> {
    if (!file) {
      throw new BadRequestException('Debe enviar un archivo.');
    }

    const idUsuarioCreador =
      this.requireAuthenticatedUserId(idUsuarioAutenticado);
    let uploadedArchivoUrl: string | null = null;

    try {
      const uploaded = await this.transparenciaFileUploadService.saveFile(file);
      uploadedArchivoUrl = uploaded.archivoUrl;

      const publicacion = this.publicacionRepository.create({
        nombre: dto.nombre,
        descripcionBreve: dto.descripcionBreve,
        archivoUrl: uploaded.archivoUrl,
        tipoArchivo: uploaded.tipoArchivo,
        ordenVisualizacion: dto.ordenVisualizacion ?? 0,
        activo: dto.activo ?? true,
        usuarioCreador: { idUsuario: idUsuarioCreador },
      });

      return await this.publicacionRepository.save(publicacion);
    } catch (error) {
      if (uploadedArchivoUrl) {
        await this.transparenciaFileUploadService.deleteFile(uploadedArchivoUrl);
      }

      this.rethrowAdminError(error, 'Error inesperado al registrar una publicación');
    }
  }

  async updateAdmin(
    idPublicacionTransparencia: number,
    dto: UpdatePublicacionTransparenciaDto,
  ): Promise<PublicacionTransparencia> {
    try {
      const publicacion = await this.findOneAdmin(idPublicacionTransparencia);

      if (dto.nombre !== undefined) {
        publicacion.nombre = dto.nombre;
      }
      if (dto.descripcionBreve !== undefined) {
        publicacion.descripcionBreve = dto.descripcionBreve;
      }

      return await this.publicacionRepository.save(publicacion);
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al actualizar una publicación',
      );
    }
  }

  async replaceFileAdmin(
    idPublicacionTransparencia: number,
    file: Express.Multer.File | undefined,
  ): Promise<PublicacionTransparencia> {
    if (!file) {
      throw new BadRequestException('Debe enviar un archivo.');
    }

    const publicacion = await this.findOneAdmin(idPublicacionTransparencia);
    const previousArchivoUrl = publicacion.archivoUrl;
    let uploadedArchivoUrl: string | null = null;

    try {
      const uploaded =
        await this.transparenciaFileUploadService.replaceFile(
          previousArchivoUrl,
          file,
        );
      uploadedArchivoUrl = uploaded.archivoUrl;
      publicacion.archivoUrl = uploaded.archivoUrl;
      publicacion.tipoArchivo = uploaded.tipoArchivo;

      return await this.publicacionRepository.save(publicacion);
    } catch (error) {
      if (uploadedArchivoUrl) {
        await this.transparenciaFileUploadService.deleteFile(uploadedArchivoUrl);
      }

      this.rethrowAdminError(
        error,
        'Error inesperado al reemplazar el archivo de una publicación',
      );
    }
  }

  async removeAdmin(idPublicacionTransparencia: number): Promise<void> {
    try {
      const publicacion = await this.findOneAdmin(idPublicacionTransparencia);
      await this.publicacionRepository.remove(publicacion);
      await this.transparenciaFileUploadService.deleteFile(
        publicacion.archivoUrl,
      );
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al eliminar una publicación',
      );
    }
  }

  private buildAdminWhere(
    query: QueryAdminTransparenciaDto,
  ): FindOptionsWhere<PublicacionTransparencia> {
    const where: FindOptionsWhere<PublicacionTransparencia> = {};

    if (query.activo !== undefined) {
      where.activo = query.activo;
    }

    if (query.nombre) {
      where.nombre = Like(`%${query.nombre}%`);
    }

    return where;
  }

  private loadActivePublicRows(): Promise<PublicacionTransparencia[]> {
    return this.publicacionRepository.find({
      where: { activo: true },
      order: {
        ordenVisualizacion: 'ASC',
        idPublicacionTransparencia: 'ASC',
      },
      select: {
        idPublicacionTransparencia: true,
        nombre: true,
        descripcionBreve: true,
        archivoUrl: true,
        tipoArchivo: true,
      },
    });
  }

  private requireAuthenticatedUserId(idUsuario: number): number {
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      throw new UnauthorizedException('Usuario autenticado inválido.');
    }
    return idUsuario;
  }

  private rethrowAdminError(error: unknown, logMessage: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    this.logger.error(
      logMessage,
      error instanceof Error ? error.stack : undefined,
    );

    throw new InternalServerErrorException(ADMIN_QUERY_ERROR_MESSAGE);
  }
}
