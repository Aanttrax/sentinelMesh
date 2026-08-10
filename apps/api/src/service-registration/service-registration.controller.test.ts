/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment -- supertest + NestJS getHttpServer() returns any */
import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ServiceRegistrationController } from './service-registration.controller';
import { ServiceRegistrationService } from './service-registration.service';
import { InMemoryServiceRepository } from '../infrastructure/in-memory-service.repository';
import { DomainExceptionFilter } from '../common/domain-exception.filter';
import { SERVICE_REPOSITORY } from '@sentinelmesh/service-registration';

/** Shape of a serialized Service returned by the API. */
interface ServiceShape {
  id: string;
  name: string;
  environment: string;
  version: string;
  status: string;
  createdAt: string;
}

/** Shape of a structured error response. */
interface ErrorShape {
  statusCode: number;
  message: string | string[];
  error: string;
}

describe('ServiceRegistrationController (integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ServiceRegistrationController],
      providers: [
        ServiceRegistrationService,
        {
          provide: SERVICE_REPOSITORY,
          useClass: InMemoryServiceRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // ── POST /services ──────────────────────────────────────────

  describe('POST /services', () => {
    it('should return 201 with the created service', async () => {
      const res = await request(app.getHttpServer())
        .post('/services')
        .send({ name: 'payment-api', environment: 'production', version: '1.0.0' })
        .expect(201);

      const body = res.body as ServiceShape;
      expect(body).toMatchObject({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
        status: 'active',
      });
      expect(body.id).toBeTruthy();
      expect(body.createdAt).toBeTruthy();
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/services')
        .send({ name: '' })
        .expect(400);

      const body = res.body as ErrorShape;
      expect(body).toHaveProperty('statusCode', 400);
      expect(body).toHaveProperty('message');
      expect(Array.isArray(body.message)).toBe(true);
    });

    it('should return 409 when registering a duplicate service name', async () => {
      await request(app.getHttpServer())
        .post('/services')
        .send({ name: 'payment-api', environment: 'production', version: '1.0.0' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/services')
        .send({ name: 'payment-api', environment: 'staging', version: '2.0.0' })
        .expect(409);

      const body = res.body as ErrorShape;
      expect(body).toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('already exists'),
        error: 'DuplicateServiceError',
      });
    });

    it('should return 400 for invalid semver version', async () => {
      const res = await request(app.getHttpServer())
        .post('/services')
        .send({ name: 'bad-version', environment: 'prod', version: 'not-semver' })
        .expect(400);

      const body = res.body as ErrorShape;
      expect(body).toHaveProperty('statusCode', 400);
    });
  });

  // ── GET /services ───────────────────────────────────────────

  describe('GET /services', () => {
    it('should return an empty array when no services exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/services')
        .expect(200);

      const body = res.body as ServiceShape[];
      expect(body).toEqual([]);
    });

    it('should list all registered services', async () => {
      await request(app.getHttpServer())
        .post('/services')
        .send({ name: 'svc-a', environment: 'production', version: '1.0.0' });
      await request(app.getHttpServer())
        .post('/services')
        .send({ name: 'svc-b', environment: 'staging', version: '2.0.0' });

      const res = await request(app.getHttpServer())
        .get('/services')
        .expect(200);

      const body = res.body as ServiceShape[];
      expect(body).toHaveLength(2);
      const names = body.map((s) => s.name).sort();
      expect(names).toEqual(['svc-a', 'svc-b']);
    });
  });

  // ── GET /services/:id ───────────────────────────────────────

  describe('GET /services/:id', () => {
    it('should return 200 with the service when found', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/services')
        .send({ name: 'payment-api', environment: 'production', version: '1.0.0' });

      const { id } = createRes.body as ServiceShape;

      const res = await request(app.getHttpServer())
        .get(`/services/${id}`)
        .expect(200);

      const body = res.body as ServiceShape;
      expect(body.id).toBe(id);
      expect(body.name).toBe('payment-api');
    });

    it('should return 404 when the service does not exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/services/nonexistent-id')
        .expect(404);

      const body = res.body as ErrorShape;
      expect(body).toMatchObject({
        statusCode: 404,
        message: expect.stringContaining('not found'),
        error: 'ServiceNotFoundError',
      });
    });
  });

  // ── PATCH /services/:id/disable ─────────────────────────────

  describe('PATCH /services/:id/disable', () => {
    it('should return 200 and transition status to disabled', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/services')
        .send({ name: 'payment-api', environment: 'production', version: '1.0.0' });

      const { id } = createRes.body as ServiceShape;

      const res = await request(app.getHttpServer())
        .patch(`/services/${id}/disable`)
        .expect(200);

      const body = res.body as ServiceShape;
      expect(body.id).toBe(id);
      expect(body.status).toBe('disabled');
    });

    it('should return 409 when the service is already disabled', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/services')
        .send({ name: 'payment-api', environment: 'production', version: '1.0.0' });

      const { id } = createRes.body as ServiceShape;

      await request(app.getHttpServer())
        .patch(`/services/${id}/disable`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/services/${id}/disable`)
        .expect(409);

      const body = res.body as ErrorShape;
      expect(body).toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('already disabled'),
        error: 'ServiceAlreadyDisabledError',
      });
    });

    it('should return 404 when the service does not exist', async () => {
      const res = await request(app.getHttpServer())
        .patch('/services/nonexistent-id/disable')
        .expect(404);

      const body = res.body as ErrorShape;
      expect(body).toMatchObject({
        statusCode: 404,
        message: expect.stringContaining('not found'),
        error: 'ServiceNotFoundError',
      });
    });
  });
});
