import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateComunicadoDto } from './create-comunicado.dto';
import { EstadoComunicado } from '../enums/estado-comunicado.enum';
import { TipoComunicado } from '../enums/tipo-comunicado.enum';

const adminPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

function validCreateBody(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    titulo: 'Corte programado',
    descripcionBreve: 'Resumen breve',
    tipoComunicado: TipoComunicado.CORTE_DE_AGUA,
    fechaPublicacion: '2026-08-08',
    fechaInicioVisibilidad: '2026-08-08',
    fechaVencimiento: '2026-08-15',
    estado: EstadoComunicado.ACTIVO,
    ...overrides,
  };
}

async function expectRejected(body: Record<string, unknown>): Promise<void> {
  await expect(
    adminPipe.transform(body, {
      type: 'body',
      metatype: CreateComunicadoDto,
    }),
  ).rejects.toBeInstanceOf(BadRequestException);
}

describe('CreateComunicadoDto — validaciones', () => {
  it('acepta un payload válido', async () => {
    const result = await adminPipe.transform(validCreateBody(), {
      type: 'body',
      metatype: CreateComunicadoDto,
    });

    expect(result).toBeInstanceOf(CreateComunicadoDto);
    expect(result.titulo).toBe('Corte programado');
  });

  it('rechaza sin título', async () => {
    const body = validCreateBody();
    delete body.titulo;
    await expectRejected(body);
  });

  it('rechaza título vacío ""', async () => {
    await expectRejected(validCreateBody({ titulo: '' }));
  });

  it('rechaza título solo espacios "   "', async () => {
    await expectRejected(validCreateBody({ titulo: '   ' }));
  });

  it('rechaza sin descripción breve', async () => {
    const body = validCreateBody();
    delete body.descripcionBreve;
    await expectRejected(body);
  });

  it('rechaza sin tipo', async () => {
    const body = validCreateBody();
    delete body.tipoComunicado;
    await expectRejected(body);
  });

  it('rechaza sin fecha publicación', async () => {
    const body = validCreateBody();
    delete body.fechaPublicacion;
    await expectRejected(body);
  });

  it('rechaza sin fecha inicio', async () => {
    const body = validCreateBody();
    delete body.fechaInicioVisibilidad;
    await expectRejected(body);
  });

  it('rechaza estado inválido', async () => {
    await expectRejected(validCreateBody({ estado: 'Borrador' }));
  });

  it('rechaza fecha vencimiento anterior a fecha inicio', async () => {
    await expectRejected(
      validCreateBody({
        fechaInicioVisibilidad: '2026-08-10',
        fechaVencimiento: '2026-08-01',
      }),
    );
  });

  it('rechaza campos de auditoría enviados en el body', async () => {
    await expectRejected(
      validCreateBody({
        idUsuarioCreador: 1,
      }),
    );
    await expectRejected(
      validCreateBody({
        idUsuarioModificador: 2,
      }),
    );
    await expectRejected(
      validCreateBody({
        fechaCreacion: '2026-01-01T00:00:00.000Z',
      }),
    );
  });
});
