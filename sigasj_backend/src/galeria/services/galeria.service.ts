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
import { FindOptionsWhere, In, Like, Repository } from 'typeorm';
import type { CreateGaleriaFotoDto } from '../dto/create-galeria-foto.dto';
import type { PublicGaleriaFotoDto } from '../dto/public-galeria-foto.dto';
import type { QueryAdminGaleriaDto } from '../dto/query-admin-galeria.dto';
import type { ReorderGaleriaDto } from '../dto/reorder-galeria.dto';
import type { UpdateGaleriaEstadoDto } from '../dto/update-galeria-estado.dto';
import type { UpdateGaleriaFotoDto } from '../dto/update-galeria-foto.dto';
import { FotografiaGaleria } from '../entities/fotografia-galeria.entity';
import type { PublicGaleriaResponse } from '../interfaces/public-galeria-response.interface';
import { toPublicGaleriaFotoDto } from '../mappers/public-galeria-foto.mapper';
import { GaleriaImageUploadService } from './galeria-image-upload.service';

const PUBLIC_QUERY_ERROR_MESSAGE =
  'No fue posible consultar la galería en este momento.';

const ADMIN_QUERY_ERROR_MESSAGE =
  'No fue posible procesar la operación de galería en este momento.';

@Injectable()
export class GaleriaService {
  private readonly logger = new Logger(GaleriaService.name);

  constructor(
    @InjectRepository(FotografiaGaleria)
    private readonly fotografiaRepository: Repository<FotografiaGaleria>,
    private readonly galeriaImageUploadService: GaleriaImageUploadService,
  ) {}

  async findPublicFotografias(): Promise<PublicGaleriaResponse> {
    try {
      const rows = await this.loadActivePublicRows();
      const data = rows
        .map((row) => toPublicGaleriaFotoDto(row))
        .filter((item): item is PublicGaleriaFotoDto => item !== null);

      return {
        data,
        total: data.length,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        'Error inesperado al consultar la galería pública',
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(PUBLIC_QUERY_ERROR_MESSAGE);
    }
  }

  async findAllAdmin(query: QueryAdminGaleriaDto): Promise<FotografiaGaleria[]> {
    try {
      const where = this.buildAdminWhere(query);

      return await this.fotografiaRepository.find({
        where,
        order: {
          ordenVisualizacion: 'ASC',
          idFotografiaGaleria: 'ASC',
        },
      });
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al listar fotografías administrativas',
      );
    }
  }

  async findOneAdmin(idFotografiaGaleria: number): Promise<FotografiaGaleria> {
    try {
      const fotografia = await this.fotografiaRepository.findOne({
        where: { idFotografiaGaleria },
      });

      if (!fotografia) {
        throw new NotFoundException(
          `No se encontró la fotografía con id ${idFotografiaGaleria}.`,
        );
      }

      return fotografia;
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al consultar una fotografía administrativa',
      );
    }
  }

  async createAdmin(
    dto: CreateGaleriaFotoDto,
    file: Express.Multer.File | undefined,
    idUsuarioAutenticado: number,
  ): Promise<FotografiaGaleria> {
    if (!file) {
      throw new BadRequestException('Debe enviar un archivo de imagen.');
    }

    const idUsuarioCreador =
      this.requireAuthenticatedUserId(idUsuarioAutenticado);
    let uploadedImageUrl: string | null = null;

    try {
      const uploaded = await this.galeriaImageUploadService.saveImage(file);
      uploadedImageUrl = uploaded.imagenUrl;

      const fotografia = this.fotografiaRepository.create({
        titulo: dto.titulo ?? null,
        descripcion: dto.descripcion ?? null,
        imagenUrl: uploaded.imagenUrl,
        textoAlternativo: dto.textoAlternativo,
        ordenVisualizacion: dto.ordenVisualizacion ?? 0,
        activo: dto.activo ?? true,
        usuarioCreador: { idUsuario: idUsuarioCreador },
      });

      return await this.fotografiaRepository.save(fotografia);
    } catch (error) {
      if (uploadedImageUrl) {
        await this.galeriaImageUploadService.deleteImage(uploadedImageUrl);
      }

      this.rethrowAdminError(error, 'Error inesperado al registrar una fotografía');
    }
  }

  async updateAdmin(
    idFotografiaGaleria: number,
    dto: UpdateGaleriaFotoDto,
  ): Promise<FotografiaGaleria> {
    try {
      const fotografia = await this.findOneAdmin(idFotografiaGaleria);

      if (dto.titulo !== undefined) {
        fotografia.titulo = dto.titulo;
      }
      if (dto.descripcion !== undefined) {
        fotografia.descripcion = dto.descripcion;
      }
      if (dto.textoAlternativo !== undefined) {
        fotografia.textoAlternativo = dto.textoAlternativo;
      }
      if (dto.ordenVisualizacion !== undefined) {
        fotografia.ordenVisualizacion = dto.ordenVisualizacion;
      }
      if (dto.activo !== undefined) {
        fotografia.activo = dto.activo;
      }

      return await this.fotografiaRepository.save(fotografia);
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al actualizar una fotografía',
      );
    }
  }

  async replaceImageAdmin(
    idFotografiaGaleria: number,
    file: Express.Multer.File | undefined,
  ): Promise<FotografiaGaleria> {
    if (!file) {
      throw new BadRequestException('Debe enviar un archivo de imagen.');
    }

    const fotografia = await this.findOneAdmin(idFotografiaGaleria);
    const previousImageUrl = fotografia.imagenUrl;
    let uploadedImageUrl: string | null = null;

    try {
      const uploaded = await this.galeriaImageUploadService.saveImage(file);
      uploadedImageUrl = uploaded.imagenUrl;
      fotografia.imagenUrl = uploaded.imagenUrl;

      const saved = await this.fotografiaRepository.save(fotografia);
      await this.galeriaImageUploadService.deleteImage(previousImageUrl);

      return saved;
    } catch (error) {
      if (uploadedImageUrl) {
        await this.galeriaImageUploadService.deleteImage(uploadedImageUrl);
      }

      this.rethrowAdminError(
        error,
        'Error inesperado al reemplazar la imagen de una fotografía',
      );
    }
  }

  async removeAdmin(idFotografiaGaleria: number): Promise<void> {
    try {
      const fotografia = await this.findOneAdmin(idFotografiaGaleria);
      await this.fotografiaRepository.remove(fotografia);
      await this.galeriaImageUploadService.deleteImage(fotografia.imagenUrl);
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al eliminar una fotografía',
      );
    }
  }

  async updateEstadoAdmin(
    idFotografiaGaleria: number,
    dto: UpdateGaleriaEstadoDto,
  ): Promise<FotografiaGaleria> {
    try {
      const fotografia = await this.findOneAdmin(idFotografiaGaleria);
      fotografia.activo = dto.activo;
      return await this.fotografiaRepository.save(fotografia);
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al actualizar el estado de una fotografía',
      );
    }
  }

  async reorderAdmin(dto: ReorderGaleriaDto): Promise<FotografiaGaleria[]> {
    this.assertReorderPayloadIsValid(dto);

    try {
      return await this.fotografiaRepository.manager.transaction(
        async (manager) => {
          const repository = manager.getRepository(FotografiaGaleria);
          const ids = dto.fotografias.map(
            (item) => item.idFotografiaGaleria,
          );
          const rows = await repository.findBy({
            idFotografiaGaleria: In(ids),
          });

          if (rows.length !== ids.length) {
            throw new NotFoundException(
              'Una o más fotografías indicadas no existen.',
            );
          }

          const rowsById = new Map(
            rows.map((row) => [row.idFotografiaGaleria, row]),
          );
          const updatedRows = dto.fotografias.map((item) => {
            const row = rowsById.get(item.idFotografiaGaleria)!;
            row.ordenVisualizacion = item.ordenVisualizacion;
            return row;
          });

          const saved = await repository.save(updatedRows);

          return saved.sort((a, b) => {
            if (a.ordenVisualizacion !== b.ordenVisualizacion) {
              return a.ordenVisualizacion - b.ordenVisualizacion;
            }
            return a.idFotografiaGaleria - b.idFotografiaGaleria;
          });
        },
      );
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al reorganizar la galería',
      );
    }
  }

  private assertReorderPayloadIsValid(dto: ReorderGaleriaDto): void {
    const ids = dto.fotografias.map((item) => item.idFotografiaGaleria);
    const positions = dto.fotografias.map((item) => item.ordenVisualizacion);

    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'No se permiten identificadores repetidos en la reorganización.',
      );
    }

    if (new Set(positions).size !== positions.length) {
      throw new BadRequestException(
        'No se permiten posiciones repetidas en la reorganización.',
      );
    }
  }

  private buildAdminWhere(
    query: QueryAdminGaleriaDto,
  ): FindOptionsWhere<FotografiaGaleria> {
    const where: FindOptionsWhere<FotografiaGaleria> = {};

    if (query.activo !== undefined) {
      where.activo = query.activo;
    }

    if (query.titulo) {
      where.titulo = Like(`%${query.titulo}%`);
    }

    return where;
  }

  private loadActivePublicRows(): Promise<FotografiaGaleria[]> {
    return this.fotografiaRepository.find({
      where: { activo: true },
      order: {
        ordenVisualizacion: 'ASC',
        idFotografiaGaleria: 'ASC',
      },
      select: {
        idFotografiaGaleria: true,
        titulo: true,
        descripcion: true,
        imagenUrl: true,
        textoAlternativo: true,
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
