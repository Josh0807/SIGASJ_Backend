import { Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entidad mínima de Usuario.
 *
 * No existía en el repositorio al crear las FKs de Comunicado.
 * Solo define la PK `idUsuario` (int) para relaciones; no amplía el dominio
 * de usuarios ni autenticación en esta tarea.
 */
@Entity({ name: 'Usuario' })
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'idUsuario', type: 'int' })
  idUsuario!: number;
}
