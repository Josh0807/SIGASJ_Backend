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
import { Repository } from 'typeorm';
import type { CreateComunicadoDto } from '../dto/create-comunicado.dto';
import type { PublicComunicadoDto } from '../dto/public-comunicado.dto';
import type { UpdateComunicadoDto } from '../dto/update-comunicado.dto';
import type { UpdateEstadoComunicadoDto } from '../dto/update-estado-comunicado.dto';
import { Comunicado } from '../entities/comunicado.entity';
import { EstadoComunicado } from '../enums/estado-comunicado.enum';
import type { PublicComunicadosResponse } from '../interfaces/public-comunicados-response.interface';
import { toPublicComunicadoDto } from '../mappers/public-comunicado.mapper';
import {
  comparePublicComunicadoOrder,
  isPubliclyVisible,
} from '../utils/public-comunicados-visibility';
import {
  isFechaVencimientoGteInicio,
  parseDateOnly,
} from '../validators/fecha-vencimiento-gte-inicio.validator';

const PUBLIC_QUERY_ERROR_MESSAGE =
  'No fue posible consultar los comunicados en este momento.';

const ADMIN_QUERY_ERROR_MESSAGE =
  'No fue posible procesar la operación de comunicados en este momento.';

const FECHA_VENCIMIENTO_INVALIDA =
  'fechaVencimiento debe ser mayor o igual que fechaInicioVisibilidad';

const FECHA_INVALIDA = 'Una o más fechas del comunicado no son válidas.';

@Injectable()
export class ComunicadosService {
  private readonly logger = new Logger(ComunicadosService.name);

  constructor(
    @InjectRepository(Comunicado)
    private readonly comunicadoRepository: Repository<Comunicado>,
  ) {}

  /**
   * Listado público de comunicados visibles.
   *
   * Éxito sin filas → `{ data: [], total: 0 }` (200).
   * Fallo de consulta → 500 controlado (no se disfraza como lista vacía).
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
   * Listado administrativo completo (activos, inactivos, vigentes,
   * vencidos y programados). Sin filtros del endpoint público.
   */
  async findAllAdmin(): Promise<Comunicado[]> {
    try {
      return await this.comunicadoRepository.find({
        order: {
          fechaCreacion: 'DESC',
          fechaPublicacion: 'DESC',
        },
      });
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al listar comunicados administrativos',
      );
    }
  }

  /**
   * Obtiene un comunicado por id o lanza 404.
   */
  async findOneAdmin(idComunicado: number): Promise<Comunicado> {
    try {
      const comunicado = await this.comunicadoRepository.findOne({
        where: { idComunicado },
      });

      if (!comunicado) {
        throw new NotFoundException(
          `No se encontró el comunicado con id ${idComunicado}.`,
        );
      }

      return comunicado;
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al consultar un comunicado administrativo',
      );
    }
  }

  /**
   * Crea un comunicado asociando el usuario autenticado como creador (FK escalar).
   * `fechaCreacion` la genera TypeORM (`@CreateDateColumn`).
   * No lee idUsuarioCreador / fechas de auditoría desde el DTO.
   */
  async createAdmin(
    dto: CreateComunicadoDto,
    idUsuarioAutenticado: number,
  ): Promise<Comunicado> {
    try {
      const idUsuarioCreador =
        this.requireAuthenticatedUserId(idUsuarioAutenticado);

      this.assertFechasVisibilidad(
        dto.fechaInicioVisibilidad,
        dto.fechaVencimiento,
      );

      const fechaPublicacion = this.requireDateOnly(dto.fechaPublicacion);
      const fechaInicioVisibilidad = this.requireDateOnly(
        dto.fechaInicioVisibilidad,
      );
      const fechaVencimiento = this.optionalDateOnly(dto.fechaVencimiento);

      // Mapeo explícito: no hacer spread del DTO (evita campos de auditoría).
      const comunicado = this.comunicadoRepository.create({
        titulo: dto.titulo,
        descripcionBreve: dto.descripcionBreve,
        contenido: dto.contenido ?? null,
        tipoComunicado: dto.tipoComunicado,
        fechaPublicacion,
        fechaInicioVisibilidad,
        fechaVencimiento,
        estado: dto.estado,
        imagenUrl: dto.imagenUrl ?? null,
        idUsuarioCreador,
        idUsuarioModificador: null,
      });

      return await this.comunicadoRepository.save(comunicado);
    } catch (error) {
      this.rethrowAdminError(error, 'Error inesperado al crear un comunicado');
    }
  }

  /**
   * Actualiza campos editables. No modifica `estado` ni `idUsuarioCreador`.
   * `fechaActualizacion` la actualiza TypeORM (`@UpdateDateColumn`) al guardar.
   */
  async updateAdmin(
    idComunicado: number,
    dto: UpdateComunicadoDto,
    idUsuarioAutenticado: number,
  ): Promise<Comunicado> {
    try {
      const idUsuarioModificador =
        this.requireAuthenticatedUserId(idUsuarioAutenticado);
      const comunicado = await this.findOneAdmin(idComunicado);

      const nextInicio =
        dto.fechaInicioVisibilidad !== undefined
          ? dto.fechaInicioVisibilidad
          : comunicado.fechaInicioVisibilidad;
      const nextVencimiento =
        dto.fechaVencimiento !== undefined
          ? dto.fechaVencimiento
          : comunicado.fechaVencimiento;

      this.assertFechasVisibilidad(nextInicio, nextVencimiento);

      if (dto.titulo !== undefined) {
        comunicado.titulo = dto.titulo;
      }
      if (dto.descripcionBreve !== undefined) {
        comunicado.descripcionBreve = dto.descripcionBreve;
      }
      if (dto.contenido !== undefined) {
        comunicado.contenido = dto.contenido;
      }
      if (dto.tipoComunicado !== undefined) {
        comunicado.tipoComunicado = dto.tipoComunicado;
      }
      if (dto.fechaPublicacion !== undefined) {
        comunicado.fechaPublicacion = this.requireDateOnly(
          dto.fechaPublicacion,
        );
      }
      if (dto.fechaInicioVisibilidad !== undefined) {
        comunicado.fechaInicioVisibilidad = this.requireDateOnly(
          dto.fechaInicioVisibilidad,
        );
      }
      if (dto.fechaVencimiento !== undefined) {
        comunicado.fechaVencimiento = this.optionalDateOnly(
          dto.fechaVencimiento,
        );
      }
      if (dto.imagenUrl !== undefined) {
        comunicado.imagenUrl = dto.imagenUrl;
      }

      comunicado.idUsuarioModificador = idUsuarioModificador;

      return await this.comunicadoRepository.save(comunicado);
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al actualizar un comunicado',
      );
    }
  }

  /**
   * Cambia únicamente el estado (desactivar ≠ eliminar).
   * Registra modificador; `fechaActualizacion` vía `@UpdateDateColumn`.
   */
  async updateEstadoAdmin(
    idComunicado: number,
    dto: UpdateEstadoComunicadoDto,
    idUsuarioAutenticado: number,
  ): Promise<Comunicado> {
    try {
      const idUsuarioModificador =
        this.requireAuthenticatedUserId(idUsuarioAutenticado);
      const comunicado = await this.findOneAdmin(idComunicado);
      comunicado.estado = dto.estado;
      comunicado.idUsuarioModificador = idUsuarioModificador;
      return await this.comunicadoRepository.save(comunicado);
    } catch (error) {
      this.rethrowAdminError(
        error,
        'Error inesperado al actualizar el estado de un comunicado',
      );
    }
  }

  /**
   * Origen de filas públicas: estado Activo + ventana de vigencia.
   * Filtra en memoria con las reglas de `public-comunicados-visibility`
   * (compatible con columnas `date` y con repositorio mockeado en tests).
   */
  private async loadVisiblePublicRows(): Promise<Comunicado[]> {
    const rows = await this.comunicadoRepository.find({
      where: { estado: EstadoComunicado.ACTIVO },
    });

    const now = new Date();
    return rows
      .filter((row) =>
        isPubliclyVisible(
          {
            activo: row.estado === EstadoComunicado.ACTIVO,
            fechaInicioVisibilidad: row.fechaInicioVisibilidad,
            fechaVencimiento: row.fechaVencimiento,
            fechaPublicacion: row.fechaPublicacion,
            fechaCreacion: row.fechaCreacion,
          },
          now,
        ),
      )
      .sort(comparePublicComunicadoOrder);
  }

  private assertFechasVisibilidad(
    fechaInicioVisibilidad: string | Date | null | undefined,
    fechaVencimiento: string | Date | null | undefined,
  ): void {
    if (
      fechaInicioVisibilidad != null &&
      fechaInicioVisibilidad !== '' &&
      !parseDateOnly(fechaInicioVisibilidad)
    ) {
      throw new BadRequestException(FECHA_INVALIDA);
    }

    if (
      fechaVencimiento != null &&
      fechaVencimiento !== '' &&
      !parseDateOnly(fechaVencimiento)
    ) {
      throw new BadRequestException(FECHA_INVALIDA);
    }

    if (
      !isFechaVencimientoGteInicio(fechaInicioVisibilidad, fechaVencimiento)
    ) {
      throw new BadRequestException(FECHA_VENCIMIENTO_INVALIDA);
    }
  }

  private requireDateOnly(value: string | Date): Date {
    const parsed = parseDateOnly(value);
    if (!parsed) {
      throw new BadRequestException(FECHA_INVALIDA);
    }
    return parsed;
  }

  private optionalDateOnly(
    value: string | Date | null | undefined,
  ): Date | null {
    if (value == null || value === '') {
      return null;
    }
    return this.requireDateOnly(value);
  }

  /**
   * Solo acepta el id proveniente del JWT (parámetro del controlador).
   * Nunca del body / query / headers de cliente.
   */
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
