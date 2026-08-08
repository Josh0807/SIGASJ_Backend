import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FotografiaGaleria } from './entities/fotografia-galeria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FotografiaGaleria])],
  exports: [TypeOrmModule],
})
export class GaleriaModule {}
