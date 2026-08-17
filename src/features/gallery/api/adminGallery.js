import { db } from '../../../shared/db.js';
import { badRequest, notFound } from '../../../shared/errors.js';
import { saveUpload, unlinkIfLocal } from '../../../shared/uploads.js';
import { parseBoolean, textoOpcional, textoRequerido } from '../../../shared/utils/helpers.js';
import { toGaleriaResponse } from './types.js';

const GALLERY_MIMES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function listAdminGallery({ titulo, activo } = {}) {
  let sql = 'SELECT * FROM GaleriaFotos WHERE 1 = 1';
  const params = [];

  if (textoOpcional(titulo)) {
    sql += " AND LOWER(COALESCE(Titulo, '')) LIKE ?";
    params.push(`%${titulo.trim().toLowerCase()}%`);
  }

  if (activo !== undefined) {
    sql += ' AND Activo = ?';
    params.push(parseBoolean(activo, true) ? 1 : 0);
  }

  sql += ' ORDER BY OrdenVisualizacion, Id';
  return db.prepare(sql).all(...params).map(toGaleriaResponse);
}

export function createAdminGallery(fields, file) {
  const textoAlternativo = textoRequerido(fields.textoAlternativo);
  if (!textoAlternativo) throw badRequest('El texto alternativo es obligatorio.');

  const result = db.prepare(`
    INSERT INTO GaleriaFotos (Titulo, Descripcion, ImagenUrl, TextoAlternativo, OrdenVisualizacion, Activo)
    VALUES (?, ?, '', ?, ?, ?)
  `).run(
    textoOpcional(fields.titulo),
    textoOpcional(fields.descripcion),
    textoAlternativo,
    Number(fields.ordenVisualizacion) || 0,
    parseBoolean(fields.activo, true) ? 1 : 0,
  );

  const imagenUrl = saveUpload(
    'galeria',
    result.lastInsertRowid,
    file,
    GALLERY_MIMES,
    5 * 1024 * 1024,
    'Solo se permiten imágenes JPG, PNG o WebP.',
  );
  db.prepare('UPDATE GaleriaFotos SET ImagenUrl = ? WHERE Id = ?').run(
    imagenUrl,
    result.lastInsertRowid,
  );

  return toGaleriaResponse(
    db.prepare('SELECT * FROM GaleriaFotos WHERE Id = ?').get(result.lastInsertRowid),
  );
}

export function updateAdminGallery(id, body) {
  const foto = db.prepare('SELECT * FROM GaleriaFotos WHERE Id = ?').get(id);
  if (!foto) throw notFound('Fotografía no encontrada.');

  db.prepare(`
    UPDATE GaleriaFotos
    SET Titulo = ?, Descripcion = ?, TextoAlternativo = ?, OrdenVisualizacion = ?, Activo = ?
    WHERE Id = ?
  `).run(
    body.titulo === undefined ? foto.Titulo : textoOpcional(body.titulo),
    body.descripcion === undefined ? foto.Descripcion : textoOpcional(body.descripcion),
    textoOpcional(body.textoAlternativo) || foto.TextoAlternativo,
    body.ordenVisualizacion == null ? foto.OrdenVisualizacion : Number(body.ordenVisualizacion),
    body.activo === undefined ? foto.Activo : parseBoolean(body.activo, true) ? 1 : 0,
    id,
  );

  return toGaleriaResponse(db.prepare('SELECT * FROM GaleriaFotos WHERE Id = ?').get(id));
}

export function updateAdminGalleryEstado(id, activo) {
  const foto = db.prepare('SELECT * FROM GaleriaFotos WHERE Id = ?').get(id);
  if (!foto) throw notFound('Fotografía no encontrada.');
  db.prepare('UPDATE GaleriaFotos SET Activo = ? WHERE Id = ?').run(activo ? 1 : 0, id);
  return toGaleriaResponse(db.prepare('SELECT * FROM GaleriaFotos WHERE Id = ?').get(id));
}

export function replaceAdminGalleryImage(id, file) {
  const foto = db.prepare('SELECT * FROM GaleriaFotos WHERE Id = ?').get(id);
  if (!foto) throw notFound('Fotografía no encontrada.');
  unlinkIfLocal(foto.ImagenUrl);
  const imagenUrl = saveUpload(
    'galeria',
    id,
    file,
    GALLERY_MIMES,
    5 * 1024 * 1024,
    'Solo se permiten imágenes JPG, PNG o WebP.',
  );
  db.prepare('UPDATE GaleriaFotos SET ImagenUrl = ? WHERE Id = ?').run(imagenUrl, id);
  return toGaleriaResponse(db.prepare('SELECT * FROM GaleriaFotos WHERE Id = ?').get(id));
}

export function reorderAdminGallery(fotografias = []) {
  const update = db.prepare('UPDATE GaleriaFotos SET OrdenVisualizacion = ? WHERE Id = ?');
  const tx = db.transaction((items) => {
    for (const item of items) {
      update.run(item.ordenVisualizacion, item.idFotografiaGaleria ?? item.id);
    }
  });
  tx(fotografias);
  return listAdminGallery();
}

export function deleteAdminGallery(id) {
  const foto = db.prepare('SELECT * FROM GaleriaFotos WHERE Id = ?').get(id);
  if (!foto) throw notFound('Fotografía no encontrada.');
  unlinkIfLocal(foto.ImagenUrl);
  db.prepare('DELETE FROM GaleriaFotos WHERE Id = ?').run(id);
}
