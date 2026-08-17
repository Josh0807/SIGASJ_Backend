import { Router } from 'express';
import adminRoutes from './admin/routes.js';
import publicRoutes from './public/routes.js';

const router = Router();
router.use(adminRoutes);
router.use(publicRoutes);

export default router;
