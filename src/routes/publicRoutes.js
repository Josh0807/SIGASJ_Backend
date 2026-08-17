import { Router } from 'express';
import {
  comunicadosRouter,
  publicAnnouncementsRouter,
} from '../features/announcements/public/routes.js';
import authRouter from '../features/auth/public/routes.js';
import averiasRouter from '../features/averias/routes.js';
import galleryPublicRouter from '../features/gallery/public/routes.js';
import landingPublicRouter from '../features/landing/public/routes.js';
import seguimientoPublicRouter from '../features/seguimiento/public/routes.js';
import solicitudesPublicRouter from '../features/solicitudes/public/routes.js';
import transparenciaPublicRouter from '../features/transparencia/public/routes.js';

export const PUBLIC_API_PREFIX = '/api';

const publicApiRouter = Router();

publicApiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    servicio: 'SIGASJ API',
    fecha: new Date().toISOString(),
  });
});

publicApiRouter.use('/auth', authRouter);
publicApiRouter.use('/public/comunicados', publicAnnouncementsRouter);
publicApiRouter.use('/public/galeria', galleryPublicRouter);
publicApiRouter.use('/public/transparencia', transparenciaPublicRouter);
publicApiRouter.use('/comunicados', comunicadosRouter);
publicApiRouter.use('/proyectos', landingPublicRouter);
publicApiRouter.use('/solicitudes', solicitudesPublicRouter);
publicApiRouter.use('/seguimiento', seguimientoPublicRouter);
publicApiRouter.use('/averias', averiasRouter);

export function mountPublicRoutes(app) {
  app.use(PUBLIC_API_PREFIX, publicApiRouter);
}
