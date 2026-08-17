import { Router } from 'express';
import { notFound } from '../../../shared/errors.js';
import { requireAuth } from '../../../shared/middleware/auth.js';
import { Roles } from '../../../shared/utils/constants.js';
import {
  actualizarActividadFontanero,
  crearActividadFontanero,
  listarActividadesFontanero,
  listarActividadesPorFontanero,
  validarActividadFontanero,
} from '../api/actividadService.js';

const router = Router();

router.get('/', requireAuth(Roles.Admin), (_req, res) => {
  res.json(listarActividadesFontanero());
});

router.get('/mis-actividades', requireAuth(Roles.Fontanero), (req, res) => {
  res.json(listarActividadesPorFontanero(req.usuario.Id));
});

router.post('/', requireAuth(Roles.Fontanero), (req, res) => {
  res.status(201).json(crearActividadFontanero(req.body || {}, req.usuario.Id));
});

router.put('/:id', requireAuth(Roles.Fontanero), (req, res) => {
  const actividad = actualizarActividadFontanero(req.params.id, req.body || {}, req.usuario.Id);
  if (!actividad) throw notFound('Actividad no encontrada.');
  res.json(actividad);
});

router.patch('/:id/validar', requireAuth(Roles.Admin), (req, res) => {
  const actividad = validarActividadFontanero(req.params.id, req.body || {});
  if (!actividad) throw notFound('Actividad no encontrada.');
  res.json(actividad);
});

export default router;
