import { db } from '../../../shared/db.js';

export function listarProyectos() {
  return db
    .prepare('SELECT * FROM Proyectos ORDER BY Id')
    .all()
    .map((item) => ({
      titulo: item.Titulo,
      descripcion: item.Descripcion,
      estado: item.Estado,
    }));
}
