import { db } from '../../../shared/db.js';
import { Roles } from '../../../shared/utils/constants.js';

export function listarFontaneros() {
  return db
    .prepare('SELECT NombreUsuario AS usuario FROM Usuarios WHERE Rol = ? ORDER BY NombreUsuario')
    .all(Roles.Fontanero);
}
