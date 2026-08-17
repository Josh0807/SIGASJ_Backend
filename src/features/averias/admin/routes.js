import { Router } from 'express';
import { db } from '../../../shared/db.js';
import { badRequest, forbidden, notFound } from '../../../shared/errors.js';
import { requireAuth } from '../../../shared/middleware/auth.js';
import { Roles } from '../../../shared/utils/constants.js';
import { textoRequerido } from '../../../shared/utils/helpers.js';
import {
  actualizarAtencionFontanero,
  actualizarEstadoAveria,
  actualizarObservacionesAdmin,
  actualizarPrioridadAveria,
  asignarFontaneroAveria,
  buscarAveria,
  listarAverias,
  listarAveriasAsignadas,
  obtenerHistorialAveria,
} from '../api/averiaService.js';

const router = Router();

router.get('/gestion', requireAuth(Roles.Admin), (_req, res) => {
  res.json(listarAverias());
});

router.get('/asignadas', requireAuth(Roles.Fontanero), (req, res) => {
  res.json(listarAveriasAsignadas(req.usuario.Id));
});

router.get('/:numeroSeguimiento/historial', requireAuth(Roles.Admin), (req, res) => {
  res.json(obtenerHistorialAveria(req.params.numeroSeguimiento));
});

router.patch('/:numeroSeguimiento/estado', requireAuth(Roles.Admin), (req, res) => {
  const resultado = actualizarEstadoAveria(
    req.params.numeroSeguimiento,
    req.body?.estado,
    req.usuario.NombreUsuario,
  );
  if (!resultado) throw notFound('Reporte no encontrado.');
  res.json(resultado);
});

router.patch('/:numeroSeguimiento/asignar-fontanero', requireAuth(Roles.Admin), (req, res) => {
  const nombre = textoRequerido(req.body?.fontanero);
  if (!nombre) throw badRequest('El fontanero es obligatorio.');

  const fontanero = db
    .prepare('SELECT * FROM Usuarios WHERE NombreUsuario = ? AND Rol = ?')
    .get(nombre, Roles.Fontanero);
  if (!fontanero) throw badRequest('Fontanero no encontrado.');

  const resultado = asignarFontaneroAveria(
    req.params.numeroSeguimiento,
    fontanero.Id,
    req.usuario.NombreUsuario,
    true,
  );
  if (!resultado) throw notFound('Reporte no encontrado.');
  res.json(resultado);
});

router.patch('/:numeroSeguimiento/prioridad', requireAuth(Roles.Admin), (req, res) => {
  const resultado = actualizarPrioridadAveria(
    req.params.numeroSeguimiento,
    req.body?.prioridad,
    req.usuario.NombreUsuario,
  );
  if (!resultado) throw notFound('Reporte no encontrado.');
  res.json(resultado);
});

router.patch('/:numeroSeguimiento/observaciones-admin', requireAuth(Roles.Admin), (req, res) => {
  const resultado = actualizarObservacionesAdmin(
    req.params.numeroSeguimiento,
    req.body?.observacionesAdmin,
    req.usuario.NombreUsuario,
  );
  if (!resultado) throw notFound('Reporte no encontrado.');
  res.json(resultado);
});

router.patch('/:numeroSeguimiento/atencion-fontanero', requireAuth(Roles.Fontanero), (req, res) => {
  const reporte = buscarAveria(req.params.numeroSeguimiento);
  if (!reporte) throw notFound('Reporte no encontrado.');
  if (reporte.FontaneroAsignadoId !== req.usuario.Id) {
    throw forbidden('Solo puede atender averias asignadas a usted.');
  }
  res.json(
    actualizarAtencionFontanero(req.params.numeroSeguimiento, req.body || {}, req.usuario.NombreUsuario),
  );
});

export default router;
