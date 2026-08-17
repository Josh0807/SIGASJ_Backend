import { mountPrivateRoutes } from './privateRoutes.js';
import { mountPublicRoutes } from './publicRoutes.js';

export function mountAppRoutes(app) {
  mountPrivateRoutes(app);
  mountPublicRoutes(app);
}
