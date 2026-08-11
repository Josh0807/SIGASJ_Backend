import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea la tabla fotografias_galeria (+ FK a Usuario).
 * Motor: SQL Server. synchronize: false.
 */
export class CreateFotografiasGaleriaTable1754663000000
  implements MigrationInterface
{
  name = 'CreateFotografiasGaleriaTable1754663000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID(N'[dbo].[fotografias_galeria]', N'U') IS NULL
      BEGIN
        CREATE TABLE [dbo].[fotografias_galeria] (
          [idFotografiaGaleria] int IDENTITY(1,1) NOT NULL,
          [titulo] varchar(150) NULL,
          [descripcion] varchar(500) NULL,
          [imagenUrl] varchar(500) NOT NULL,
          [textoAlternativo] varchar(255) NOT NULL,
          [ordenVisualizacion] int NOT NULL CONSTRAINT [DF_fotografias_galeria_orden] DEFAULT (0),
          [activo] bit NOT NULL CONSTRAINT [DF_fotografias_galeria_activo] DEFAULT (1),
          [idUsuarioCreador] int NOT NULL,
          [fechaCreacion] datetime2 NOT NULL CONSTRAINT [DF_fotografias_galeria_fechaCreacion] DEFAULT (getdate()),
          [fechaActualizacion] datetime2 NOT NULL CONSTRAINT [DF_fotografias_galeria_fechaActualizacion] DEFAULT (getdate()),
          CONSTRAINT [PK_fotografias_galeria] PRIMARY KEY ([idFotografiaGaleria]),
          CONSTRAINT [FK_fotografias_galeria_usuario_creador]
            FOREIGN KEY ([idUsuarioCreador]) REFERENCES [dbo].[Usuario] ([idUsuario])
        );

        CREATE INDEX [IDX_fotografias_galeria_activo_orden]
          ON [dbo].[fotografias_galeria] ([activo], [ordenVisualizacion]);
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID(N'[dbo].[fotografias_galeria]', N'U') IS NOT NULL
        DROP TABLE [dbo].[fotografias_galeria];
    `);
  }
}
