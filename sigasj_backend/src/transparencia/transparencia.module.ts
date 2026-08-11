import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminTransparenciaController } from './controllers/admin-transparencia.controller';
import { PublicTransparenciaController } from './controllers/public-transparencia.controller';
import { PublicacionTransparencia } from './entities/publicacion-transparencia.entity';
import { TransparenciaFileUploadService } from './services/transparencia-file-upload.service';
import { TransparenciaService } from './services/transparencia.service';

@Module({
  imports: [TypeOrmModule.forFeature([PublicacionTransparencia]), AuthModule],
  controllers: [PublicTransparenciaController, AdminTransparenciaController],
  providers: [TransparenciaService, TransparenciaFileUploadService],
  exports: [TypeOrmModule, TransparenciaService, TransparenciaFileUploadService],
})
export class TransparenciaModule {}
