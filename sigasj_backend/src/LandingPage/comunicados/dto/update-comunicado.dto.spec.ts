import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { EstadoComunicado } from '../enums/estado-comunicado.enum';
import { UpdateComunicadoDto } from './update-comunicado.dto';
import { UpdateEstadoComunicadoDto } from './update-estado-comunicado.dto';

const adminPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

describe('UpdateComunicadoDto — campos prohibidos', () => {
  it('acepta actualización parcial de campos editables', async () => {
    const result = await adminPipe.transform(
      { titulo: 'Nuevo título' },
      { type: 'body', metatype: UpdateComunicadoDto },
    );

    expect(result).toBeInstanceOf(UpdateComunicadoDto);
    expect(result.titulo).toBe('Nuevo título');
    expect(result).not.toHaveProperty('estado');
  });

  it.each([
    ['estado', EstadoComunicado.INACTIVO],
    ['idUsuarioCreador', 1],
    ['idUsuarioModificador', 2],
    ['fechaCreacion', '2026-01-01T00:00:00.000Z'],
    ['fechaActualizacion', '2026-01-02T00:00:00.000Z'],
    ['usuarioCreador', { idUsuario: 1 }],
    ['usuarioModificador', { idUsuario: 2 }],
  ])('rechaza propiedad no permitida: %s', async (field, value) => {
    await expect(
      adminPipe.transform(
        { [field]: value },
        { type: 'body', metatype: UpdateComunicadoDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('UpdateEstadoComunicadoDto — solo estado', () => {
  it('acepta únicamente un estado válido', async () => {
    const result = await adminPipe.transform(
      { estado: EstadoComunicado.INACTIVO },
      { type: 'body', metatype: UpdateEstadoComunicadoDto },
    );

    expect(result).toEqual({ estado: EstadoComunicado.INACTIVO });
  });

  it('rechaza estado inválido', async () => {
    await expect(
      adminPipe.transform(
        { estado: 'Borrador' },
        { type: 'body', metatype: UpdateEstadoComunicadoDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    ['titulo', 'No debería'],
    ['idUsuarioModificador', 9],
    ['fechaActualizacion', '2026-01-01T00:00:00.000Z'],
  ])('rechaza campo extra: %s', async (field, value) => {
    await expect(
      adminPipe.transform(
        { estado: EstadoComunicado.ACTIVO, [field]: value },
        { type: 'body', metatype: UpdateEstadoComunicadoDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
