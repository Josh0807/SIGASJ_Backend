import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { PublicacionTransparencia } from './entities/publicacion-transparencia.entity';
import { TipoArchivoTransparencia } from './enums/tipo-archivo-transparencia.enum';
import { TransparenciaFileUploadService } from './services/transparencia-file-upload.service';
import { TransparenciaService } from './transparencia.service';

describe('TransparenciaService', () => {
  let service: TransparenciaService;
  let repository: jest.Mocked<
    Pick<
      Repository<PublicacionTransparencia>,
      'find' | 'findOne' | 'create' | 'save' | 'remove' | 'findBy' | 'manager'
    >
  >;
  let uploadService: jest.Mocked<
    Pick<TransparenciaFileUploadService, 'saveFile' | 'deleteFile' | 'replaceFile'>
  >;

  beforeEach(() => {
    repository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      findBy: jest.fn(),
      create: jest.fn((value) => value as PublicacionTransparencia),
      save: jest.fn(async (value) => value as PublicacionTransparencia),
      remove: jest.fn(async (value) => value as PublicacionTransparencia),
      manager: {
        transaction: jest.fn(),
        getRepository: jest.fn(),
      },
    };
    uploadService = {
      saveFile: jest.fn(),
      deleteFile: jest.fn(),
      replaceFile: jest.fn(),
    };

    service = new TransparenciaService(
      repository as unknown as Repository<PublicacionTransparencia>,
      uploadService as unknown as TransparenciaFileUploadService,
    );
  });

  it('devuelve lista vacía cuando no hay publicaciones activas', async () => {
    await expect(service.findPublicPublicaciones()).resolves.toEqual({
      data: [],
      total: 0,
    });
  });

  it('consulta solo publicaciones activas ordenadas por posición', async () => {
    repository.find.mockResolvedValue([
      {
        idPublicacionTransparencia: 1,
        nombre: 'Informe',
        descripcionBreve: 'Resumen',
        archivoUrl: '/uploads/transparencia/informe.pdf',
        tipoArchivo: TipoArchivoTransparencia.PDF,
      } as PublicacionTransparencia,
    ]);

    const result = await service.findPublicPublicaciones();

    expect(repository.find).toHaveBeenCalledWith({
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
    expect(result.total).toBe(1);
    expect(result.data[0]).toEqual({
      id: 1,
      nombre: 'Informe',
      descripcion: 'Resumen',
      archivoUrl: '/uploads/transparencia/informe.pdf',
      tipo: TipoArchivoTransparencia.PDF,
    });
  });

  it('lista administrativa con filtros opcionales', async () => {
    repository.find.mockResolvedValue([]);

    await service.findAllAdmin({ activo: false, nombre: 'informe' });

    expect(repository.find).toHaveBeenCalledWith({
      where: {
        activo: false,
        nombre: expect.objectContaining({ _type: 'like' }),
      },
      order: {
        ordenVisualizacion: 'ASC',
        idPublicacionTransparencia: 'ASC',
      },
    });
  });

  it('registra una publicación y elimina el archivo si falla el guardado', async () => {
    uploadService.saveFile.mockResolvedValue({
      fileName: 'doc.pdf',
      archivoUrl: '/uploads/transparencia/doc.pdf',
      tipoArchivo: TipoArchivoTransparencia.PDF,
    });
    repository.save.mockRejectedValue(new Error('db fail'));

    await expect(
      service.createAdmin(
        { nombre: 'Informe', descripcionBreve: 'Resumen' },
        { buffer: Buffer.from('x') } as Express.Multer.File,
        1,
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(uploadService.deleteFile).toHaveBeenCalledWith(
      '/uploads/transparencia/doc.pdf',
    );
  });

  it('rechaza crear sin archivo', async () => {
    await expect(
      service.createAdmin(
        { nombre: 'Informe', descripcionBreve: 'Resumen' },
        undefined,
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('actualiza nombre y descripción', async () => {
    const publicacion = {
      idPublicacionTransparencia: 2,
      nombre: 'Antes',
      descripcionBreve: 'Vieja',
    } as PublicacionTransparencia;

    repository.findOne.mockResolvedValue(publicacion);

    const result = await service.updateAdmin(2, {
      nombre: 'Después',
      descripcionBreve: 'Nueva',
    });

    expect(result.nombre).toBe('Después');
    expect(result.descripcionBreve).toBe('Nueva');
  });

  it('reemplaza el archivo asociado', async () => {
    const publicacion = {
      idPublicacionTransparencia: 3,
      archivoUrl: '/uploads/transparencia/old.pdf',
      tipoArchivo: TipoArchivoTransparencia.PDF,
    } as PublicacionTransparencia;

    repository.findOne.mockResolvedValue(publicacion);
    uploadService.replaceFile.mockResolvedValue({
      fileName: 'new.pdf',
      archivoUrl: '/uploads/transparencia/new.pdf',
      tipoArchivo: TipoArchivoTransparencia.PDF,
    });

    const result = await service.replaceFileAdmin(
      3,
      { buffer: Buffer.from('x') } as Express.Multer.File,
    );

    expect(uploadService.replaceFile).toHaveBeenCalled();
    expect(result.archivoUrl).toBe('/uploads/transparencia/new.pdf');
  });

  it('elimina publicación y archivo asociado', async () => {
    const publicacion = {
      idPublicacionTransparencia: 4,
      archivoUrl: '/uploads/transparencia/doc.pdf',
    } as PublicacionTransparencia;

    repository.findOne.mockResolvedValue(publicacion);

    await service.removeAdmin(4);

    expect(repository.remove).toHaveBeenCalledWith(publicacion);
    expect(uploadService.deleteFile).toHaveBeenCalledWith(
      '/uploads/transparencia/doc.pdf',
    );
  });

  it('404 cuando la publicación no existe', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOneAdmin(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('activa o desactiva una publicación por id', async () => {
    const publicacion = {
      idPublicacionTransparencia: 2,
      activo: true,
    } as PublicacionTransparencia;

    repository.findOne.mockResolvedValue(publicacion);

    const result = await service.updateEstadoAdmin(2, { activo: false });

    expect(result.activo).toBe(false);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ activo: false }),
    );
  });

  it('reorganiza posiciones en transacción', async () => {
    const row1 = {
      idPublicacionTransparencia: 1,
      ordenVisualizacion: 0,
    } as PublicacionTransparencia;
    const row2 = {
      idPublicacionTransparencia: 2,
      ordenVisualizacion: 1,
    } as PublicacionTransparencia;

    const txRepository = {
      findBy: jest.fn().mockResolvedValue([row1, row2]),
      save: jest.fn(async (rows: PublicacionTransparencia[]) => rows),
    };

    repository.manager.transaction.mockImplementation(async (callback) =>
      callback({
        getRepository: () => txRepository,
      } as never),
    );

    const result = await service.reorderAdmin({
      publicaciones: [
        { idPublicacionTransparencia: 1, ordenVisualizacion: 2 },
        { idPublicacionTransparencia: 2, ordenVisualizacion: 1 },
      ],
    });

    expect(result).toEqual([
      expect.objectContaining({
        idPublicacionTransparencia: 2,
        ordenVisualizacion: 1,
      }),
      expect.objectContaining({
        idPublicacionTransparencia: 1,
        ordenVisualizacion: 2,
      }),
    ]);
  });

  it('rechaza reorganizar con posiciones repetidas', async () => {
    await expect(
      service.reorderAdmin({
        publicaciones: [
          { idPublicacionTransparencia: 1, ordenVisualizacion: 0 },
          { idPublicacionTransparencia: 2, ordenVisualizacion: 0 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza reorganizar con identificadores repetidos', async () => {
    await expect(
      service.reorderAdmin({
        publicaciones: [
          { idPublicacionTransparencia: 1, ordenVisualizacion: 0 },
          { idPublicacionTransparencia: 1, ordenVisualizacion: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('excluye publicaciones inactivas del listado público', async () => {
    repository.find.mockResolvedValue([
      {
        idPublicacionTransparencia: 1,
        nombre: 'Activa',
        descripcionBreve: 'Ok',
        archivoUrl: '/uploads/transparencia/a.pdf',
        tipoArchivo: TipoArchivoTransparencia.PDF,
      } as PublicacionTransparencia,
    ]);

    await service.findPublicPublicaciones();

    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { activo: true } }),
    );
  });

  it('error de consulta pública → 500 controlado sin detalles internos', async () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    repository.find.mockRejectedValue(
      new Error('ECONNREFUSED 127.0.0.1:1433 password=secret'),
    );

    await expect(service.findPublicPublicaciones()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    try {
      await service.findPublicPublicaciones();
    } catch (error) {
      const response = (error as InternalServerErrorException).getResponse();
      const payload =
        typeof response === 'string'
          ? { message: response }
          : (response as Record<string, unknown>);

      expect(payload.message).toBe(
        'No fue posible consultar las publicaciones de transparencia en este momento.',
      );
      expect(JSON.stringify(payload)).not.toMatch(
        /ECONNREFUSED|password|1433/i,
      );
    }

    loggerSpy.mockRestore();
  });
});
