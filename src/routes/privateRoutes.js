import { Router } from 'express';
import fontaneroAdminRouter from '../features/fontanero/admin/routes.js';
import galleryAdminRouter from '../features/gallery/admin/routes.js';
import lecturasAdminRouter from '../features/lecturas/admin/routes.js';
import plomeriaAdminRouter from '../features/plomeria/admin/routes.js';
import transparenciaAdminRouter from '../features/transparencia/admin/routes.js';
import usuariosAdminRouter from '../features/usuarios/admin/routes.js';

export const PRIVATE_API_PREFIX = '/api';

const privateApiRouter = Router();

privateApiRouter.use('/admin/galeria', galleryAdminRouter);
privateApiRouter.use('/admin/transparencia', transparenciaAdminRouter);
privateApiRouter.use('/actividades-plomeria', plomeriaAdminRouter);
privateApiRouter.use('/usuarios', usuariosAdminRouter);
privateApiRouter.use('/actividades-fontanero', fontaneroAdminRouter);
privateApiRouter.use('/lecturas-medidor', lecturasAdminRouter);

export function mountPrivateRoutes(app) {
  app.use(PRIVATE_API_PREFIX, privateApiRouter);
}
