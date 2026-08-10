import {
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { PublicacionTransparencia } from './entities/publicacion-transparencia.entity';
import { TipoArchivoTransparencia } from './enums/tipo-archivo-transparencia.enum';
import { TransparenciaService } from './transparencia.service';

describe('TransparenciaService', () => {
  let service: TransparenciaService;
  let repository: jest.Mocked<Pick<Repository<PublicacionTransparencia>, 'find'>>;

  beforeEach(() => {
    repository = {
      find: jest.fn().mockResolvedValue([]),
    };

    service = new TransparenciaService(
      repository as unknown as Repository<PublicacionTransparencia>,
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

  it('error de consulta → 500 controlado sin detalles internos', async () => {
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
