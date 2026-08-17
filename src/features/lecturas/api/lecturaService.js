import { db } from '../../../shared/db.js';
import { badRequest, unauthorized } from '../../../shared/errors.js';
import { ESTADOS_LECTURA_MEDIDOR, Roles } from '../../../shared/utils/constants.js';
import { nowIso, parseFecha, textoOpcional, textoRequerido } from '../../../shared/utils/helpers.js';
import { toLecturaResponse } from './types.js';

const LECTURA_SELECT = `
  SELECT l.*, u.NombreUsuario AS FontaneroNombre
  FROM LecturasMedidor l
  JOIN Usuarios u ON u.Id = l.FontaneroId
`;

export function listarLecturas() {
  return db
    .prepare(`${LECTURA_SELECT} ORDER BY l.FechaLectura DESC`)
    .all()
    .map(toLecturaResponse);
}

export function listarLecturasPorFontanero(fontaneroId) {
  return db
    .prepare(`${LECTURA_SELECT} WHERE l.FontaneroId = ? ORDER BY l.FechaLectura DESC`)
    .all(fontaneroId)
    .map(toLecturaResponse);
}

export function historialLecturasPorMedidor(numeroMedidor) {
  const normalizado = textoRequerido(numeroMedidor).toUpperCase();
  return db
    .prepare(`${LECTURA_SELECT} WHERE UPPER(l.NumeroMedidor) = ? ORDER BY l.FechaLectura DESC`)
    .all(normalizado)
    .map(toLecturaResponse);
}

export function crearLectura(dto, fontaneroId) {
  if (!textoOpcional(dto.nombreAbonado) || !textoOpcional(dto.numeroMedidor)) {
    throw badRequest('Abonado y numero de medidor son obligatorios.');
  }

  const consumo = Number(dto.lecturaActual) - Number(dto.lecturaAnterior);
  const estado = consumo < 0 ? 'Con inconsistencia' : 'Registrada';
  const ultima = db
    .prepare(
      'SELECT Consumo FROM LecturasMedidor WHERE UPPER(NumeroMedidor) = UPPER(?) ORDER BY FechaLectura DESC LIMIT 1',
    )
    .get(dto.numeroMedidor);

  const result = db.prepare(`
    INSERT INTO LecturasMedidor (
      NombreAbonado, NumeroMedidor, CedulaAbonado, LecturaAnterior, LecturaActual, Consumo,
      ConsumoMesAnterior, FechaLectura, Observaciones, Estado, FontaneroId, FechaRegistro
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    textoRequerido(dto.nombreAbonado),
    textoRequerido(dto.numeroMedidor),
    textoOpcional(dto.cedulaAbonado),
    dto.lecturaAnterior,
    dto.lecturaActual,
    consumo,
    ultima?.Consumo ?? null,
    parseFecha(dto.fechaLectura, 'La fecha de lectura no es valida.'),
    textoOpcional(dto.observaciones),
    estado,
    fontaneroId,
    nowIso(),
  );

  return toLecturaResponse(
    db.prepare(`${LECTURA_SELECT} WHERE l.Id = ?`).get(result.lastInsertRowid),
  );
}

export function actualizarLectura(id, dto, rol, usuarioId) {
  const lectura = db.prepare(`${LECTURA_SELECT} WHERE l.Id = ?`).get(id);
  if (!lectura) return null;

  if (rol === Roles.Fontanero && lectura.FontaneroId !== usuarioId) {
    throw unauthorized('No puede modificar lecturas de otro fontanero.');
  }

  let lecturaActual = lectura.LecturaActual;
  let consumo = lectura.Consumo;
  let estado = lectura.Estado;
  let observaciones = lectura.Observaciones;

  if (dto.lecturaActual != null) {
    if (Number(dto.lecturaActual) < lectura.LecturaAnterior) {
      throw badRequest('La lectura actual no puede ser menor que la lectura anterior.');
    }
    lecturaActual = Number(dto.lecturaActual);
    consumo = lecturaActual - lectura.LecturaAnterior;
    if (consumo < 0) estado = 'Con inconsistencia';
  }

  if (dto.observaciones !== undefined) {
    observaciones = textoOpcional(dto.observaciones);
  }

  if (textoOpcional(dto.estado)) {
    if (!ESTADOS_LECTURA_MEDIDOR.includes(dto.estado)) {
      throw badRequest('El estado de lectura no es valido.');
    }
    if (rol === Roles.Fontanero && !['Registrada', 'Con inconsistencia'].includes(dto.estado)) {
      throw badRequest('El fontanero no puede aplicar ese estado.');
    }
    estado = dto.estado;
  }

  db.prepare(`
    UPDATE LecturasMedidor
    SET LecturaActual = ?, Consumo = ?, Observaciones = ?, Estado = ?
    WHERE Id = ?
  `).run(lecturaActual, consumo, observaciones, estado, id);

  return toLecturaResponse(db.prepare(`${LECTURA_SELECT} WHERE l.Id = ?`).get(id));
}
