import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea la tabla Comunicado (+ FK a Usuario).
 *
 * Revisión previa:
 * - Motor: SQL Server
 * - synchronize: false (no sustituye esta migración)
 * - Sin naming strategy custom
 * - Sin patrón @Check previo → no se inventa CHECK de fechas aquí
 * - Enums TypeScript → columnas nvarchar (valores del enum)
 *
 * Usuario: si no existe, se crea tabla mínima solo con idUsuario para poder
 * declarar las FKs. El down NO elimina Usuario (pudo preexistir).
 */
export class CreateComunicadoTable1754662800000 implements MigrationInterface {
  name = 'CreateComunicadoTable1754662800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID(N'[dbo].[Usuario]', N'U') IS NULL
      BEGIN
        CREATE TABLE [dbo].[Usuario] (
          [idUsuario] int IDENTITY(1,1) NOT NULL,
          CONSTRAINT [PK_Usuario] PRIMARY KEY CLUSTERED ([idUsuario])
        );
      END
    `);

    await queryRunner.query(`
      CREATE TABLE [dbo].[Comunicado] (
        [idComunicado] int IDENTITY(1,1) NOT NULL,
        [titulo] nvarchar(200) NOT NULL,
        [descripcionBreve] nvarchar(500) NOT NULL,
        [contenido] nvarchar(max) NULL,
        [tipoComunicado] nvarchar(80) NOT NULL,
        [fechaPublicacion] date NOT NULL,
        [fechaInicioVisibilidad] date NOT NULL,
        [fechaVencimiento] date NULL,
        [estado] nvarchar(20) NOT NULL,
        [imagenUrl] nvarchar(2048) NULL,
        [idUsuarioCreador] int NOT NULL,
        [idUsuarioModificador] int NULL,
        [fechaCreacion] datetime2 NOT NULL CONSTRAINT [DF_Comunicado_fechaCreacion] DEFAULT (getdate()),
        [fechaActualizacion] datetime2 NOT NULL CONSTRAINT [DF_Comunicado_fechaActualizacion] DEFAULT (getdate()),
        CONSTRAINT [PK_Comunicado] PRIMARY KEY CLUSTERED ([idComunicado]),
        CONSTRAINT [FK_Comunicado_UsuarioCreador] FOREIGN KEY ([idUsuarioCreador])
          REFERENCES [dbo].[Usuario] ([idUsuario]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [FK_Comunicado_UsuarioModificador] FOREIGN KEY ([idUsuarioModificador])
          REFERENCES [dbo].[Usuario] ([idUsuario]) ON DELETE NO ACTION ON UPDATE NO ACTION
      );
    `);

    await queryRunner.query(`
      CREATE NONCLUSTERED INDEX [IX_Comunicado_PublicVisibility]
      ON [dbo].[Comunicado] ([estado], [fechaInicioVisibilidad], [fechaVencimiento]);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_Comunicado_PublicVisibility'
          AND object_id = OBJECT_ID(N'[dbo].[Comunicado]')
      )
      BEGIN
        DROP INDEX [IX_Comunicado_PublicVisibility] ON [dbo].[Comunicado];
      END
    `);

    await queryRunner.query(`
      IF OBJECT_ID(N'[dbo].[Comunicado]', N'U') IS NOT NULL
      BEGIN
        DROP TABLE [dbo].[Comunicado];
      END
    `);

    // No se elimina [Usuario]: puede preexistir o usarse fuera de esta migración.
  }
}
