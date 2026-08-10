import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicacionTransparencia } from './entities/publicacion-transparencia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PublicacionTransparencia])],
  exports: [TypeOrmModule],
})
export class TransparenciaModule {}
