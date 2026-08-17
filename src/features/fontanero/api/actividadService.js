import { db } from '../../../shared/db.js';
import { badRequest } from '../../../shared/errors.js';
import {
  ESTADOS_ACTIVIDAD_FONTANERO,
  ESTADOS_VALIDACION_ACTIVIDAD,
  TIPOS_ACTIVIDAD_FONTANERO,
} from '../../../shared/utils/constants.js';
import { generarId, nowIso, parseFecha, textoOpcional, textoRequerido } from '../../../shared/utils/helpers.js';
import { toActividadFontaneroResponse } from './types.js';

const ACTIVIDAD_SELECT = `
  SELECT a.*, u.NombreUsuario AS FontaneroNombre
  FROM ActividadesFontanero a
  JOIN Usuarios u ON u.Id = a.FontaneroId
`;

function validarActividad(dto) {
  if (!TIPOS_ACTIVIDAD_FONTANERO.includes(dto.tipo)) {
    throw badRequest('El tipo de actividad no es valido.');
  }
  if (!ESTADOS_ACTIVIDAD_FONTANERO.includes(dto.estado || 'Pendiente')) {
    throw badRequest('El estado de actividad no es valido.');
  }
}

export function listarActividadesFontanero() {
  return db
    .prepare(`${ACTIVIDAD_SELECT} ORDER BY a.FechaActividad DESC`)
    .all()
    .map(toActividadFontaneroResponse);
}

export function listarActividadesPorFontanero(fontaneroId) {
  return db
    .prepare(`${ACTIVIDAD_SELECT} WHERE a.FontaneroId = ? ORDER BY a.FechaActividad DESC`)
    .all(fontaneroId)
    .map(toActividadFontaneroResponse);
}

export function crearActividadFontanero(dto, fontaneroId) {
  validarActividad(dto);
  const id = generarId('AF');
  db.prepare(`
    INSERT INTO ActividadesFontanero (
      Id, FontaneroId, FechaActividad, HoraInicio, HoraFin, Tipo, Descripcion, Ubicacion,
      NumeroAveriaVinculada, LecturaMedidorId, MaterialesUtilizados, Observaciones, Estado,
      EstadoValidacion, FechaCreacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?)
  `).run(
    id,
    fontaneroId,
    parseFecha(dto.fechaActividad, 'La fecha de actividad no es valida.'),
    textoOpcional(dto.horaInicio),
    textoOpcional(dto.horaFin),
    dto.tipo,
    textoRequerido(dto.descripcion),
    textoRequerido(dto.ubicacion),
    textoOpcional(dto.numeroAveriaVinculada)?.toUpperCase() ?? null,
    dto.lecturaMedidorId ?? null,
    textoOpcional(dto.materialesUtilizados),
    textoOpcional(dto.observaciones),
    dto.estado || 'Pendiente',
    nowIso(),
  );

  return toActividadFontaneroResponse(
    db.prepare(`${ACTIVIDAD_SELECT} WHERE a.Id = ?`).get(id),
  );
}

export function actualizarActividadFontanero(id, dto, fontaneroId) {
  validarActividad(dto);
  const actividad = db.prepare(`${ACTIVIDAD_SELECT} WHERE a.Id = ?`).get(id);
  if (!actividad || actividad.FontaneroId !== fontaneroId) return null;
  if (actividad.EstadoValidacion !== 'Pendiente') {
    throw badRequest('No puede editar una actividad ya validada o rechazada.');
  }

  db.prepare(`
    UPDATE ActividadesFontanero SET
      FechaActividad = ?, HoraInicio = ?, HoraFin = ?, Tipo = ?, Descripcion = ?, Ubicacion = ?,
      NumeroAveriaVinculada = ?, LecturaMedidorId = ?, MaterialesUtilizados = ?, Observaciones = ?,
      Estado = ?, FechaActualizacion = ?
    WHERE Id = ?
  `).run(
    parseFecha(dto.fechaActividad, 'La fecha de actividad no es valida.'),
    textoOpcional(dto.horaInicio),
    textoOpcional(dto.horaFin),
    dto.tipo,
    textoRequerido(dto.descripcion),
    textoRequerido(dto.ubicacion),
    textoOpcional(dto.numeroAveriaVinculada)?.toUpperCase() ?? null,
    dto.lecturaMedidorId ?? null,
    textoOpcional(dto.materialesUtilizados),
    textoOpcional(dto.observaciones),
    dto.estado || 'Pendiente',
    nowIso(),
    id,
  );

  return toActividadFontaneroResponse(
    db.prepare(`${ACTIVIDAD_SELECT} WHERE a.Id = ?`).get(id),
  );
}

export function validarActividadFontanero(id, dto) {
  if (!ESTADOS_VALIDACION_ACTIVIDAD.includes(dto.estadoValidacion)) {
    throw badRequest('El estado de validacion no es valido.');
  }
  if (dto.estadoValidacion === 'Rechazada' && !textoOpcional(dto.observacionValidacion)) {
    throw badRequest('Debe indicar una observacion al rechazar la actividad.');
  }

  const actividad = db.prepare(`${ACTIVIDAD_SELECT} WHERE a.Id = ?`).get(id);
  if (!actividad) return null;

  db.prepare(`
    UPDATE ActividadesFontanero
    SET EstadoValidacion = ?, ObservacionValidacion = ?, FechaActualizacion = ?
    WHERE Id = ?
  `).run(dto.estadoValidacion, textoOpcional(dto.observacionValidacion), nowIso(), id);

  return toActividadFontaneroResponse(
    db.prepare(`${ACTIVIDAD_SELECT} WHERE a.Id = ?`).get(id),
  );
}
