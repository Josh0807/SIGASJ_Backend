import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Comunicado } from '../comunicados/entities/comunicado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

// Driver ODBC con autenticación de Windows (LocalDB / Azure Data Studio).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const msnodesqlv8Driver = require('mssql/msnodesqlv8') as object;

/**
 * Opciones TypeORM para SQL Server (mssql).
 *
 * - DB_AUTH=windows → LocalDB / Windows Authentication (mssql/msnodesqlv8)
 * - DB_AUTH=sql (default) → usuario/contraseña (tedious)
 *
 * Valores típicos Azure Data Studio:
 *   DB_HOST=(localdb)\MSSQLLocalDB
 *   DB_AUTH=windows
 *   DB_ENCRYPT=true
 */
export const buildTypeOrmOptions = (
  config: ConfigService,
): TypeOrmModuleOptions => {
  const auth = (config.get<string>('DB_AUTH', 'sql') || 'sql').toLowerCase();
  const database = config.get<string>('DB_DATABASE');
  const logging = config.get<string>('DB_LOGGING', 'false') === 'true';
  const synchronize = config.get<string>('DB_SYNCHRONIZE', 'false') === 'true';

  if (!database) {
    throw new Error(
      'DB_DATABASE no está configurada. Revisa el archivo .env del Back-end.',
    );
  }

  if (auth === 'windows') {
    const connectionString = buildWindowsConnectionString(config, database);

    return {
      type: 'mssql',
      driver: msnodesqlv8Driver,
      database,
      entities: [Comunicado, Usuario],
      migrations: ['dist/migrations/*{.js}'],
      migrationsTableName: 'typeorm_migrations',
      autoLoadEntities: true,
      synchronize,
      logging,
      extra: {
        connectionString,
        connectionTimeout: Number(
          config.get<string>('DB_CONNECTION_TIMEOUT_MS', '15000'),
        ),
      },
      options: {
        encrypt: config.get<string>('DB_ENCRYPT', 'true') === 'true',
        trustServerCertificate:
          config.get<string>('DB_TRUST_SERVER_CERTIFICATE', 'true') === 'true',
      },
    };
  }

  const host = config.get<string>('DB_HOST', 'localhost');
  const port = Number(config.get<string>('DB_PORT', '1433'));
  const username = config.get<string>('DB_USERNAME');
  const password = config.get<string>('DB_PASSWORD');

  if (!username) {
    throw new Error(
      'DB_USERNAME no está configurada. Revisa el archivo .env del Back-end.',
    );
  }

  return {
    type: 'mssql',
    host,
    port,
    username,
    password: password ?? '',
    database,
    entities: [Comunicado, Usuario],
    migrations: ['dist/migrations/*{.js}'],
    migrationsTableName: 'typeorm_migrations',
    autoLoadEntities: true,
    synchronize,
    logging,
    options: {
      encrypt: config.get<string>('DB_ENCRYPT', 'false') === 'true',
      trustServerCertificate:
        config.get<string>('DB_TRUST_SERVER_CERTIFICATE', 'true') === 'true',
    },
  };
};

const buildWindowsConnectionString = (
  config: ConfigService,
  database: string,
): string => {
  const server = config.get<string>('DB_HOST', '(localdb)\\MSSQLLocalDB');
  const driver = config.get<string>(
    'DB_ODBC_DRIVER',
    'ODBC Driver 18 for SQL Server',
  );
  const encrypt =
    config.get<string>('DB_ENCRYPT', 'true') === 'true' ? 'yes' : 'no';
  const trustCert =
    config.get<string>('DB_TRUST_SERVER_CERTIFICATE', 'true') === 'true'
      ? 'yes'
      : 'no';
  const loginTimeout = config.get<string>('DB_LOGIN_TIMEOUT_SEC', '15');

  return [
    `Driver={${driver}}`,
    `Server=${server}`,
    `Database=${database}`,
    'Trusted_Connection=yes',
    `Encrypt=${encrypt}`,
    `TrustServerCertificate=${trustCert}`,
    `LoginTimeout=${loginTimeout}`,
  ].join(';');
};

/** Permite desactivar la BD (p. ej. tests e2e sin SQL Server). */
export const isDatabaseEnabled = (): boolean =>
  process.env.DB_ENABLED !== 'false';
