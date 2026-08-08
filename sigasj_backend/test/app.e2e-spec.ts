import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
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

    it('Caso 8 — lista vacía 200 + { data: [], total: 0 }', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/public/comunicados')
        .expect(200);

      expect(response.body).toEqual({ data: [], total: 0 });
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
      // Equivalente a response.data en el cliente HTTP / axios-like.
      expect(body.data).toEqual([]);
      expect(typeof body.total).toBe('number');
    });
  });
});
