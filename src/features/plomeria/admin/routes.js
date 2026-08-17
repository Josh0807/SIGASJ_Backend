import { Router } from 'express';
import { notFound } from '../../../shared/errors.js';
import { requireAuth } from '../../../shared/middleware/auth.js';
import { Roles } from '../../../shared/utils/constants.js';
import {
  actualizarActividadPlomeria,
  cambiarEstadoActividadPlomeria,
  crearActividadPlomeria,
  eliminarActividadPlomeria,
  listarActividadesPlomeria,
} from '../api/plomeriaService.js';

const router = Router();
router.use(requireAuth(Roles.Admin));

router.get('/', (_req, res) => {
  res.json(listarActividadesPlomeria());
});

router.post('/', (req, res) => {
  res.status(201).json(crearActividadPlomeria(req.body || {}));
});

router.get('/:id', (req, res) => {
  const actividad = listarActividadesPlomeria().find((item) => item.id === req.params.id);
  if (!actividad) throw notFound('Actividad no encontrada.');
  res.json(actividad);
});

router.put('/:id', (req, res) => {
  const actividad = actualizarActividadPlomeria(req.params.id, req.body || {});
  if (!actividad) throw notFound('Actividad no encontrada.');
  res.json(actividad);
});

router.patch('/:id/estado', (req, res) => {
  const actividad = cambiarEstadoActividadPlomeria(req.params.id, req.body?.estado);
  if (!actividad) throw notFound('Actividad no encontrada.');
  res.json(actividad);
});

router.delete('/:id', (req, res) => {
  if (!eliminarActividadPlomeria(req.params.id)) {
    throw notFound('Actividad no encontrada.');
  }
  res.status(204).end();
});

export default router;
