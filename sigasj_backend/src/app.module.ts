import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ComunicadosModule } from './comunicados/comunicados.module';
import { DatabaseModule } from './config/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    DatabaseModule.register(),
    ComunicadosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
