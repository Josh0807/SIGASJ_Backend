import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { FotografiaGaleria } from '../LandingPage/galeria/entities/fotografia-galeria.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'sigasj',
  entities: [Usuario, FotografiaGaleria],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
});
