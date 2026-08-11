import { toPublicGaleriaFotoDto } from './public-galeria-foto.mapper';

describe('toPublicGaleriaFotoDto', () => {
  it('mapea campos públicos de una fotografía activa', () => {
    const dto = toPublicGaleriaFotoDto({
      idFotografiaGaleria: 1,
      titulo: 'Proyecto comunitario',
      descripcion: 'Mejoras en la red de distribución.',
      imagenUrl: '/uploads/galeria/foto-1.png',
      textoAlternativo: 'Trabajo de fontaneros en la comunidad',
    });

    expect(dto).toEqual({
      id: 1,
      titulo: 'Proyecto comunitario',
      descripcion: 'Mejoras en la red de distribución.',
      imagenUrl: '/uploads/galeria/foto-1.png',
      textoAlternativo: 'Trabajo de fontaneros en la comunidad',
    });
  });

  it('no expone datos administrativos ni de auditoría', () => {
    const dto = toPublicGaleriaFotoDto({
      id: 2,
      titulo: 'Asamblea',
      descripcion: null,
      imagenUrl: '/uploads/galeria/foto-2.jpg',
      textoAlternativo: 'Asamblea comunitaria',
      activo: true,
      ordenVisualizacion: 3,
      idUsuarioCreador: 9,
      fechaCreacion: '2026-08-01T00:00:00.000Z',
      fechaActualizacion: '2026-08-02T00:00:00.000Z',
      usuarioCreador: {
        idUsuario: 9,
        correoElectronico: 'admin@interno.local',
        passwordHash: 'hash',
      },
    });

    expect(dto).toEqual({
      id: 2,
      titulo: 'Asamblea',
      descripcion: null,
      imagenUrl: '/uploads/galeria/foto-2.jpg',
      textoAlternativo: 'Asamblea comunitaria',
    });
    expect(dto).not.toHaveProperty('activo');
    expect(dto).not.toHaveProperty('ordenVisualizacion');
    expect(dto).not.toHaveProperty('idUsuarioCreador');
    expect(dto).not.toHaveProperty('usuarioCreador');
    expect(dto).not.toHaveProperty('fechaCreacion');
    expect(dto).not.toHaveProperty('fechaActualizacion');
  });

  it('descarta registros sin imagen o texto alternativo', () => {
    expect(
      toPublicGaleriaFotoDto({
        id: 3,
        titulo: 'Sin imagen',
        imagenUrl: '',
        textoAlternativo: 'Texto',
      }),
    ).toBeNull();
  });
});
