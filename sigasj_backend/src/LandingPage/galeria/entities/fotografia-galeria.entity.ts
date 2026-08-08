import { Usuario } from '../../../usuarios/entities/usuario.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Fotografías administrables de la galería pública de la Landing Page.
 * PBI 1.7 — Galería pública de fotos.
 */
@Entity('fotografias_galeria')
export class FotografiaGaleria {
  @PrimaryGeneratedColumn({ name: 'idFotografiaGaleria' })
  idFotografiaGaleria: number;

  @Column({ name: 'titulo', type: 'varchar', length: 150, nullable: true })
  titulo?: string | null;

  @Column({ name: 'descripcion', type: 'varchar', length: 500, nullable: true })
  descripcion?: string | null;

  @Column({ name: 'imagenUrl', type: 'varchar', length: 500 })
  imagenUrl: string;

  @Column({ name: 'textoAlternativo', type: 'varchar', length: 255 })
  textoAlternativo: string;

  @Column({ name: 'ordenVisualizacion', type: 'int', default: 0 })
  ordenVisualizacion: number;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'idUsuarioCreador' })
  usuarioCreador: Usuario;

  @CreateDateColumn({ name: 'fechaCreacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fechaActualizacion' })
  fechaActualizacion: Date;
}
