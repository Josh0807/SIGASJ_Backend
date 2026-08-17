import { db } from '../../../shared/db.js';
import { toTransparenciaResponse } from './types.js';

export function getPublicTransparencia() {
  const items = db
    .prepare(
      'SELECT * FROM PublicacionesTransparencia WHERE Activo = 1 ORDER BY OrdenVisualizacion, Id',
    )
    .all()
    .map(toTransparenciaResponse);
  return { data: items, total: items.length };
}
