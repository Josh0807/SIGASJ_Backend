import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminGaleriaController } from './controllers/admin-galeria.controller';
import { PublicGaleriaController } from './controllers/public-galeria.controller';
import { FotografiaGaleria } from './entities/fotografia-galeria.entity';
import { GaleriaService } from './services/galeria.service';
import { GaleriaImageUploadService } from './services/galeria-image-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([FotografiaGaleria]), AuthModule],
  controllers: [PublicGaleriaController, AdminGaleriaController],
  providers: [GaleriaService, GaleriaImageUploadService],
  exports: [TypeOrmModule, GaleriaService, GaleriaImageUploadService],
})
export class GaleriaModule {}
