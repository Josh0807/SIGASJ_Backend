import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { GaleriaService } from './galeria.service';
import { FotografiaGaleria } from './entities/fotografia-galeria.entity';
import { GaleriaImageUploadService } from './services/galeria-image-upload.service';

describe('GaleriaService', () => {
  let service: GaleriaService;
  let repository: jest.Mocked<
    Pick<
      Repository<FotografiaGaleria>,
      'find' | 'findOne' | 'create' | 'save' | 'remove' | 'findBy' | 'manager'
    >
  >;
  let uploadService: jest.Mocked<
    Pick<GaleriaImageUploadService, 'saveImage' | 'deleteImage'>
  >;

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findBy: jest.fn(),
      create: jest.fn((value) => value as FotografiaGaleria),
      save: jest.fn(async (value) => value as FotografiaGaleria),
      remove: jest.fn(async (value) => value as FotografiaGaleria),
      manager: {
        transaction: jest.fn(),
        getRepository: jest.fn(),
      },
    };
    uploadService = {
      saveImage: jest.fn(),
      deleteImage: jest.fn(),
    };
    service = new GaleriaService(
      repository as unknown as Repository<FotografiaGaleria>,
      uploadService as unknown as GaleriaImageUploadService,
    );
  });

  it('devuelve lista vacía cuando no hay fotografías activas', async () => {
    repository.find.mockResolvedValue([]);

    await expect(service.findPublicFotografias()).resolves.toEqual({
      data: [],
      total: 0,
    });
  });

  it('consulta solo fotografías activas ordenadas por posición', async () => {
    repository.find.mockResolvedValue([
      {
        idFotografiaGaleria: 1,
        titulo: 'Primera',
        descripcion: 'Descripción',
        imagenUrl: '/uploads/galeria/1.png',
        textoAlternativo: 'Primera foto',
      } as FotografiaGaleria,
    ]);

    const result = await service.findPublicFotografias();

    expect(repository.find).toHaveBeenCalledWith({
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
    expect(result.total).toBe(1);
  });

  it('lista administrativa con filtros opcionales', async () => {
    repository.find.mockResolvedValue([]);

    await service.findAllAdmin({ activo: false, titulo: 'obra' });

    expect(repository.find).toHaveBeenCalledWith({
      where: {
        activo: false,
        titulo: expect.objectContaining({ _type: 'like' }),
      },
      order: {
        ordenVisualizacion: 'ASC',
        idFotografiaGaleria: 'ASC',
      },
    });
  });

  it('registra una fotografía y elimina el archivo si falla el guardado', async () => {
    uploadService.saveImage.mockResolvedValue({
      fileName: 'foto.png',
      imagenUrl: '/uploads/galeria/foto.png',
    });
    repository.save.mockRejectedValue(new Error('db fail'));

    await expect(
      service.createAdmin(
        { textoAlternativo: 'Foto' },
        { buffer: Buffer.from('x') } as Express.Multer.File,
        1,
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(uploadService.deleteImage).toHaveBeenCalledWith(
      '/uploads/galeria/foto.png',
    );
  });

  it('rechaza crear sin archivo de imagen', async () => {
    await expect(
      service.createAdmin({ textoAlternativo: 'Foto' }, undefined, 1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('activa o desactiva una fotografía por id', async () => {
    const fotografia = {
      idFotografiaGaleria: 2,
      activo: true,
    } as FotografiaGaleria;

    repository.findOne.mockResolvedValue(fotografia);

    const result = await service.updateEstadoAdmin(2, { activo: false });

    expect(result.activo).toBe(false);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ activo: false }),
    );
  });

  it('reorganiza posiciones en transacción', async () => {
    const row1 = {
      idFotografiaGaleria: 1,
      ordenVisualizacion: 0,
    } as FotografiaGaleria;
    const row2 = {
      idFotografiaGaleria: 2,
      ordenVisualizacion: 1,
    } as FotografiaGaleria;

    const txRepository = {
      findBy: jest.fn().mockResolvedValue([row1, row2]),
      save: jest.fn(async (rows: FotografiaGaleria[]) => rows),
    };

    repository.manager.transaction.mockImplementation(async (callback) =>
      callback({
        getRepository: () => txRepository,
      } as never),
    );

    const result = await service.reorderAdmin({
      fotografias: [
        { idFotografiaGaleria: 1, ordenVisualizacion: 2 },
        { idFotografiaGaleria: 2, ordenVisualizacion: 1 },
      ],
    });

    expect(result).toEqual([
      expect.objectContaining({
        idFotografiaGaleria: 2,
        ordenVisualizacion: 1,
      }),
      expect.objectContaining({
        idFotografiaGaleria: 1,
        ordenVisualizacion: 2,
      }),
    ]);
  });

  it('rechaza reorganizar con posiciones repetidas', async () => {
    await expect(
      service.reorderAdmin({
        fotografias: [
          { idFotografiaGaleria: 1, ordenVisualizacion: 0 },
          { idFotografiaGaleria: 2, ordenVisualizacion: 0 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza reorganizar si falta alguna fotografía', async () => {
    const txRepository = {
      findBy: jest.fn().mockResolvedValue([
        { idFotografiaGaleria: 1, ordenVisualizacion: 0 } as FotografiaGaleria,
      ]),
      save: jest.fn(),
    };

    repository.manager.transaction.mockImplementation(async (callback) =>
      callback({
        getRepository: () => txRepository,
      } as never),
    );

    await expect(
      service.reorderAdmin({
        fotografias: [
          { idFotografiaGaleria: 1, ordenVisualizacion: 0 },
          { idFotografiaGaleria: 99, ordenVisualizacion: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('elimina registro e imagen asociada', async () => {
    const fotografia = {
      idFotografiaGaleria: 3,
      imagenUrl: '/uploads/galeria/3.png',
    } as FotografiaGaleria;

    repository.findOne.mockResolvedValue(fotografia);

    await service.removeAdmin(3);

    expect(repository.remove).toHaveBeenCalledWith(fotografia);
    expect(uploadService.deleteImage).toHaveBeenCalledWith(
      '/uploads/galeria/3.png',
    );
  });

  it('responde 404 cuando la fotografía no existe', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOneAdmin(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('error de consulta pública → 500 controlado', async () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    repository.find.mockRejectedValue(
      new Error('ECONNREFUSED 127.0.0.1:5432 password=secret'),
    );

    await expect(service.findPublicFotografias()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    loggerSpy.mockRestore();
  });
});
