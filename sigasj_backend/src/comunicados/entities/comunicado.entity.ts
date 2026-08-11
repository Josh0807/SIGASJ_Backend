import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { EstadoComunicado } from '../enums/estado-comunicado.enum';
import { TipoComunicado } from '../enums/tipo-comunicado.enum';

/**
 * Comunicado oficial de SIGASJ.
 *
 * ## Integridad en el modelo (BD / TypeORM)
 * - NOT NULL: titulo, descripcionBreve, tipoComunicado, fechaPublicacion,
 *   fechaInicioVisibilidad, estado, idUsuarioCreador
 * - NULL permitido: contenido, fechaVencimiento, imagenUrl, idUsuarioModificador
 * - Longitudes: titulo 200, descripcionBreve 500, tipo 80, estado 20, imagenUrl 2048,
 *   contenido nvarchar(max)
 * - FKs a Usuario sin CASCADE (onDelete: NO ACTION)
 *
 * ## Validaciones diferidas (DTO / service — no hay patrón @Check en el proyecto)
 * - fechaVencimiento >= fechaInicioVisibilidad (cuando fechaVencimiento no es NULL)
 * - titulo / descripcionBreve no pueden ser solo espacios → class-validator
 * - idUsuarioCreador inmutable tras el alta → DTO/service administrativo
 *
 * Índice compuesto orientado al listado público (estado + ventana de fechas).
 */
@Entity({ name: 'Comunicado' })
@Index('IX_Comunicado_PublicVisibility', [
  'estado',
  'fechaInicioVisibilidad',
  'fechaVencimiento',
])
export class Comunicado {
  @PrimaryGeneratedColumn({ name: 'idComunicado', type: 'int' })
  idComunicado!: number;

  @Column({
    name: 'titulo',
    type: 'nvarchar',
    length: 200,
    nullable: false,
  })
  titulo!: string;

  @Column({
    name: 'descripcionBreve',
    type: 'nvarchar',
    length: 500,
    nullable: false,
  })
  descripcionBreve!: string;

  /** Contenido completo opcional (texto extenso). */
  @Column({
    name: 'contenido',
    type: 'nvarchar',
    length: 'max',
    nullable: true,
  })
  contenido!: string | null;

  @Column({
    name: 'tipoComunicado',
    type: 'nvarchar',
    length: 80,
    nullable: false,
    enum: TipoComunicado,
  })
  tipoComunicado!: TipoComunicado;

  @Column({
    name: 'fechaPublicacion',
    type: 'date',
    nullable: false,
  })
  fechaPublicacion!: Date;

  @Column({
    name: 'fechaInicioVisibilidad',
    type: 'date',
    nullable: false,
  })
  fechaInicioVisibilidad!: Date;

  @Column({
    name: 'fechaVencimiento',
    type: 'date',
    nullable: true,
  })
  fechaVencimiento!: Date | null;

  @Column({
    name: 'estado',
    type: 'nvarchar',
    length: 20,
    nullable: false,
    enum: EstadoComunicado,
  })
  estado!: EstadoComunicado;

  @Column({
    name: 'imagenUrl',
    type: 'nvarchar',
    length: 2048,
    nullable: true,
  })
  imagenUrl!: string | null;

  /**
   * FK escalar (escritura/lectura por id).
   * La relación ManyToOne comparte la misma columna vía @JoinColumn.
   */
  @Column({
    name: 'idUsuarioCreador',
    type: 'int',
    nullable: false,
  })
  idUsuarioCreador!: number;

  @ManyToOne(() => Usuario, {
    nullable: false,
    onDelete: 'NO ACTION',
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'idUsuarioCreador', referencedColumnName: 'idUsuario' })
  usuarioCreador!: Usuario;

  @Column({
    name: 'idUsuarioModificador',
    type: 'int',
    nullable: true,
  })
  idUsuarioModificador!: number | null;

  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: 'NO ACTION',
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'idUsuarioModificador',
    referencedColumnName: 'idUsuario',
  })
  usuarioModificador!: Usuario | null;

  @CreateDateColumn({
    name: 'fechaCreacion',
    type: 'datetime2',
  })
  fechaCreacion!: Date;

  @UpdateDateColumn({
    name: 'fechaActualizacion',
    type: 'datetime2',
  })
  fechaActualizacion!: Date;
}
