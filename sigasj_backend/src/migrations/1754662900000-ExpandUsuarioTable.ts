import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Amplía la tabla Usuario creada como stub (solo idUsuario) para alinear
 * con la entidad completa usada por Galería / autenticación.
 */
export class ExpandUsuarioTable1754662900000 implements MigrationInterface {
  name = 'ExpandUsuarioTable1754662900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF COL_LENGTH(N'dbo.Usuario', N'nombreCompleto') IS NULL
        ALTER TABLE [dbo].[Usuario] ADD [nombreCompleto] nvarchar(150) NOT NULL
          CONSTRAINT [DF_Usuario_nombreCompleto] DEFAULT (N'');
    `);
    await queryRunner.query(`
      IF COL_LENGTH(N'dbo.Usuario', N'correoElectronico') IS NULL
        ALTER TABLE [dbo].[Usuario] ADD [correoElectronico] nvarchar(150) NULL;
    `);
    await queryRunner.query(`
      IF COL_LENGTH(N'dbo.Usuario', N'correoElectronico') IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM sys.indexes
           WHERE name = N'UQ_Usuario_correoElectronico'
             AND object_id = OBJECT_ID(N'dbo.Usuario')
         )
      BEGIN
        UPDATE [dbo].[Usuario]
        SET [correoElectronico] = CONCAT(N'user', [idUsuario], N'@local.sigasj')
        WHERE [correoElectronico] IS NULL;

        ALTER TABLE [dbo].[Usuario] ALTER COLUMN [correoElectronico] nvarchar(150) NOT NULL;

        ALTER TABLE [dbo].[Usuario]
          ADD CONSTRAINT [UQ_Usuario_correoElectronico] UNIQUE ([correoElectronico]);
      END
    `);
    await queryRunner.query(`
      IF COL_LENGTH(N'dbo.Usuario', N'passwordHash') IS NULL
        ALTER TABLE [dbo].[Usuario] ADD [passwordHash] nvarchar(255) NOT NULL
          CONSTRAINT [DF_Usuario_passwordHash] DEFAULT (N'');
    `);
    await queryRunner.query(`
      IF COL_LENGTH(N'dbo.Usuario', N'isActive') IS NULL
        ALTER TABLE [dbo].[Usuario] ADD [isActive] bit NOT NULL
          CONSTRAINT [DF_Usuario_isActive] DEFAULT (1);
    `);
    await queryRunner.query(`
      IF COL_LENGTH(N'dbo.Usuario', N'tokenVersion') IS NULL
        ALTER TABLE [dbo].[Usuario] ADD [tokenVersion] int NOT NULL
          CONSTRAINT [DF_Usuario_tokenVersion] DEFAULT (0);
    `);
    await queryRunner.query(`
      IF COL_LENGTH(N'dbo.Usuario', N'fechaCreacion') IS NULL
        ALTER TABLE [dbo].[Usuario] ADD [fechaCreacion] datetime2 NOT NULL
          CONSTRAINT [DF_Usuario_fechaCreacion] DEFAULT (getdate());
    `);
    await queryRunner.query(`
      IF COL_LENGTH(N'dbo.Usuario', N'fechaActualizacion') IS NULL
        ALTER TABLE [dbo].[Usuario] ADD [fechaActualizacion] datetime2 NOT NULL
          CONSTRAINT [DF_Usuario_fechaActualizacion] DEFAULT (getdate());
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No se revierten columnas: podrían tener datos de Galería/auth.
    await queryRunner.query(`SELECT 1`);
  }
}
