import { Router } from 'express';
import { getPublicAnnouncements } from '../api/getPublicAnnouncements.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(getPublicAnnouncements());
});

export default router;
