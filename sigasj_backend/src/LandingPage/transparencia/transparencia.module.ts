import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicTransparenciaController } from './controllers/public-transparencia.controller';
import { PublicacionTransparencia } from './entities/publicacion-transparencia.entity';
import { TransparenciaFileUploadService } from './services/transparencia-file-upload.service';
import { TransparenciaService } from './transparencia.service';

@Module({
  imports: [TypeOrmModule.forFeature([PublicacionTransparencia])],
  controllers: [PublicTransparenciaController],
  providers: [TransparenciaService, TransparenciaFileUploadService],
  exports: [TypeOrmModule, TransparenciaService, TransparenciaFileUploadService],
})
export class TransparenciaModule {}
