import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { Comunicado } from '../LandingPage/comunicados/entities/comunicado.entity';
import { FotografiaGaleria } from '../LandingPage/galeria/entities/fotografia-galeria.entity';
import { PublicacionTransparencia } from '../LandingPage/transparencia/entities/publicacion-transparencia.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

loadEnv();

/**
 * DataSource CLI de TypeORM (migraciones).
 * Alineado con database.config.ts — SQL Server / LocalDB.
 * No hay naming strategy custom en el proyecto.
 */
const isWindowsAuth =
  (process.env.DB_AUTH || 'sql').toLowerCase() === 'windows';

// Driver ODBC Windows Auth (misma razón que database.config.ts).
let msnodesqlv8Driver: object | undefined;
if (isWindowsAuth) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  msnodesqlv8Driver = require('mssql/msnodesqlv8') as object;
}

const buildWindowsConnectionString = (): string => {
  const server = process.env.DB_HOST || '(localdb)\\MSSQLLocalDB';
  const database = process.env.DB_DATABASE;
  const driver = process.env.DB_ODBC_DRIVER || 'ODBC Driver 18 for SQL Server';
  const encrypt = process.env.DB_ENCRYPT === 'true' ? 'yes' : 'no';
  const trustCert =
    process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' ? 'yes' : 'no';

  return [
    `Driver={${driver}}`,
    `Server=${server}`,
    `Database=${database}`,
    'Trusted_Connection=yes',
    `Encrypt=${encrypt}`,
    `TrustServerCertificate=${trustCert}`,
    'LoginTimeout=15',
  ].join(';');
};

if (!process.env.DB_DATABASE) {
  throw new Error(
    'DB_DATABASE es obligatorio para el DataSource de migraciones.',
  );
}

const AppDataSource = new DataSource(
  isWindowsAuth
    ? {
        type: 'mssql',
        driver: msnodesqlv8Driver,
        database: process.env.DB_DATABASE,
        entities: [Comunicado, Usuario, FotografiaGaleria, PublicacionTransparencia],
        migrations: ['src/migrations/*{.ts,.js}'],
        migrationsTableName: 'typeorm_migrations',
        synchronize: false,
        logging: process.env.DB_LOGGING === 'true',
        extra: {
          connectionString: buildWindowsConnectionString(),
          connectionTimeout: 15000,
        },
        options: {
          encrypt: process.env.DB_ENCRYPT === 'true',
          trustServerCertificate:
            process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        },
      }
    : {
        type: 'mssql',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || '1433'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE,
        entities: [Comunicado, Usuario, FotografiaGaleria, PublicacionTransparencia],
        migrations: ['src/migrations/*{.ts,.js}'],
        migrationsTableName: 'typeorm_migrations',
        synchronize: false,
        logging: process.env.DB_LOGGING === 'true',
        options: {
          encrypt: process.env.DB_ENCRYPT === 'true',
          trustServerCertificate:
            process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
        },
      },
);

export default AppDataSource;
