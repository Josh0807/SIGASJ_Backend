import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PublicPublicacionTransparenciaDto } from './dto/public-publicacion-transparencia.dto';
import { PublicacionTransparencia } from './entities/publicacion-transparencia.entity';
import type { PublicTransparenciaResponse } from './interfaces/public-transparencia-response.interface';
import { toPublicPublicacionTransparenciaDto } from './mappers/public-publicacion-transparencia.mapper';

const PUBLIC_QUERY_ERROR_MESSAGE =
  'No fue posible consultar las publicaciones de transparencia en este momento.';

@Injectable()
export class TransparenciaService {
  private readonly logger = new Logger(TransparenciaService.name);

  constructor(
    @InjectRepository(PublicacionTransparencia)
    private readonly publicacionRepository: Repository<PublicacionTransparencia>,
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
}
