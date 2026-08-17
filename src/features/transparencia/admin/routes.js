import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../../shared/middleware/auth.js';
import { Roles } from '../../../shared/utils/constants.js';
import {
  createAdminTransparencia,
  deleteAdminTransparencia,
  listAdminTransparencia,
  reorderAdminTransparencia,
  replaceAdminTransparenciaFile,
  updateAdminTransparencia,
  updateAdminTransparenciaEstado,
} from '../api/adminTransparencia.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.use(requireAuth(Roles.Admin));

router.get('/', (req, res) => {
  res.json(listAdminTransparencia(req.query));
});

router.post('/', upload.single('archivo'), (req, res) => {
  res.status(201).json(createAdminTransparencia(req.body || {}, req.file));
});

router.patch('/orden', (req, res) => {
  res.json(reorderAdminTransparencia(req.body?.publicaciones || []));
});

router.put('/:id', (req, res) => {
  res.json(updateAdminTransparencia(Number(req.params.id), req.body || {}));
});

router.patch('/:id/estado', (req, res) => {
  res.json(updateAdminTransparenciaEstado(Number(req.params.id), req.body?.activo));
});

router.patch('/:id/archivo', upload.single('archivo'), (req, res) => {
  res.json(replaceAdminTransparenciaFile(Number(req.params.id), req.file));
});

router.delete('/:id', (req, res) => {
  deleteAdminTransparencia(Number(req.params.id));
  res.status(204).end();
});

export default router;
