import { toPublicComunicadoDto } from './public-comunicado.mapper';

describe('toPublicComunicadoDto', () => {
  it('mapea campos públicos alineados al Front-end', () => {
    const dto = toPublicComunicadoDto({
      id: 1,
      titulo: 'Suspensión temporal del servicio',
      descripcion: 'Se realizará una suspensión por trabajos de mantenimiento.',
      contenido: 'Información completa del comunicado.',
      tipo: 'Mantenimiento',
      fechaPublicacion: '2026-07-31',
      fechaVencimiento: '2026-08-02',
      imagenUrl: null,
    });

    expect(dto).toEqual({
      id: 1,
      titulo: 'Suspensión temporal del servicio',
      descripcion: 'Se realizará una suspensión por trabajos de mantenimiento.',
      contenido: 'Información completa del comunicado.',
      tipo: 'Mantenimiento',
      fechaPublicacion: '2026-07-31',
      fechaVencimiento: '2026-08-02',
      imagenUrl: null,
    });
  });

  it('Caso 9 — no propaga contraseña, token ni usuario creador', () => {
    const dto = toPublicComunicadoDto({
      id: 'aviso-1',
      titulo: 'Aviso',
      descripcion: 'Texto',
      password: 'secret',
      token: 'jwt-token',
      creador: {
        id: 9,
        email: 'admin@interno.local',
        password: 'hash',
      },
      createdBy: { email: 'admin@interno.local' },
      rolAdministrativo: 'ADMIN',
    });

    expect(dto).toEqual({
      id: 'aviso-1',
      titulo: 'Aviso',
      descripcion: 'Texto',
    });
    expect(dto).not.toHaveProperty('password');
    expect(dto).not.toHaveProperty('token');
    expect(dto).not.toHaveProperty('creador');
    expect(dto).not.toHaveProperty('createdBy');
    expect(dto).not.toHaveProperty('rolAdministrativo');
  });

  it('serializa nulls opcionales de forma consistente', () => {
    const dto = toPublicComunicadoDto({
      id: 2,
      titulo: 'Sin opcionales',
      descripcion: 'Breve',
      contenido: null,
      fechaVencimiento: null,
      imagenUrl: null,
    });

    expect(dto).toMatchObject({
      id: 2,
      titulo: 'Sin opcionales',
      descripcion: 'Breve',
      contenido: null,
      fechaVencimiento: null,
      imagenUrl: null,
    });
  });

  it('contrato Front-end: id, titulo, descripcion, fecha, tipo disponibles', () => {
    const dto = toPublicComunicadoDto({
      idComunicado: 10,
      titulo: 'Título',
      descripcionBreve: 'Descripción',
      tipoComunicado: 'Aviso',
      fechaPublicacion: '2026-08-08',
    });

    expect(dto).toMatchObject({
      id: 10,
      titulo: 'Título',
      descripcion: 'Descripción',
      tipo: 'Aviso',
      fechaPublicacion: '2026-08-08',
    });
  });
});
