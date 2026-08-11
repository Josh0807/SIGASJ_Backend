import { Usuario } from '../../usuarios/entities/usuario.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TipoArchivoTransparencia } from '../enums/tipo-archivo-transparencia.enum';

/**
 * Documentos e imágenes de la sección Transparencia y calidad del agua.
 * PBI 1.8 — Documentación de la ASADA.
 *
 * La BD almacena metadatos y la ruta del archivo, no el binario.
 */
@Entity({ name: 'PublicacionTransparencia' })
export class PublicacionTransparencia {
  @PrimaryGeneratedColumn({ name: 'idPublicacionTransparencia', type: 'int' })
  idPublicacionTransparencia!: number;

  @Column({ name: 'nombre', type: 'nvarchar', length: 200 })
  nombre!: string;

  @Column({ name: 'descripcionBreve', type: 'nvarchar', length: 500 })
  descripcionBreve!: string;

  @Column({ name: 'archivoUrl', type: 'nvarchar', length: 500 })
  archivoUrl!: string;

  @Column({
    name: 'tipoArchivo',
    type: 'nvarchar',
    length: 20,
  })
  tipoArchivo!: TipoArchivoTransparencia;

  @Column({ name: 'activo', type: 'bit', default: true })
  activo!: boolean;

  @Column({ name: 'ordenVisualizacion', type: 'int', default: 0 })
  ordenVisualizacion!: number;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'idUsuarioCreador' })
  usuarioCreador!: Usuario;

  @CreateDateColumn({ name: 'fechaCreacion', type: 'datetime2' })
  fechaCreacion!: Date;

  @UpdateDateColumn({ name: 'fechaActualizacion', type: 'datetime2' })
  fechaActualizacion!: Date;
}
