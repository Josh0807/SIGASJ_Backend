import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComunicadosService } from './comunicados.service';
import { PublicComunicadosController } from './controllers/public-comunicados.controller';
import { Comunicado } from './entities/comunicado.entity';

/**
 * Módulo de comunicados.
 * Registra la entidad para inyección de `Repository<Comunicado>`.
 * Ya estaba incluido en AppModule — no duplicar el registro allí.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Comunicado])],
  controllers: [PublicComunicadosController],
  providers: [ComunicadosService],
  exports: [ComunicadosService, TypeOrmModule],
})
export class ComunicadosModule {}
