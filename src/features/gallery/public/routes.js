import { Router } from 'express';
import { getPublicGallery } from '../api/getPublicGallery.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(getPublicGallery());
});

export default router;
