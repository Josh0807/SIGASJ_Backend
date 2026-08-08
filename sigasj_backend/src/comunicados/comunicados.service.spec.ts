import { InternalServerErrorException, Logger } from '@nestjs/common';
import { ComunicadosService } from './comunicados.service';

describe('ComunicadosService', () => {
  let service: ComunicadosService;

  beforeEach(() => {
    service = new ComunicadosService();
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
});
