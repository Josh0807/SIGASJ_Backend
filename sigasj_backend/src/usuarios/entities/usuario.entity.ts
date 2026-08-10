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
 * Tabla `Usuario` para SQL Server LocalDB / FKs de Comunicado y Galería.
 */
@Entity({ name: 'Usuario' })
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'idUsuario', type: 'int' })
  idUsuario!: number;

  @Column({ name: 'nombreCompleto', type: 'nvarchar', length: 150 })
  nombreCompleto!: string;

  @Column({
    name: 'correoElectronico',
    type: 'nvarchar',
    length: 150,
    unique: true,
  })
  correoElectronico!: string;

  @Column({
    name: 'passwordHash',
    type: 'nvarchar',
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @Column({ name: 'isActive', type: 'bit', default: true })
  isActive!: boolean;

  @Column({ name: 'tokenVersion', type: 'int', default: 0 })
  tokenVersion!: number;

  @CreateDateColumn({ name: 'fechaCreacion', type: 'datetime2' })
  fechaCreacion!: Date;

  @UpdateDateColumn({ name: 'fechaActualizacion', type: 'datetime2' })
  fechaActualizacion!: Date;
}
