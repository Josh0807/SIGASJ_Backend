import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GaleriaService } from './galeria.service';
import { FotografiaGaleria } from './entities/fotografia-galeria.entity';

describe('GaleriaService', () => {
  let service: GaleriaService;
  let repository: jest.Mocked<Pick<Repository<FotografiaGaleria>, 'find'>>;

  beforeEach(() => {
    repository = {
      find: jest.fn(),
    };
    service = new GaleriaService(
      repository as unknown as Repository<FotografiaGaleria>,
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
    expect(result.data[0]).toEqual({
      id: 1,
      titulo: 'Primera',
      descripcion: 'Descripción',
      imagenUrl: '/uploads/galeria/1.png',
      textoAlternativo: 'Primera foto',
    });
  });

  it('error de consulta → 500 controlado sin detalles internos', async () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    repository.find.mockRejectedValue(
      new Error('ECONNREFUSED 127.0.0.1:5432 password=secret'),
    );

    await expect(service.findPublicFotografias()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    try {
      await service.findPublicFotografias();
    } catch (error) {
      const response = (error as InternalServerErrorException).getResponse();
      const payload =
        typeof response === 'string'
          ? { message: response }
          : (response as Record<string, unknown>);

      expect(payload.message).toBe(
        'No fue posible consultar la galería en este momento.',
      );
      expect(JSON.stringify(payload)).not.toMatch(
        /ECONNREFUSED|password|5432/i,
      );
    }

    expect(loggerSpy).toHaveBeenCalled();
    loggerSpy.mockRestore();
  });
});
