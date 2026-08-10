import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsuariosTable1740000000001 implements MigrationInterface {
  name = 'CreateUsuariosTable1740000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'usuarios',
        columns: [
          {
            name: 'idUsuario',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'nombreCompleto',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'correoElectronico',
            type: 'varchar',
            length: '150',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'tokenVersion',
            type: 'int',
            default: 0,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('usuarios', true);
  }
}
