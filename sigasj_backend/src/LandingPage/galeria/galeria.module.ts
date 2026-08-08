import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicGaleriaController } from './controllers/public-galeria.controller';
import { FotografiaGaleria } from './entities/fotografia-galeria.entity';
import { GaleriaService } from './galeria.service';
import { GaleriaImageUploadService } from './services/galeria-image-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([FotografiaGaleria])],
  controllers: [PublicGaleriaController],
  providers: [GaleriaService, GaleriaImageUploadService],
  exports: [TypeOrmModule, GaleriaService, GaleriaImageUploadService],
})
export class GaleriaModule {}
