import express from 'express';
import cors from 'cors';
import { config } from './shared/config.js';
import { errorHandler, notFoundHandler } from './shared/middleware/error.js';
import { mountAppRoutes } from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use(express.json({ limit: '15mb' }));
  app.use('/uploads', express.static(config.uploadsDir));

  mountAppRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
