import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminTransparenciaController } from './controllers/admin-transparencia.controller';
import { PublicTransparenciaController } from './controllers/public-transparencia.controller';
import { PublicacionTransparencia } from './entities/publicacion-transparencia.entity';
import { TransparenciaFileUploadService } from './services/transparencia-file-upload.service';
import { TransparenciaService } from './transparencia.service';

@Module({
  imports: [TypeOrmModule.forFeature([PublicacionTransparencia])],
  controllers: [PublicTransparenciaController, AdminTransparenciaController],
  providers: [TransparenciaService, TransparenciaFileUploadService],
  exports: [TypeOrmModule, TransparenciaService, TransparenciaFileUploadService],
})
export class TransparenciaModule {}
