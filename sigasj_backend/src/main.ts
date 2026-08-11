import { exec } from 'node:child_process';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

function openBrowser(url: string): void {
  const command =
    process.platform === 'win32'
      ? `cmd /c start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  exec(command, (error) => {
    if (error) {
      console.warn(`No se pudo abrir el navegador automáticamente: ${url}`);
    }
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SIGASJ API')
    .setDescription('Documentación de la API del backend SIGASJ')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('Comunicados públicos')
    .addTag('Comunicados administrativos')
    .addTag('Galería pública')
    .addTag('Galería administrativa')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Ruta simple (sin prefijo global): evita UI en blanco por paths relativos.
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'SIGASJ API',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  const swaggerUrl = `http://localhost:${port}/docs/`;
  console.log(`API:     http://localhost:${port}/api`);
  console.log(`Swagger: ${swaggerUrl}`);

  // En desarrollo abre Swagger al levantar el backend.
  if (process.env.NODE_ENV !== 'production') {
    openBrowser(swaggerUrl);
  }
}
void bootstrap();
