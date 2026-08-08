import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ComunicadosModule } from './LandingPage/comunicados/comunicados.module';

@Module({
  imports: [ComunicadosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
