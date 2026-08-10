import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicacionTransparencia } from './entities/publicacion-transparencia.entity';
import { TransparenciaFileUploadService } from './services/transparencia-file-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([PublicacionTransparencia])],
  providers: [TransparenciaFileUploadService],
  exports: [TypeOrmModule, TransparenciaFileUploadService],
})
export class TransparenciaModule {}
