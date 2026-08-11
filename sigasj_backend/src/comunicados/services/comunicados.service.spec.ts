import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { ComunicadosService } from './comunicados.service';
import { CreateComunicadoDto } from '../dto/create-comunicado.dto';
import { UpdateComunicadoDto } from '../dto/update-comunicado.dto';
import { UpdateEstadoComunicadoDto } from '../dto/update-estado-comunicado.dto';
import type { Comunicado } from '../entities/comunicado.entity';
import { EstadoComunicado } from '../enums/estado-comunicado.enum';
import { TipoComunicado } from '../enums/tipo-comunicado.enum';

describe('ComunicadosService', () => {
  let service: ComunicadosService;
  let repository: jest.Mocked<
    Pick<Repository<Comunicado>, 'find' | 'findOne' | 'create' | 'save'>
  >;

  beforeEach(() => {
    repository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    service = new ComunicadosService(
      repository as unknown as Repository<Comunicado>,
    );
  });

  it('Caso 8 — lista vacía → data=[], total=0', async () => {
    await expect(service.findPublicComunicados()).resolves.toEqual({
      data: [],
      total: 0,
    });
  });

  it('proyecta filas visibles al DTO público', async () => {
    jest.spyOn(service as any, 'loadVisiblePublicRows').mockResolvedValue([
      {
        id: 1,
        titulo: 'Vigente',
        descripcion: 'Ok',
        tipo: 'Aviso',
        fechaPublicacion: '2026-08-01',
        password: 'no',
        creador: { email: 'x@y.z' },
      },
    ]);

    const result = await service.findPublicComunicados();

    expect(result.total).toBe(1);
    expect(result.data[0]).toEqual({
      id: 1,
      titulo: 'Vigente',
      descripcion: 'Ok',
      tipo: 'Aviso',
      fechaPublicacion: '2026-08-01',
    });
    expect(result.data[0]).not.toHaveProperty('password');
    expect(result.data[0]).not.toHaveProperty('creador');
  });

  it('Caso 10 — error de consulta → 500 controlado sin detalles internos', async () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    jest
      .spyOn(service as any, 'loadVisiblePublicRows')
      .mockRejectedValue(
        new Error('ECONNREFUSED 127.0.0.1:5432 password=secret'),
      );

    await expect(service.findPublicComunicados()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    try {
      await service.findPublicComunicados();
    } catch (error) {
      const response = (error as InternalServerErrorException).getResponse();
      const payload =
        typeof response === 'string'
          ? { message: response }
          : (response as Record<string, unknown>);

      expect(payload.message).toBe(
        'No fue posible consultar los comunicados en este momento.',
      );
      expect(JSON.stringify(payload)).not.toMatch(
        /ECONNREFUSED|password|5432/i,
      );
    }

    expect(loggerSpy).toHaveBeenCalled();
    loggerSpy.mockRestore();
  });

  describe('admin', () => {
    const baseCreateDto = (): CreateComunicadoDto => ({
      titulo: 'Aviso',
      descripcionBreve: 'Resumen',
      contenido: null,
      tipoComunicado: TipoComunicado.AVISO_GENERAL,
      fechaPublicacion: '2026-08-08',
      fechaInicioVisibilidad: '2026-08-08',
      fechaVencimiento: '2026-08-15',
      estado: EstadoComunicado.ACTIVO,
      imagenUrl: null,
    });

    it('findAllAdmin lista sin filtros públicos', async () => {
      repository.find.mockResolvedValue([]);

      await expect(service.findAllAdmin()).resolves.toEqual([]);
      expect(repository.find).toHaveBeenCalledWith({
        order: {
          fechaCreacion: 'DESC',
          fechaPublicacion: 'DESC',
        },
      });
    });

    it('findOneAdmin lanza NotFoundException si no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOneAdmin(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('findOneAdmin devuelve el comunicado existente', async () => {
      const existing = { idComunicado: 5, titulo: 'Ok' } as Comunicado;
      repository.findOne.mockResolvedValue(existing);

      await expect(service.findOneAdmin(5)).resolves.toBe(existing);
    });

    it('findOneAdmin con error de BD → 500 controlado sin filtrar como 404', async () => {
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      repository.findOne.mockRejectedValue(
        new Error(
          "SELECT failed login failed for user 'sa' password=secret stack",
        ),
      );

      await expect(service.findOneAdmin(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      try {
        await service.findOneAdmin(1);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error).not.toBeInstanceOf(NotFoundException);
        expect(error).not.toBeInstanceOf(BadRequestException);

        const response = (error as InternalServerErrorException).getResponse();
        const payload =
          typeof response === 'string'
            ? { message: response }
            : (response as Record<string, unknown>);

        expect(payload.message).toBe(
          'No fue posible procesar la operación de comunicados en este momento.',
        );
        expect(JSON.stringify(payload)).not.toMatch(
          /SELECT|password|sa'|stack/i,
        );
      }

      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });

    it('createAdmin con error de BD → 500 controlado sin filtrar SQL', async () => {
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      repository.create.mockImplementation((value) => value as Comunicado);
      repository.save.mockRejectedValue(
        new Error('INSERT INTO Comunicado ... ELOGIN password=dbpass'),
      );

      await expect(
        service.createAdmin(baseCreateDto(), 7),
      ).rejects.toBeInstanceOf(InternalServerErrorException);

      try {
        await service.createAdmin(baseCreateDto(), 7);
      } catch (error) {
        const response = (error as InternalServerErrorException).getResponse();
        const payload =
          typeof response === 'string'
            ? { message: response }
            : (response as Record<string, unknown>);

        expect(payload.message).toBe(
          'No fue posible procesar la operación de comunicados en este momento.',
        );
        expect(JSON.stringify(payload)).not.toMatch(
          /INSERT|password|ELOGIN|dbpass/i,
        );
      }

      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });

    it('createAdmin asocia idUsuarioCreador y guarda', async () => {
      const dto = baseCreateDto();
      const created = { idComunicado: 1 } as Comunicado;
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      await expect(service.createAdmin(dto, 7)).resolves.toBe(created);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Aviso',
          idUsuarioCreador: 7,
          idUsuarioModificador: null,
          estado: EstadoComunicado.ACTIVO,
        }),
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          fechaCreacion: expect.anything(),
          fechaActualizacion: expect.anything(),
        }),
      );
      expect(repository.save).toHaveBeenCalledWith(created);
    });

    it('createAdmin ignora idUsuarioCreador contaminado en el objeto', async () => {
      const polluted = {
        ...baseCreateDto(),
        idUsuarioCreador: 999,
        idUsuarioModificador: 888,
      } as CreateComunicadoDto;
      const created = { idComunicado: 1 } as Comunicado;
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      await service.createAdmin(polluted, 7);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ idUsuarioCreador: 7 }),
      );
      expect(repository.create.mock.calls[0][0]).not.toEqual(
        expect.objectContaining({ idUsuarioCreador: 999 }),
      );
    });

    it('createAdmin rechaza fechaVencimiento anterior al inicio', async () => {
      const dto = baseCreateDto();
      dto.fechaVencimiento = '2026-08-01';

      await expect(service.createAdmin(dto, 7)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('updateAdmin no modifica estado ni idUsuarioCreador y registra modificador', async () => {
      const existing = {
        idComunicado: 1,
        titulo: 'Viejo',
        descripcionBreve: 'Desc',
        contenido: null,
        tipoComunicado: TipoComunicado.AVISO_GENERAL,
        fechaPublicacion: new Date(2026, 7, 8),
        fechaInicioVisibilidad: new Date(2026, 7, 8),
        fechaVencimiento: null,
        estado: EstadoComunicado.ACTIVO,
        imagenUrl: null,
        idUsuarioCreador: 1,
        idUsuarioModificador: null,
      } as Comunicado;

      repository.findOne.mockResolvedValue(existing);
      repository.save.mockImplementation(
        async (entity) => entity as Comunicado,
      );

      const dto: UpdateComunicadoDto = { titulo: 'Nuevo' };
      const result = await service.updateAdmin(1, dto, 22);

      expect(result.titulo).toBe('Nuevo');
      expect(result.estado).toBe(EstadoComunicado.ACTIVO);
      expect(result.idUsuarioCreador).toBe(1);
      expect(result.idUsuarioModificador).toBe(22);
    });

    it('updateAdmin valida fechas parciales contra el registro', async () => {
      const existing = {
        idComunicado: 1,
        titulo: 'Viejo',
        descripcionBreve: 'Desc',
        contenido: null,
        tipoComunicado: TipoComunicado.AVISO_GENERAL,
        fechaPublicacion: new Date(2026, 7, 8),
        fechaInicioVisibilidad: new Date(2026, 7, 10),
        fechaVencimiento: new Date(2026, 7, 20),
        estado: EstadoComunicado.ACTIVO,
        imagenUrl: null,
        idUsuarioCreador: 1,
        idUsuarioModificador: null,
      } as Comunicado;

      repository.findOne.mockResolvedValue(existing);

      await expect(
        service.updateAdmin(1, { fechaVencimiento: '2026-08-05' }, 22),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updateEstadoAdmin cambia solo el estado', async () => {
      const existing = {
        idComunicado: 1,
        titulo: 'Aviso',
        estado: EstadoComunicado.ACTIVO,
        idUsuarioModificador: null,
      } as Comunicado;

      repository.findOne.mockResolvedValue(existing);
      repository.save.mockImplementation(
        async (entity) => entity as Comunicado,
      );

      const dto: UpdateEstadoComunicadoDto = {
        estado: EstadoComunicado.INACTIVO,
      };
      const result = await service.updateEstadoAdmin(1, dto, 5);

      expect(result.estado).toBe(EstadoComunicado.INACTIVO);
      expect(result.idUsuarioModificador).toBe(5);
      expect(result.titulo).toBe('Aviso');
    });
  });
});
