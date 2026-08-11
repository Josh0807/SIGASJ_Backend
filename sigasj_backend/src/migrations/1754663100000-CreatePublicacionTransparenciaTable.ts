import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea la tabla PublicacionTransparencia (+ FK a Usuario).
 * PBI 1.8 — tarea 1.8.1.
 */
export class CreatePublicacionTransparenciaTable1754663100000
  implements MigrationInterface
{
  name = 'CreatePublicacionTransparenciaTable1754663100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID(N'[dbo].[PublicacionTransparencia]', N'U') IS NULL
      BEGIN
        CREATE TABLE [dbo].[PublicacionTransparencia] (
          [idPublicacionTransparencia] int IDENTITY(1,1) NOT NULL,
          [nombre] nvarchar(200) NOT NULL,
          [descripcionBreve] nvarchar(500) NOT NULL,
          [archivoUrl] nvarchar(500) NOT NULL,
          [tipoArchivo] nvarchar(20) NOT NULL,
          [activo] bit NOT NULL CONSTRAINT [DF_PublicacionTransparencia_activo] DEFAULT (1),
          [ordenVisualizacion] int NOT NULL CONSTRAINT [DF_PublicacionTransparencia_orden] DEFAULT (0),
          [idUsuarioCreador] int NOT NULL,
          [fechaCreacion] datetime2 NOT NULL CONSTRAINT [DF_PublicacionTransparencia_fechaCreacion] DEFAULT (getdate()),
          [fechaActualizacion] datetime2 NOT NULL CONSTRAINT [DF_PublicacionTransparencia_fechaActualizacion] DEFAULT (getdate()),
          CONSTRAINT [PK_PublicacionTransparencia] PRIMARY KEY CLUSTERED ([idPublicacionTransparencia]),
          CONSTRAINT [FK_PublicacionTransparencia_UsuarioCreador] FOREIGN KEY ([idUsuarioCreador])
            REFERENCES [dbo].[Usuario] ([idUsuario]) ON DELETE NO ACTION ON UPDATE NO ACTION
        );
      END
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_PublicacionTransparencia_activo_orden'
          AND object_id = OBJECT_ID(N'[dbo].[PublicacionTransparencia]')
      )
      BEGIN
        CREATE NONCLUSTERED INDEX [IX_PublicacionTransparencia_activo_orden]
        ON [dbo].[PublicacionTransparencia] ([activo], [ordenVisualizacion]);
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_PublicacionTransparencia_activo_orden'
          AND object_id = OBJECT_ID(N'[dbo].[PublicacionTransparencia]')
      )
      BEGIN
        DROP INDEX [IX_PublicacionTransparencia_activo_orden] ON [dbo].[PublicacionTransparencia];
      END
    `);

    await queryRunner.query(`
      IF OBJECT_ID(N'[dbo].[PublicacionTransparencia]', N'U') IS NOT NULL
      BEGIN
        DROP TABLE [dbo].[PublicacionTransparencia];
      END
    `);
  }
}
