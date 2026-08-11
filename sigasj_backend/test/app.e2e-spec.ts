import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Comunicado } from './../src/comunicados/entities/comunicado.entity';

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('resuelve ComunicadosModule y Repository<Comunicado>', () => {
    const repository = moduleFixture.get<Repository<Comunicado>>(
      getRepositoryToken(Comunicado),
    );
    expect(repository).toBeDefined();
    expect(typeof repository.find).toBe('function');
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  describe('GET /api/public/comunicados', () => {
    it('Caso 1 — público sin JWT (no 401/403)', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/public/comunicados',
      );

      expect(response.status).toBe(200);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('Caso 8 — lista vacía o datos: siempre 200 + { data, total }', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/public/comunicados')
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          data: expect.any(Array),
          total: expect.any(Number),
        }),
      );
      expect(response.body.total).toBe(response.body.data.length);
    });

    it('Caso 9 — cuerpo sin claves privadas sensibles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/public/comunicados')
        .expect(200);

      const body = response.body as { data: unknown[]; total: number };
      const serialized = JSON.stringify(body);
      expect(serialized).not.toMatch(/password|token|contraseña|credencial/i);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('total');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('Parte 8 — contrato data/total consumible por el cliente', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/public/comunicados')
        .expect(200);

      const body = response.body as { data: unknown[]; total: number };
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.total).toBe('number');
      expect(body.total).toBe(body.data.length);
    });
  });
});
