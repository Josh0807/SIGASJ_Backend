import { Module } from '@nestjs/common';
import { ComunicadosService } from './comunicados.service';
import { PublicComunicadosController } from './controllers/public-comunicados.controller';

@Module({
  controllers: [PublicComunicadosController],
  providers: [ComunicadosService],
  exports: [ComunicadosService],
})
export class ComunicadosModule {}
