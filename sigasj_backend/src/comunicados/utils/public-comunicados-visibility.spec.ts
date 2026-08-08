import {
  comparePublicComunicadoOrder,
  isPubliclyVisible,
  type PublicVisibilityRow,
} from './public-comunicados-visibility';

const NOW = new Date('2026-08-08T12:00:00.000Z');

describe('public-comunicados-visibility', () => {
  const base: PublicVisibilityRow = {
    activo: true,
    fechaInicioVisibilidad: '2026-08-01',
    fechaVencimiento: '2026-08-31',
    fechaPublicacion: '2026-08-01',
    fechaCreacion: '2026-08-01T10:00:00.000Z',
  };

  it('Caso 2 — activo y vigente aparece', () => {
    expect(isPubliclyVisible(base, NOW)).toBe(true);
  });

  it('Caso 3 — inactivo no aparece', () => {
    expect(isPubliclyVisible({ ...base, activo: false }, NOW)).toBe(false);
  });

  it('Caso 4 — vencido no aparece', () => {
    expect(
      isPubliclyVisible({ ...base, fechaVencimiento: '2026-08-01' }, NOW),
    ).toBe(false);
  });

  it('Caso 5 — futuro (inicio posterior) no aparece', () => {
    expect(
      isPubliclyVisible({ ...base, fechaInicioVisibilidad: '2026-08-20' }, NOW),
    ).toBe(false);
  });

  it('Caso 6 — sin fecha de vencimiento aparece si cumple el resto', () => {
    expect(isPubliclyVisible({ ...base, fechaVencimiento: null }, NOW)).toBe(
      true,
    );
  });

  it('Caso 4 límite — vencimiento exactamente ahora (>=) sí aparece', () => {
    expect(
      isPubliclyVisible({ ...base, fechaVencimiento: NOW.toISOString() }, NOW),
    ).toBe(true);
  });

  it('Caso 7 — orden fechaPublicacion DESC, fechaCreacion DESC', () => {
    const rows: PublicVisibilityRow[] = [
      {
        ...base,
        fechaPublicacion: '2026-08-01',
        fechaCreacion: '2026-08-01T08:00:00.000Z',
      },
      {
        ...base,
        fechaPublicacion: '2026-08-05',
        fechaCreacion: '2026-08-05T09:00:00.000Z',
      },
      {
        ...base,
        fechaPublicacion: '2026-08-05',
        fechaCreacion: '2026-08-05T18:00:00.000Z',
      },
    ];

    const ordered = [...rows].sort(comparePublicComunicadoOrder);
    expect(ordered[0]?.fechaCreacion).toBe('2026-08-05T18:00:00.000Z');
    expect(ordered[1]?.fechaCreacion).toBe('2026-08-05T09:00:00.000Z');
    expect(ordered[2]?.fechaPublicacion).toBe('2026-08-01');
  });
});
