import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { RolUsuario } from '../src/auth/enums/rol-usuario.enum';
import { ComunicadosService } from '../src/comunicados/services/comunicados.service';
import { AdminComunicadosController } from '../src/comunicados/controllers/admin-comunicados.controller';
import { PublicComunicadosController } from '../src/comunicados/controllers/public-comunicados.controller';
import { Comunicado } from '../src/comunicados/entities/comunicado.entity';
import { EstadoComunicado } from '../src/comunicados/enums/estado-comunicado.enum';
import { TipoComunicado } from '../src/comunicados/enums/tipo-comunicado.enum';

const JWT_SECRET = 'test-admin-comunicados-secret';

type StoredComunicado = Comunicado & {
  idComunicado: number;
  fechaCreacion: Date;
  fechaActualizacion: Date;
};

describe('Admin comunicados (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let store: StoredComunicado[];
  let nextId: number;

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const pastIso = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const futureIso = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const createBody = {
    titulo: 'Aviso e2e',
    descripcionBreve: 'Descripción breve e2e',
    contenido: 'Contenido completo',
    tipoComunicado: TipoComunicado.AVISO_GENERAL,
    fechaPublicacion: pastIso,
    fechaInicioVisibilidad: pastIso,
    fechaVencimiento: futureIso,
    estado: EstadoComunicado.ACTIVO,
    imagenUrl: null,
  };

  function tokenFor(rol: RolUsuario, idUsuario = 10): string {
    return jwtService.sign(
      { sub: idUsuario, rol },
      { secret: JWT_SECRET, expiresIn: '1h' },
    );
  }

  function auth(rol: RolUsuario, idUsuario = 10) {
    return { Authorization: `Bearer ${tokenFor(rol, idUsuario)}` };
  }

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    store = [];
    nextId = 1;

    const repository = {
      find: jest.fn(
        async (options?: { where?: { estado?: EstadoComunicado } }) => {
          let rows = [...store];
          if (options?.where?.estado) {
            rows = rows.filter((row) => row.estado === options.where?.estado);
          }
          return rows;
        },
      ),
      findOne: jest.fn(
        async (options: { where: { idComunicado: number } }) =>
          store.find(
            (row) => row.idComunicado === options.where.idComunicado,
          ) ?? null,
      ),
      create: jest.fn((data: Partial<Comunicado>) => ({ ...data })),
      save: jest.fn(async (entity: Partial<StoredComunicado>) => {
        const now = new Date();
        if (!entity.idComunicado) {
          const created = {
            ...entity,
            idComunicado: nextId++,
            fechaCreacion: now,
            fechaActualizacion: now,
          } as StoredComunicado;
          store.push(created);
          return created;
        }

        const index = store.findIndex(
          (row) => row.idComunicado === entity.idComunicado,
        );
        const updated = {
          ...store[index],
          ...entity,
          fechaActualizacion: now,
        } as StoredComunicado;
        store[index] = updated;
        return updated;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ JWT_SECRET })],
        }),
        AuthModule,
      ],
      controllers: [AdminComunicadosController, PublicComunicadosController],
      providers: [
        ComunicadosService,
        { provide: getRepositoryToken(Comunicado), useValue: repository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    jwtService = moduleFixture.get(JwtService);
  });

  beforeEach(() => {
    store.length = 0;
    nextId = 1;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Administradora', () => {
    it('GET listado obtiene comunicados', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/comunicados')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send(createBody)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/admin/comunicados')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].titulo).toBe('Aviso e2e');
    });

    it('GET por id obtiene un comunicado existente', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/admin/comunicados')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send(createBody)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/api/admin/comunicados/${created.body.idComunicado}`)
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .expect(200);

      expect(response.body.idComunicado).toBe(created.body.idComunicado);
    });

    it('POST crea y registra creador + fechaCreacion', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/comunicados')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send(createBody)
        .expect(201);

      expect(response.body.idUsuarioCreador).toBe(7);
      expect(response.body.fechaCreacion).toBeDefined();
      expect(new Date(response.body.fechaCreacion).getTime()).not.toBeNaN();
    });

    it('PATCH edita y registra modificador + fechaActualizacion', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/admin/comunicados')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send(createBody)
        .expect(201);

      const createdAt = new Date(created.body.fechaCreacion).getTime();

      const response = await request(app.getHttpServer())
        .patch(`/api/admin/comunicados/${created.body.idComunicado}`)
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send({ titulo: 'Título actualizado' })
        .expect(200);

      expect(response.body.titulo).toBe('Título actualizado');
      expect(response.body.idUsuarioModificador).toBe(7);
      expect(response.body.idUsuarioCreador).toBe(7);
      expect(
        new Date(response.body.fechaActualizacion).getTime(),
      ).toBeGreaterThanOrEqual(createdAt);
    });

    it('PATCH estado activo ↔ inactivo sin eliminar', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/admin/comunicados')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send(createBody)
        .expect(201);

      const id = created.body.idComunicado as number;

      const inactive = await request(app.getHttpServer())
        .patch(`/api/admin/comunicados/${id}/estado`)
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send({ estado: EstadoComunicado.INACTIVO })
        .expect(200);

      expect(inactive.body.estado).toBe(EstadoComunicado.INACTIVO);
      expect(inactive.body.idUsuarioModificador).toBe(7);

      const active = await request(app.getHttpServer())
        .patch(`/api/admin/comunicados/${id}/estado`)
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send({ estado: EstadoComunicado.ACTIVO })
        .expect(200);

      expect(active.body.estado).toBe(EstadoComunicado.ACTIVO);

      const stillThere = await request(app.getHttpServer())
        .get(`/api/admin/comunicados/${id}`)
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .expect(200);

      expect(stillThere.body.idComunicado).toBe(id);
      expect(store).toHaveLength(1);
    });
  });

  describe('Secretaria Ejecutiva', () => {
    it('tiene acceso autorizado a operaciones admin principales', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/admin/comunicados')
        .set(auth(RolUsuario.SECRETARIA_EJECUTIVA, 22))
        .send(createBody)
        .expect(201);

      expect(created.body.idUsuarioCreador).toBe(22);

      await request(app.getHttpServer())
        .get('/api/admin/comunicados')
        .set(auth(RolUsuario.SECRETARIA_EJECUTIVA, 22))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/admin/comunicados/${created.body.idComunicado}`)
        .set(auth(RolUsuario.SECRETARIA_EJECUTIVA, 22))
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/admin/comunicados/${created.body.idComunicado}`)
        .set(auth(RolUsuario.SECRETARIA_EJECUTIVA, 22))
        .send({ descripcionBreve: 'Actualizado por secretaria' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/admin/comunicados/${created.body.idComunicado}/estado`)
        .set(auth(RolUsuario.SECRETARIA_EJECUTIVA, 22))
        .send({ estado: EstadoComunicado.INACTIVO })
        .expect(200);
    });
  });

  describe('Roles denegados y autenticación', () => {
    it('Fontanero recibe 403', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/comunicados')
        .set(auth(RolUsuario.FONTANERO, 3))
        .expect(403);
    });

    it('Abonado recibe 403', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/comunicados')
        .set(auth(RolUsuario.ABONADO, 4))
        .send(createBody)
        .expect(403);
    });

    it('sin autenticación recibe 401', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/comunicados')
        .expect(401);
    });

    it('token inválido se rechaza', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/comunicados')
        .set({ Authorization: 'Bearer no.es.un.jwt.valido' })
        .expect(401);
    });

    it('token vencido se rechaza', async () => {
      const expired = jwtService.sign(
        { sub: 7, rol: RolUsuario.ADMINISTRADORA },
        { secret: JWT_SECRET, expiresIn: '1ms' },
      );
      await new Promise((resolve) => setTimeout(resolve, 25));

      await request(app.getHttpServer())
        .get('/api/admin/comunicados')
        .set({ Authorization: `Bearer ${expired}` })
        .expect(401);
    });
  });

  describe('Auditoría y recursos inexistentes', () => {
    it('rechaza idUsuarioCreador / idUsuarioModificador manipulados en body', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/comunicados')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send({
          ...createBody,
          idUsuarioCreador: 999,
        })
        .expect(400);

      const ok = await request(app.getHttpServer())
        .post('/api/admin/comunicados')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send(createBody)
        .expect(201);

      expect(ok.body.idUsuarioCreador).toBe(7);

      await request(app.getHttpServer())
        .patch(`/api/admin/comunicados/${ok.body.idComunicado}`)
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send({
          titulo: 'Intento manipulado',
          idUsuarioModificador: 999,
        })
        .expect(400);

      const current = await request(app.getHttpServer())
        .get(`/api/admin/comunicados/${ok.body.idComunicado}`)
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .expect(200);

      expect(current.body.idUsuarioCreador).toBe(7);
      expect(current.body.titulo).toBe('Aviso e2e');
      expect(current.body.idUsuarioModificador).toBeNull();
    });

    it('GET/PATCH inexistente → 404', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/comunicados/99999')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .expect(404);

      await request(app.getHttpServer())
        .patch('/api/admin/comunicados/99999')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send({ titulo: 'No existe' })
        .expect(404);

      await request(app.getHttpServer())
        .patch('/api/admin/comunicados/99999/estado')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send({ estado: EstadoComunicado.INACTIVO })
        .expect(404);
    });
  });

  describe('Integración con endpoint público', () => {
    it('desactivado no aparece en público; reactivado sí (si está vigente)', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/admin/comunicados')
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send({
          ...createBody,
          titulo: `Público ${todayIso}`,
          fechaInicioVisibilidad: pastIso,
          fechaVencimiento: null,
        })
        .expect(201);

      const id = created.body.idComunicado as number;

      const visible = await request(app.getHttpServer())
        .get('/api/public/comunicados')
        .expect(200);

      expect(visible.body.total).toBeGreaterThanOrEqual(1);
      expect(
        visible.body.data.some(
          (item: { id: number | string }) => Number(item.id) === id,
        ),
      ).toBe(true);

      await request(app.getHttpServer())
        .patch(`/api/admin/comunicados/${id}/estado`)
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send({ estado: EstadoComunicado.INACTIVO })
        .expect(200);

      const hidden = await request(app.getHttpServer())
        .get('/api/public/comunicados')
        .expect(200);

      expect(
        hidden.body.data.some(
          (item: { id: number | string }) => Number(item.id) === id,
        ),
      ).toBe(false);

      await request(app.getHttpServer())
        .patch(`/api/admin/comunicados/${id}/estado`)
        .set(auth(RolUsuario.ADMINISTRADORA, 7))
        .send({ estado: EstadoComunicado.ACTIVO })
        .expect(200);

      const again = await request(app.getHttpServer())
        .get('/api/public/comunicados')
        .expect(200);

      expect(
        again.body.data.some(
          (item: { id: number | string }) => Number(item.id) === id,
        ),
      ).toBe(true);
    });
  });
});
