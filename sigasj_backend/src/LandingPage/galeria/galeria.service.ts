import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PublicGaleriaFotoDto } from './dto/public-galeria-foto.dto';
import { FotografiaGaleria } from './entities/fotografia-galeria.entity';
import type { PublicGaleriaResponse } from './interfaces/public-galeria-response.interface';
import { toPublicGaleriaFotoDto } from './mappers/public-galeria-foto.mapper';

const PUBLIC_QUERY_ERROR_MESSAGE =
  'No fue posible consultar la galería en este momento.';

@Injectable()
export class GaleriaService {
  private readonly logger = new Logger(GaleriaService.name);

  constructor(
    @InjectRepository(FotografiaGaleria)
    private readonly fotografiaRepository: Repository<FotografiaGaleria>,
  ) {}

  /**
   * Listado público de fotografías activas ordenadas para la Landing Page.
   *
   * Éxito sin filas → `{ data: [], total: 0 }` (200).
   * Fallo de consulta → 500 controlado (no se disfraza como lista vacía).
   */
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

  /**
   * Consulta solo fotografías activas, ordenadas por posición configurada.
   * No carga relaciones ni columnas administrativas innecesarias.
   */
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
}
