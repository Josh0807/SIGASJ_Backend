import { db } from '../../../shared/db.js';

export function getPublicAnnouncements() {
  return db
    .prepare('SELECT * FROM Comunicados ORDER BY Id DESC')
    .all()
    .map((item) => ({
      id: item.Id,
      titulo: item.Titulo,
      descripcion: item.Descripcion,
      fechaPublicacion: item.Fecha,
      tipo: item.Estado,
    }));
}
