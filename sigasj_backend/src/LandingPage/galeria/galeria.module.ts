import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FotografiaGaleria } from './entities/fotografia-galeria.entity';
import { GaleriaImageUploadService } from './services/galeria-image-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([FotografiaGaleria])],
  providers: [GaleriaImageUploadService],
  exports: [TypeOrmModule, GaleriaImageUploadService],
})
export class GaleriaModule {}
