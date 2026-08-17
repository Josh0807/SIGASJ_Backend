import { db } from '../../../shared/db.js';
import { badRequest, notFound } from '../../../shared/errors.js';
import {
  ESTADOS_AVERIA_FONTANERO,
  PRIORIDADES_AVERIA,
  Roles,
  TIPOS_AVERIA,
  esEstadoAveriaAdmin,
  normalizarEstadoAveria,
} from '../../../shared/utils/constants.js';
import { nowIso, textoOpcional, textoRequerido } from '../../../shared/utils/helpers.js';
import { generarNumero } from '../../../shared/utils/secuencia.js';
import { toAveriaResponse, toHistorialResponse } from './types.js';

const AVERIA_SELECT = `
  SELECT a.*, u.NombreUsuario AS FontaneroNombre
  FROM Averias a
  LEFT JOIN Usuarios u ON u.Id = a.FontaneroAsignadoId
`;

export function buscarAveria(numeroSeguimiento) {
  return db
    .prepare(`${AVERIA_SELECT} WHERE UPPER(a.NumeroSeguimiento) = UPPER(?)`)
    .get(textoRequerido(numeroSeguimiento));
}

function registrarHistorial(averiaId, accion, valorAnterior, valorNuevo, usuario) {
  db.prepare(`
    INSERT INTO AveriasHistorial (AveriaId, Accion, ValorAnterior, ValorNuevo, Usuario, Fecha)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(averiaId, accion, valorAnterior ?? null, valorNuevo ?? null, usuario ?? null, nowIso());
}

export function crearAveria(dto) {
  const tipo = textoRequerido(dto.tipo);
  if (!TIPOS_AVERIA.includes(tipo)) {
    throw badRequest('El tipo de averia seleccionado no es valido.');
  }

  const numeroSeguimiento = generarNumero('AV');
  db.prepare(`
    INSERT INTO Averias (
      NumeroSeguimiento, Nombre, Telefono, Correo, Direccion, Tipo, Descripcion,
      Estado, Prioridad, FechaCreacion, FotoNombre, FotoBase64
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendiente', 'Media', ?, ?, ?)
  `).run(
    numeroSeguimiento,
    textoRequerido(dto.nombre),
    textoRequerido(dto.telefono),
    textoOpcional(dto.correo),
    textoRequerido(dto.direccion),
    tipo,
    textoRequerido(dto.descripcion),
    nowIso(),
    textoOpcional(dto.fotoNombre),
    textoOpcional(dto.fotoBase64),
  );

  const created = buscarAveria(numeroSeguimiento);
  registrarHistorial(created.Id, 'Creacion', null, 'Pendiente', 'Portal publico');

  return {
    numeroSeguimiento,
    mensaje: `Su reporte fue registrado correctamente. Numero de seguimiento: ${numeroSeguimiento}. Estado: Pendiente.`,
  };
}

export function listarAverias() {
  return db
    .prepare(`${AVERIA_SELECT} ORDER BY a.FechaCreacion DESC`)
    .all()
    .map(toAveriaResponse);
}

export function listarAveriasAsignadas(fontaneroId) {
  return db
    .prepare(`${AVERIA_SELECT} WHERE a.FontaneroAsignadoId = ? ORDER BY a.FechaCreacion DESC`)
    .all(fontaneroId)
    .map(toAveriaResponse);
}

export function obtenerHistorialAveria(numeroSeguimiento) {
  const averia = buscarAveria(numeroSeguimiento);
  if (!averia) return [];
  return db
    .prepare('SELECT * FROM AveriasHistorial WHERE AveriaId = ? ORDER BY Fecha DESC')
    .all(averia.Id)
    .map(toHistorialResponse);
}

export function obtenerAveriaPorNumero(numeroSeguimiento) {
  const averia = buscarAveria(numeroSeguimiento);
  return averia ? toAveriaResponse(averia) : null;
}

export function actualizarEstadoAveria(numeroSeguimiento, estado, usuario) {
  const estadoNormalizado = normalizarEstadoAveria(textoRequerido(estado));
  if (!esEstadoAveriaAdmin(estadoNormalizado)) {
    throw badRequest('El estado del reporte no es valido.');
  }

  const averia = buscarAveria(numeroSeguimiento);
  if (!averia) return null;

  db.prepare(
    'UPDATE Averias SET Estado = ?, FechaUltimaActualizacion = ? WHERE Id = ?',
  ).run(estadoNormalizado, nowIso(), averia.Id);
  registrarHistorial(averia.Id, 'Estado', averia.Estado, estadoNormalizado, usuario);
  return toAveriaResponse(buscarAveria(numeroSeguimiento));
}

export function asignarFontaneroAveria(numeroSeguimiento, fontaneroId, usuario, forzarAsignacion) {
  const averia = buscarAveria(numeroSeguimiento);
  if (!averia) return null;

  const fontanero = db.prepare('SELECT * FROM Usuarios WHERE Id = ?').get(fontaneroId);
  if (!fontanero || fontanero.Rol !== Roles.Fontanero) {
    throw badRequest('El fontanero indicado no es valido.');
  }

  if (
    averia.FontaneroAsignadoId != null &&
    averia.FontaneroAsignadoId !== fontaneroId &&
    !forzarAsignacion
  ) {
    throw badRequest('Este reporte ya esta asignado a otro fontanero.');
  }

  const nuevoEstado =
    averia.Estado === 'Pendiente' || averia.Estado === 'En revision'
      ? 'Asignada'
      : averia.Estado;

  db.prepare(
    'UPDATE Averias SET FontaneroAsignadoId = ?, Estado = ?, FechaUltimaActualizacion = ? WHERE Id = ?',
  ).run(fontaneroId, nuevoEstado, nowIso(), averia.Id);
  registrarHistorial(averia.Id, 'Asignacion', averia.FontaneroNombre, fontanero.NombreUsuario, usuario);
  return toAveriaResponse(buscarAveria(numeroSeguimiento));
}

export function actualizarPrioridadAveria(numeroSeguimiento, prioridad, usuario) {
  if (!PRIORIDADES_AVERIA.includes(prioridad)) {
    throw badRequest('La prioridad no es valida.');
  }

  const averia = buscarAveria(numeroSeguimiento);
  if (!averia) return null;

  db.prepare(
    'UPDATE Averias SET Prioridad = ?, FechaUltimaActualizacion = ? WHERE Id = ?',
  ).run(prioridad, nowIso(), averia.Id);
  registrarHistorial(averia.Id, 'Prioridad', averia.Prioridad, prioridad, usuario);
  return toAveriaResponse(buscarAveria(numeroSeguimiento));
}

export function actualizarObservacionesAdmin(numeroSeguimiento, observaciones, usuario) {
  const averia = buscarAveria(numeroSeguimiento);
  if (!averia) return null;

  const valor = textoOpcional(observaciones);
  db.prepare(
    'UPDATE Averias SET ObservacionesAdmin = ?, FechaUltimaActualizacion = ? WHERE Id = ?',
  ).run(valor, nowIso(), averia.Id);
  registrarHistorial(averia.Id, 'Observaciones admin', averia.ObservacionesAdmin, valor, usuario);
  return toAveriaResponse(buscarAveria(numeroSeguimiento));
}

export function actualizarAtencionFontanero(numeroSeguimiento, dto, usuario) {
  const averia = buscarAveria(numeroSeguimiento);
  if (!averia) throw notFound('Reporte no encontrado.');

  const descripcionTrabajo = textoOpcional(dto.descripcionTrabajo) ?? averia.DescripcionTrabajo;
  const materiales = textoOpcional(dto.materialesUtilizados) ?? averia.MaterialesUtilizados;
  const notas =
    dto.notasAtencion === undefined ? averia.NotasAtencion : textoOpcional(dto.notasAtencion);
  const evidenciaNombre = textoOpcional(dto.evidenciaBase64)
    ? dto.evidenciaNombre
    : averia.EvidenciaTrabajoNombre;
  const evidenciaBase64 = textoOpcional(dto.evidenciaBase64) ?? averia.EvidenciaTrabajoBase64;
  let estado = averia.Estado;

  if (textoOpcional(dto.estado)) {
    estado = normalizarEstadoAveria(dto.estado);
    if (!ESTADOS_AVERIA_FONTANERO.includes(estado)) {
      throw badRequest('El estado no es valido para el fontanero.');
    }
    registrarHistorial(averia.Id, 'Estado fontanero', averia.Estado, estado, usuario);
  }

  db.prepare(`
    UPDATE Averias SET
      DescripcionTrabajo = ?,
      MaterialesUtilizados = ?,
      NotasAtencion = ?,
      EvidenciaTrabajoNombre = ?,
      EvidenciaTrabajoBase64 = ?,
      Estado = ?,
      FechaUltimaActualizacion = ?
    WHERE Id = ?
  `).run(
    descripcionTrabajo,
    materiales,
    notas,
    evidenciaNombre,
    evidenciaBase64,
    estado,
    nowIso(),
    averia.Id,
  );

  return toAveriaResponse(buscarAveria(numeroSeguimiento));
}
