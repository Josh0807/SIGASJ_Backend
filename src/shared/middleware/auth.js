import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db.js';
import { forbidden, unauthorized } from '../errors.js';
import { Roles } from '../utils/constants.js';

export function normalizarRol(rol) {
  const value = String(rol || '').trim().toLowerCase();
  if (value === 'administradora' || value === 'administrador' || value === 'admin') {
    return Roles.Admin;
  }
  if (value === 'fontanero') return Roles.Fontanero;
  return value;
}

export function generarToken(usuario) {
  return jwt.sign(
    {
      sub: String(usuario.Id),
      usuario: usuario.NombreUsuario,
      name: usuario.NombreUsuario,
      rol: usuario.Rol,
      role: usuario.Rol,
    },
    config.jwt.secret,
    {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      expiresIn: `${config.jwt.expirationHours}h`,
    },
  );
}

export function obtenerUsuarioDesdeToken(payload) {
  const id = Number(payload.sub);
  if (Number.isInteger(id)) {
    const byId = db.prepare('SELECT * FROM Usuarios WHERE Id = ?').get(id);
    if (byId) return byId;
  }

  const nombre = payload.usuario || payload.name;
  if (!nombre) return null;
  return db.prepare('SELECT * FROM Usuarios WHERE NombreUsuario = ?').get(nombre);
}

export function requireAuth(...rolesPermitidos) {
  const allowed = rolesPermitidos.map(normalizarRol);

  return (req, _res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(unauthorized());
    }

    try {
      const payload = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      });
      const usuario = obtenerUsuarioDesdeToken(payload);
      if (!usuario) {
        return next(unauthorized());
      }

      const rol = normalizarRol(usuario.Rol || payload.rol || payload.role);
      if (allowed.length && !allowed.includes(rol)) {
        return next(forbidden('No tiene permisos para esta operacion.'));
      }

      req.auth = payload;
      req.usuario = { ...usuario, Rol: rol };
      next();
    } catch {
      next(unauthorized());
    }
  };
}
