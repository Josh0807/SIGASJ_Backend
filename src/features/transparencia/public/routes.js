import { Router } from 'express';
import { getPublicTransparencia } from '../api/getPublicTransparencia.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(getPublicTransparencia());
});

export default router;
