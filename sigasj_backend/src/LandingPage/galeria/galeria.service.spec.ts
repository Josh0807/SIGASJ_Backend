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
      'find' | 'findOne' | 'create' | 'save' | 'remove'
    >
  >;
  let uploadService: jest.Mocked<
    Pick<GaleriaImageUploadService, 'saveImage' | 'deleteImage'>
  >;

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((value) => value as FotografiaGaleria),
      save: jest.fn(async (value) => value as FotografiaGaleria),
      remove: jest.fn(async (value) => value as FotografiaGaleria),
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
