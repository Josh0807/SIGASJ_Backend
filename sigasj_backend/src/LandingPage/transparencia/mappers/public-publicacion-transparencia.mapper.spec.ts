import { toPublicPublicacionTransparenciaDto } from './public-publicacion-transparencia.mapper';
import { TipoArchivoTransparencia } from '../enums/tipo-archivo-transparencia.enum';

describe('toPublicPublicacionTransparenciaDto', () => {
  it('proyecta una entidad válida al DTO público', () => {
    const dto = toPublicPublicacionTransparenciaDto({
      idPublicacionTransparencia: 3,
      nombre: 'Informe 2025',
      descripcionBreve: 'Resumen del informe',
      archivoUrl: '/uploads/transparencia/informe.pdf',
      tipoArchivo: TipoArchivoTransparencia.PDF,
      activo: true,
      usuarioCreador: { idUsuario: 1 },
    });

    expect(dto).toEqual({
      id: 3,
      nombre: 'Informe 2025',
      descripcion: 'Resumen del informe',
      archivoUrl: '/uploads/transparencia/informe.pdf',
      tipo: TipoArchivoTransparencia.PDF,
    });
    expect(dto).not.toHaveProperty('usuarioCreador');
    expect(dto).not.toHaveProperty('activo');
  });

  it('devuelve null cuando faltan campos obligatorios', () => {
    expect(
      toPublicPublicacionTransparenciaDto({
        idPublicacionTransparencia: 1,
        nombre: 'Sin archivo',
      }),
    ).toBeNull();
  });

  it('devuelve null con entradas inválidas', () => {
    expect(toPublicPublicacionTransparenciaDto(null)).toBeNull();
    expect(toPublicPublicacionTransparenciaDto([])).toBeNull();
  });
});
