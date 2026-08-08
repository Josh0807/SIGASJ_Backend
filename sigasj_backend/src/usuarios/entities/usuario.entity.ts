import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entidad base de usuarios del sistema.
 * Campos de autenticación alineados con la tarea 635 (passwordHash, isActive, tokenVersion).
 */
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'idUsuario' })
  idUsuario: number;

  @Column({ name: 'nombreCompleto', type: 'varchar', length: 150 })
  nombreCompleto: string;

  @Column({
    name: 'correoElectronico',
    type: 'varchar',
    length: 150,
    unique: true,
  })
  correoElectronico: string;

  @Column({ name: 'passwordHash', type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'tokenVersion', type: 'int', default: 0 })
  tokenVersion: number;

  @CreateDateColumn({ name: 'fechaCreacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fechaActualizacion' })
  fechaActualizacion: Date;
}
