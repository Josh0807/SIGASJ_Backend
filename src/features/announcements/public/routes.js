import { Router } from 'express';
import { getPublicAnnouncements, listarComunicados } from '../api/getPublicAnnouncements.js';

export const publicAnnouncementsRouter = Router();
export const comunicadosRouter = Router();

publicAnnouncementsRouter.get('/', (_req, res) => {
  res.json(getPublicAnnouncements());
});

comunicadosRouter.get('/', (_req, res) => {
  res.json(listarComunicados());
});
