import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../../shared/middleware/auth.js';
import { Roles } from '../../../shared/utils/constants.js';
import {
  createAdminGallery,
  deleteAdminGallery,
  listAdminGallery,
  reorderAdminGallery,
  replaceAdminGalleryImage,
  updateAdminGallery,
  updateAdminGalleryEstado,
} from '../api/adminGallery.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.use(requireAuth(Roles.Admin));

router.get('/', (req, res) => {
  res.json(listAdminGallery(req.query));
});

router.post('/', upload.single('imagen'), (req, res) => {
  res.status(201).json(createAdminGallery(req.body || {}, req.file));
});

router.patch('/orden', (req, res) => {
  res.json(reorderAdminGallery(req.body?.fotografias || []));
});

router.put('/:id', (req, res) => {
  res.json(updateAdminGallery(Number(req.params.id), req.body || {}));
});

router.patch('/:id/estado', (req, res) => {
  res.json(updateAdminGalleryEstado(Number(req.params.id), req.body?.activo));
});

router.patch('/:id/imagen', upload.single('imagen'), (req, res) => {
  res.json(replaceAdminGalleryImage(Number(req.params.id), req.file));
});

router.delete('/:id', (req, res) => {
  deleteAdminGallery(Number(req.params.id));
  res.status(204).end();
});

export default router;
