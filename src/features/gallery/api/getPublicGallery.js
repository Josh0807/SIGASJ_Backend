import { db } from '../../../shared/db.js';
import { toGaleriaResponse } from './types.js';

export function getPublicGallery() {
  const items = db
    .prepare('SELECT * FROM GaleriaFotos WHERE Activo = 1 ORDER BY OrdenVisualizacion, Id')
    .all()
    .map(toGaleriaResponse);
  return { data: items, total: items.length };
}
