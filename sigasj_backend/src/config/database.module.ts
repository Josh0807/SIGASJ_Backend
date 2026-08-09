import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions, isDatabaseEnabled } from './database.config';

/**
 * Registra TypeORM solo si DB_ENABLED !== 'false'.
 * Los tests e2e fijan DB_ENABLED=false antes de cargar AppModule.
 */
@Module({})
export class DatabaseModule {
  static register(): DynamicModule {
    if (!isDatabaseEnabled()) {
      return {
        module: DatabaseModule,
      };
    }

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: buildTypeOrmOptions,
        }),
      ],
    };
  }
}
