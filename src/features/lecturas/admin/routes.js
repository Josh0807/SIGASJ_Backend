import { Router } from 'express';
import { notFound } from '../../../shared/errors.js';
import { requireAuth } from '../../../shared/middleware/auth.js';
import { Roles } from '../../../shared/utils/constants.js';
import {
  actualizarLectura,
  crearLectura,
  historialLecturasPorMedidor,
  listarLecturas,
  listarLecturasPorFontanero,
} from '../api/lecturaService.js';

const router = Router();

router.get('/', requireAuth(Roles.Admin), (_req, res) => {
  res.json(listarLecturas());
});

router.get('/mis-lecturas', requireAuth(Roles.Fontanero), (req, res) => {
  res.json(listarLecturasPorFontanero(req.usuario.Id));
});

router.get('/historial/:numeroMedidor', requireAuth(Roles.Admin), (req, res) => {
  res.json(historialLecturasPorMedidor(req.params.numeroMedidor));
});

router.post('/', requireAuth(Roles.Fontanero), (req, res) => {
  res.status(201).json(crearLectura(req.body || {}, req.usuario.Id));
});

router.patch('/:id', requireAuth(Roles.Admin, Roles.Fontanero), (req, res) => {
  const lectura = actualizarLectura(
    Number(req.params.id),
    req.body || {},
    req.usuario.Rol,
    req.usuario.Id,
  );
  if (!lectura) throw notFound('Lectura no encontrada.');
  res.json(lectura);
});

export default router;
