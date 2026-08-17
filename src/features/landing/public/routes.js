import { Router } from 'express';
import { listarProyectos } from '../api/proyectosService.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(listarProyectos());
});

export default router;
