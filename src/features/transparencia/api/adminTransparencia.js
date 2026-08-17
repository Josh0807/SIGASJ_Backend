import { db } from '../../../shared/db.js';
import { badRequest, notFound } from '../../../shared/errors.js';
import { extensionFromFile, saveUpload, unlinkIfLocal } from '../../../shared/uploads.js';
import { parseBoolean, textoOpcional, textoRequerido } from '../../../shared/utils/helpers.js';
import { toTransparenciaResponse } from './types.js';

const TRANSPARENCIA_MIMES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

function tipoDesdeArchivo(file) {
  const ext = extensionFromFile(file, TRANSPARENCIA_MIMES);
  if (ext === 'jpeg') return 'jpg';
  return ext;
}

export function listAdminTransparencia({ nombre, activo } = {}) {
  let sql = 'SELECT * FROM PublicacionesTransparencia WHERE 1 = 1';
  const params = [];

  if (textoOpcional(nombre)) {
    sql += ' AND LOWER(Nombre) LIKE ?';
    params.push(`%${nombre.trim().toLowerCase()}%`);
  }

  if (activo !== undefined) {
    sql += ' AND Activo = ?';
    params.push(parseBoolean(activo, true) ? 1 : 0);
  }

  sql += ' ORDER BY OrdenVisualizacion, Id';
  return db.prepare(sql).all(...params).map(toTransparenciaResponse);
}

export function createAdminTransparencia(fields, file) {
  const nombre = textoRequerido(fields.nombre);
  const descripcionBreve = textoRequerido(fields.descripcionBreve);
  if (!nombre || !descripcionBreve) {
    throw badRequest('Nombre y descripcion breve son obligatorios.');
  }

  const result = db.prepare(`
    INSERT INTO PublicacionesTransparencia (
      Nombre, DescripcionBreve, ArchivoUrl, TipoArchivo, OrdenVisualizacion, Activo
    ) VALUES (?, ?, '', 'pdf', ?, ?)
  `).run(
    nombre,
    descripcionBreve,
    Number(fields.ordenVisualizacion) || 0,
    parseBoolean(fields.activo, true) ? 1 : 0,
  );

  const archivoUrl = saveUpload(
    'transparencia',
    result.lastInsertRowid,
    file,
    TRANSPARENCIA_MIMES,
    10 * 1024 * 1024,
    'Solo se permiten archivos PDF, JPG, JPEG o PNG.',
  );
  db.prepare(
    'UPDATE PublicacionesTransparencia SET ArchivoUrl = ?, TipoArchivo = ? WHERE Id = ?',
  ).run(archivoUrl, tipoDesdeArchivo(file), result.lastInsertRowid);

  return toTransparenciaResponse(
    db.prepare('SELECT * FROM PublicacionesTransparencia WHERE Id = ?').get(result.lastInsertRowid),
  );
}

export function updateAdminTransparencia(id, body) {
  const item = db.prepare('SELECT * FROM PublicacionesTransparencia WHERE Id = ?').get(id);
  if (!item) throw notFound('Publicación no encontrada.');

  db.prepare(`
    UPDATE PublicacionesTransparencia
    SET Nombre = ?, DescripcionBreve = ?, OrdenVisualizacion = ?, Activo = ?
    WHERE Id = ?
  `).run(
    textoOpcional(body.nombre) || item.Nombre,
    textoOpcional(body.descripcionBreve) || item.DescripcionBreve,
    body.ordenVisualizacion == null ? item.OrdenVisualizacion : Number(body.ordenVisualizacion),
    body.activo === undefined ? item.Activo : parseBoolean(body.activo, true) ? 1 : 0,
    id,
  );

  return toTransparenciaResponse(
    db.prepare('SELECT * FROM PublicacionesTransparencia WHERE Id = ?').get(id),
  );
}

export function updateAdminTransparenciaEstado(id, activo) {
  const item = db.prepare('SELECT * FROM PublicacionesTransparencia WHERE Id = ?').get(id);
  if (!item) throw notFound('Publicación no encontrada.');
  db.prepare('UPDATE PublicacionesTransparencia SET Activo = ? WHERE Id = ?').run(activo ? 1 : 0, id);
  return toTransparenciaResponse(
    db.prepare('SELECT * FROM PublicacionesTransparencia WHERE Id = ?').get(id),
  );
}

export function replaceAdminTransparenciaFile(id, file) {
  const item = db.prepare('SELECT * FROM PublicacionesTransparencia WHERE Id = ?').get(id);
  if (!item) throw notFound('Publicación no encontrada.');
  unlinkIfLocal(item.ArchivoUrl);
  const archivoUrl = saveUpload(
    'transparencia',
    id,
    file,
    TRANSPARENCIA_MIMES,
    10 * 1024 * 1024,
    'Solo se permiten archivos PDF, JPG, JPEG o PNG.',
  );
  db.prepare(
    'UPDATE PublicacionesTransparencia SET ArchivoUrl = ?, TipoArchivo = ? WHERE Id = ?',
  ).run(archivoUrl, tipoDesdeArchivo(file), id);
  return toTransparenciaResponse(
    db.prepare('SELECT * FROM PublicacionesTransparencia WHERE Id = ?').get(id),
  );
}

export function reorderAdminTransparencia(publicaciones = []) {
  const update = db.prepare(
    'UPDATE PublicacionesTransparencia SET OrdenVisualizacion = ? WHERE Id = ?',
  );
  const tx = db.transaction((items) => {
    for (const item of items) {
      update.run(item.ordenVisualizacion, item.idPublicacionTransparencia ?? item.id);
    }
  });
  tx(publicaciones);
  return listAdminTransparencia();
}

export function deleteAdminTransparencia(id) {
  const item = db.prepare('SELECT * FROM PublicacionesTransparencia WHERE Id = ?').get(id);
  if (!item) throw notFound('Publicación no encontrada.');
  unlinkIfLocal(item.ArchivoUrl);
  db.prepare('DELETE FROM PublicacionesTransparencia WHERE Id = ?').run(id);
}
