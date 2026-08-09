import {
  isFechaVencimientoGteInicio,
  parseDateOnly,
} from './fecha-vencimiento-gte-inicio.validator';

describe('isFechaVencimientoGteInicio', () => {
  it('permite fechaVencimiento ausente', () => {
    expect(isFechaVencimientoGteInicio('2026-08-08', null)).toBe(true);
    expect(isFechaVencimientoGteInicio('2026-08-08', undefined)).toBe(true);
  });

  it('acepta vencimiento igual o posterior al inicio', () => {
    expect(isFechaVencimientoGteInicio('2026-08-08', '2026-08-08')).toBe(true);
    expect(isFechaVencimientoGteInicio('2026-08-08', '2026-08-09')).toBe(true);
  });

  it('rechaza vencimiento anterior al inicio', () => {
    expect(isFechaVencimientoGteInicio('2026-08-08', '2026-08-07')).toBe(false);
  });

  it('rechaza fechas inválidas', () => {
    expect(isFechaVencimientoGteInicio('2026-02-30', '2026-03-01')).toBe(false);
    expect(isFechaVencimientoGteInicio('2026-08-08', 'no-es-fecha')).toBe(
      false,
    );
  });
});

describe('parseDateOnly', () => {
  it('parsea YYYY-MM-DD', () => {
    expect(parseDateOnly('2026-08-08')).toEqual(new Date(2026, 7, 8));
  });

  it('rechaza día inexistente', () => {
    expect(parseDateOnly('2026-02-30')).toBeNull();
  });
});
