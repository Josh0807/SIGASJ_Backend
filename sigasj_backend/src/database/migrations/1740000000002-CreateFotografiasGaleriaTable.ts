import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateFotografiasGaleriaTable1740000000002
  implements MigrationInterface
{
  name = 'CreateFotografiasGaleriaTable1740000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'fotografias_galeria',
        columns: [
          {
            name: 'idFotografiaGaleria',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'titulo',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          {
            name: 'descripcion',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'imagenUrl',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'textoAlternativo',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'ordenVisualizacion',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'activo',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'idUsuarioCreador',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'fechaCreacion',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'fechaActualizacion',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'fotografias_galeria',
      new TableForeignKey({
        name: 'FK_fotografias_galeria_usuario_creador',
        columnNames: ['idUsuarioCreador'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['idUsuario'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'fotografias_galeria',
      new TableIndex({
        name: 'IDX_fotografias_galeria_activo_orden',
        columnNames: ['activo', 'ordenVisualizacion'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'fotografias_galeria',
      'IDX_fotografias_galeria_activo_orden',
    );
    await queryRunner.dropForeignKey(
      'fotografias_galeria',
      'FK_fotografias_galeria_usuario_creador',
    );
    await queryRunner.dropTable('fotografias_galeria', true);
  }
}
