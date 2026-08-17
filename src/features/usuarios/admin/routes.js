import { Router } from 'express';
import { requireAuth } from '../../../shared/middleware/auth.js';
import { Roles } from '../../../shared/utils/constants.js';
import { listarFontaneros } from '../api/usuariosService.js';

const router = Router();

router.get('/fontaneros', requireAuth(Roles.Admin), (_req, res) => {
  res.json(listarFontaneros());
});

export default router;
