/* eslint-disable @typescript-eslint/no-unsafe-argument -- supertest + NestJS getHttpServer() returns any */
import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { EventIngestionController } from './event-ingestion.controller';
import { EventIngestionService } from './event-ingestion.service';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { ApiKeyManagementService } from '../api-key-management/api-key-management.service';
import { InMemoryApiKeyRepository } from '../infrastructure/in-memory-api-key.repository';
import { ServiceRegistrationService } from '../service-registration/service-registration.service';
import { InMemoryServiceRepository } from '../infrastructure/in-memory-service.repository';
import { InMemoryEventRepository } from '../infrastructure/in-memory-event.repository';
import { DomainExceptionFilter } from '../common/domain-exception.filter';
import { API_KEY_REPOSITORY } from '@sentinelmesh/api-key-management';
import { SERVICE_REPOSITORY } from '@sentinelmesh/service-registration';
import { EVENT_REPOSITORY } from '@sentinelmesh/event-schema';

/** Shape of a 202 accepted response. */
interface AcceptedShape {
  eventId: string;
  status: string;
}

/** Shape of a structured error response. */
interface ErrorShape {
  statusCode: number;
  message: string | string[];
  error: string;
}

describe('EventIngestionController (integration)', () => {
  let app: INestApplication;
  let serviceId: string;
  let validKey: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EventIngestionController],
      providers: [
        EventIngestionService,
        ApiKeyAuthGuard,
        ApiKeyManagementService,
        ServiceRegistrationService,
        {
          provide: SERVICE_REPOSITORY,
          useClass: InMemoryServiceRepository,
        },
        {
          provide: API_KEY_REPOSITORY,
          useClass: InMemoryApiKeyRepository,
        },
        {
          provide: EVENT_REPOSITORY,
          useClass: InMemoryEventRepository,
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

    // ── Setup: register a service directly (not via HTTP) ──────
    const svcReg = moduleFixture.get(ServiceRegistrationService);
    const svc = await svcReg.registerService({
      name: 'payment-api',
      environment: 'production',
      version: '1.0.0',
    });
    serviceId = svc.id;

    // ── Setup: generate an API key directly ────────────────────
    const keyMgmt = moduleFixture.get(ApiKeyManagementService);
    const key = await keyMgmt.generateKey(serviceId);
    validKey = key.rawKey;
  });

  afterEach(async () => {
    await app.close();
  });

  const validBody = {
    method: 'POST',
    path: '/api/orders',
    statusCode: 201,
    durationMs: 55,
    idempotencyKey: 'idem-setup-001',
  };

  // ── POST /events ── 202 happy path ──────────────────────────────

  it('should return 202 with eventId and status "accepted" for a valid request', async () => {
    const res = await request(app.getHttpServer())
      .post('/events')
      .set('X-Service-Id', serviceId)
      .set('Authorization', `Bearer ${validKey}`)
      .send(validBody)
      .expect(202);

    const body = res.body as AcceptedShape;
    expect(body.status).toBe('accepted');
    expect(body.eventId).toBeTruthy();
    // UUID v4 pattern (the 4 at position 13 and [89ab] at position 14)
    expect(body.eventId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  // ── POST /events ── 401 missing API key ─────────────────────────

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app.getHttpServer())
      .post('/events')
      .set('X-Service-Id', serviceId)
      .send(validBody)
      .expect(401);

    const body = res.body as ErrorShape;
    expect(body).toMatchObject({
      statusCode: 401,
      error: 'UnauthorizedEventError',
    });
  });

  // ── POST /events ── 401 invalid API key ─────────────────────────

  it('should return 401 when an invalid API key is provided', async () => {
    const res = await request(app.getHttpServer())
      .post('/events')
      .set('X-Service-Id', serviceId)
      .set('Authorization', 'Bearer sk-invalid-key-that-does-not-exist')
      .send(validBody)
      .expect(401);

    const body = res.body as ErrorShape;
    expect(body).toMatchObject({
      statusCode: 401,
      error: 'UnauthorizedEventError',
    });
  });

  // ── POST /events ── 503 disabled service ────────────────────────

  it('should return 503 when the service is disabled', async () => {
    // Disable the service directly
    const svcReg = app.get(ServiceRegistrationService);
    await svcReg.disableService(serviceId);

    const res = await request(app.getHttpServer())
      .post('/events')
      .set('X-Service-Id', serviceId)
      .set('Authorization', `Bearer ${validKey}`)
      .send(validBody)
      .expect(503);

    const body = res.body as ErrorShape;
    expect(body).toMatchObject({
      statusCode: 503,
      error: 'ServiceNotAcceptingEventsError',
    });
  });

  // ── POST /events ── 400 missing required field ──────────────────

  it('should return 400 when a required field (durationMs) is missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/events')
      .set('X-Service-Id', serviceId)
      .set('Authorization', `Bearer ${validKey}`)
      .send({
        method: 'GET',
        path: '/api/health',
        statusCode: 200,
        // durationMs intentionally missing
      })
      .expect(400);

    const body = res.body as ErrorShape;
    expect(body).toHaveProperty('statusCode', 400);
    expect(body).toHaveProperty('message');
  });
});
