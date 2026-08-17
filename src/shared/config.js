import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(rootDir, '.env') });

function parseOrigins(value) {
  return (value || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  rootDir,
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: path.resolve(rootDir, process.env.DATABASE_PATH || 'sigasj.db'),
  uploadsDir: path.join(rootDir, 'uploads'),
  jwt: {
    secret: process.env.JWT_SECRET || 'SIGASJ-SuperSecretKey-ChangeInProduction-Min32Chars!',
    issuer: process.env.JWT_ISSUER || 'SIGASJ',
    audience: process.env.JWT_AUDIENCE || 'SIGASJ-Frontend',
    expirationHours: Number(process.env.JWT_EXPIRATION_HOURS) || 8,
  },
  admin: {
    usuario: (process.env.ADMIN_USUARIO || 'admin').trim().toLowerCase(),
    contrasena: process.env.ADMIN_CONTRASENA || 'admin1234',
  },
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
};
