import { db } from '../../../shared/db.js';
import { badRequest } from '../../../shared/errors.js';
import {
  ESTADOS_ACTIVIDAD_PLOMERIA,
  PRIORIDADES_ACTIVIDAD,
  TIPOS_ACTIVIDAD_PLOMERIA,
  siguienteEstadoActividad,
} from '../../../shared/utils/constants.js';
import { generarId, nowIso, textoOpcional, textoRequerido } from '../../../shared/utils/helpers.js';
import { toActividadPlomeriaResponse } from './types.js';

function validar(dto) {
  if (!TIPOS_ACTIVIDAD_PLOMERIA.includes(dto.tipo)) {
    throw badRequest('El tipo de actividad no es valido.');
  }
  if (!ESTADOS_ACTIVIDAD_PLOMERIA.includes(dto.estado)) {
    throw badRequest('El estado de actividad no es valido.');
  }
  if (!PRIORIDADES_ACTIVIDAD.includes(dto.prioridad || 'Media')) {
    throw badRequest('La prioridad de actividad no es valida.');
  }
}

export function listarActividadesPlomeria() {
  return db
    .prepare('SELECT * FROM ActividadesPlomeria ORDER BY FechaCreacion DESC')
    .all()
    .map(toActividadPlomeriaResponse);
}

export function crearActividadPlomeria(dto) {
  validar(dto);
  const id = generarId('ACT');
  db.prepare(`
    INSERT INTO ActividadesPlomeria (
      Id, Tipo, Cliente, Ubicacion, Descripcion, Estado, Prioridad,
      NotasSeguimiento, NumeroAveriaVinculada, FechaCreacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    dto.tipo,
    textoRequerido(dto.cliente),
    textoRequerido(dto.ubicacion),
    textoRequerido(dto.descripcion),
    dto.estado,
    dto.prioridad || 'Media',
    textoOpcional(dto.notasSeguimiento),
    textoOpcional(dto.numeroAveriaVinculada)?.toUpperCase() ?? null,
    nowIso(),
  );
  return toActividadPlomeriaResponse(
    db.prepare('SELECT * FROM ActividadesPlomeria WHERE Id = ?').get(id),
  );
}

export function actualizarActividadPlomeria(id, dto) {
  validar(dto);
  const actividad = db.prepare('SELECT * FROM ActividadesPlomeria WHERE Id = ?').get(id);
  if (!actividad) return null;

  db.prepare(`
    UPDATE ActividadesPlomeria SET
      Tipo = ?, Cliente = ?, Ubicacion = ?, Descripcion = ?, Estado = ?, Prioridad = ?,
      NotasSeguimiento = ?, NumeroAveriaVinculada = ?, FechaActualizacion = ?
    WHERE Id = ?
  `).run(
    dto.tipo,
    textoRequerido(dto.cliente),
    textoRequerido(dto.ubicacion),
    textoRequerido(dto.descripcion),
    dto.estado,
    dto.prioridad || 'Media',
    textoOpcional(dto.notasSeguimiento),
    textoOpcional(dto.numeroAveriaVinculada)?.toUpperCase() ?? null,
    nowIso(),
    id,
  );

  return toActividadPlomeriaResponse(
    db.prepare('SELECT * FROM ActividadesPlomeria WHERE Id = ?').get(id),
  );
}

export function cambiarEstadoActividadPlomeria(id, estado) {
  const actividad = db.prepare('SELECT * FROM ActividadesPlomeria WHERE Id = ?').get(id);
  if (!actividad) return null;

  let nuevoEstado = siguienteEstadoActividad(actividad.Estado);
  if (textoOpcional(estado)) {
    if (!ESTADOS_ACTIVIDAD_PLOMERIA.includes(estado)) {
      throw badRequest('El estado de actividad no es valido.');
    }
    nuevoEstado = estado;
  }

  db.prepare(
    'UPDATE ActividadesPlomeria SET Estado = ?, FechaActualizacion = ? WHERE Id = ?',
  ).run(nuevoEstado, nowIso(), id);

  return toActividadPlomeriaResponse(
    db.prepare('SELECT * FROM ActividadesPlomeria WHERE Id = ?').get(id),
  );
}

export function eliminarActividadPlomeria(id) {
  const result = db.prepare('DELETE FROM ActividadesPlomeria WHERE Id = ?').run(id);
  return result.changes > 0;
}
