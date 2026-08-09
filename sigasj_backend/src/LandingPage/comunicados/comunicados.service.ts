import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { PublicComunicadoDto } from './dto/public-comunicado.dto';
import type { PublicComunicadosResponse } from './interfaces/public-comunicados-response.interface';
import { toPublicComunicadoDto } from './mappers/public-comunicado.mapper';

const PUBLIC_QUERY_ERROR_MESSAGE =
  'No fue posible consultar los comunicados en este momento.';

@Injectable()
export class ComunicadosService {
  private readonly logger = new Logger(ComunicadosService.name);

  /**
   * Listado público de comunicados visibles.
   *
   * Éxito sin filas → `{ data: [], total: 0 }` (200).
   * Fallo de consulta → 500 controlado (no se disfraza como lista vacía).
   *
   * Persistencia: la entidad `Comunicado` / TypeORM aún no existen en este
   * repo. Cuando existan, `loadVisiblePublicRows` debe filtrar en BD según
   * `constants/public-comunicados-date-rules.ts` y proyectar con
   * `toPublicComunicadoDto` (sin creador ni auditoría).
   */
  async findPublicComunicados(): Promise<PublicComunicadosResponse> {
    try {
      const rows = await this.loadVisiblePublicRows();
      const data = rows
        .map((row) => toPublicComunicadoDto(row))
        .filter((item): item is PublicComunicadoDto => item !== null);

      return {
        data,
        total: data.length,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        'Error inesperado al consultar comunicados públicos',
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(PUBLIC_QUERY_ERROR_MESSAGE);
    }
  }

  /**
   * Origen de filas ya filtradas por visibilidad (activo + vigencia).
   * Sin entidad/TypeORM: colección vacía válida.
   *
   * Reglas a aplicar en QueryBuilder cuando exista el repositorio:
   * - activo (campo real de la entidad)
   * - inicioVisibilidad <= ahora
   * - vencimiento >= ahora OR IS NULL  (especificación: `>=`, no `>`)
   * - ORDER BY fechaPublicacion DESC, fechaCreacion DESC
   * - SELECT solo columnas públicas
   * - Sin offsets de zona horaria hardcodeados
   */
  private loadVisiblePublicRows(): Promise<unknown[]> {
    return Promise.resolve([]);
  }
}
