import bcrypt from 'bcryptjs';
import { db } from '../../../shared/db.js';
import { badRequest, unauthorized } from '../../../shared/errors.js';
import { generarToken, normalizarRol } from '../../../shared/middleware/auth.js';
import { Roles } from '../../../shared/utils/constants.js';
import { textoRequerido } from '../../../shared/utils/helpers.js';

export function login({ usuario, contrasena }) {
  const nombre = textoRequerido(usuario).toLowerCase();
  const password = textoRequerido(contrasena);

  if (!nombre || !password) {
    throw badRequest('Datos de entrada invalidos.', {
      ...(nombre ? {} : { usuario: ['El usuario es obligatorio.'] }),
      ...(password ? {} : { contrasena: ['La contrasena es obligatoria.'] }),
    });
  }

  const found = db.prepare('SELECT * FROM Usuarios WHERE NombreUsuario = ?').get(nombre);
  if (!found || !bcrypt.compareSync(password, found.ContrasenaHash)) {
    throw unauthorized('Usuario o contrasena incorrectos.');
  }

  return {
    token: generarToken(found),
    usuario: found.NombreUsuario,
    rol: found.Rol,
    mensaje: 'Sesion iniciada correctamente.',
  };
}

export function emitirDevToken({ rol } = {}) {
  const requested = normalizarRol(rol || Roles.Admin);
  const usuario = db
    .prepare('SELECT * FROM Usuarios WHERE Rol = ? ORDER BY Id LIMIT 1')
    .get(requested);

  if (!usuario) {
    throw unauthorized('No hay un usuario disponible para el rol solicitado.');
  }

  return {
    accessToken: generarToken(usuario),
    tokenType: 'Bearer',
    rol: requested === Roles.Admin ? 'Administradora' : usuario.Rol,
    idUsuario: usuario.Id,
  };
}
