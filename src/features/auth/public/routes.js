import { Router } from 'express';
import { emitirDevToken, login } from '../api/authService.js';

const router = Router();

router.post('/login', (req, res) => {
  res.json(login(req.body || {}));
});

router.post('/dev-token', (req, res) => {
  res.json(emitirDevToken(req.body || {}));
});

export default router;
