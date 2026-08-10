/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment -- supertest + NestJS getHttpServer() returns any */
import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ApiKeyManagementController } from './api-key-management.controller';
import { ApiKeyManagementService } from './api-key-management.service';
import { InMemoryApiKeyRepository } from '../infrastructure/in-memory-api-key.repository';
import { DomainExceptionFilter } from '../common/domain-exception.filter';
import { API_KEY_REPOSITORY } from '@sentinelmesh/api-key-management';
import { ServiceRegistrationService } from '../service-registration/service-registration.service';
import { InMemoryServiceRepository } from '../infrastructure/in-memory-service.repository';
import { SERVICE_REPOSITORY } from '@sentinelmesh/service-registration';

/** Shape of a key-generation / rotation response. */
interface KeyResponseShape {
  id: string;
  serviceId: string;
  keyPrefix: string;
  status: string;
  createdAt: string;
  rawKey: string;
}

/** Shape of a key-metadata item in GET /keys. */
interface KeyMetaShape {
  id: string;
  serviceId: string;
  keyPrefix: string;
  status: string;
  createdAt: string;
}

/** Shape of a structured error response. */
interface ErrorShape {
  statusCode: number;
  message: string;
  error: string;
}

describe('ApiKeyManagementController (integration)', () => {
  let app: INestApplication;
  let svcReg: ServiceRegistrationService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeyManagementController],
      providers: [
        ApiKeyManagementService,
        {
          provide: API_KEY_REPOSITORY,
          useClass: InMemoryApiKeyRepository,
        },
        {
          provide: SERVICE_REPOSITORY,
          useClass: InMemoryServiceRepository,
        },
        ServiceRegistrationService,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    svcReg = app.get(ServiceRegistrationService);
  });

  afterEach(async () => {
    await app.close();
  });

  // ── Helper: register a service directly ────────────────────────
  const registerService = async (name: string): Promise<{ id: string }> => {
    const svc = await svcReg.registerService({
      name,
      environment: 'production',
      version: '1.0.0',
    });
    return { id: svc.id };
  };

  // ── POST /services/:serviceId/keys ─────────────────────────────

  describe('POST /services/:serviceId/keys', () => {
    it('should return 201 with a 64-char rawKey for a registered service', async () => {
      const svc = await registerService('payment-api');

      const res = await request(app.getHttpServer()).post(`/services/${svc.id}/keys`).expect(201);

      const body = res.body as KeyResponseShape;
      expect(body.rawKey).toHaveLength(64);
      expect(body.keyPrefix).toBe(body.rawKey.slice(-4));
      expect(body.id).toBeTruthy();
      expect(body.serviceId).toBe(svc.id);
      expect(body.status).toBe('active');
      expect(body.createdAt).toBeTruthy();
    });

    it('should return 404 when the service is not registered', async () => {
      const res = await request(app.getHttpServer()).post('/services/nonexistent-id/keys').expect(404);

      const body = res.body as ErrorShape;
      expect(body).toMatchObject({
        statusCode: 404,
        message: expect.stringContaining('not found'),
        error: 'ServiceNotFoundError',
      });
    });
  });

  // ── GET /services/:serviceId/keys ──────────────────────────────

  describe('GET /services/:serviceId/keys', () => {
    it('should return an empty array when no keys exist', async () => {
      const svc = await registerService('empty-svc');

      const res = await request(app.getHttpServer()).get(`/services/${svc.id}/keys`).expect(200);

      const body = res.body as KeyMetaShape[];
      expect(body).toEqual([]);
    });

    it('should return key metadata (prefix, status) — NEVER rawKey or hash', async () => {
      const svc = await registerService('payment-api');
      await request(app.getHttpServer()).post(`/services/${svc.id}/keys`);
      const gen2 = await request(app.getHttpServer()).post(`/services/${svc.id}/keys`);

      // Revoke the second key so we get both statuses
      await request(app.getHttpServer()).delete(`/services/${svc.id}/keys/${(gen2.body as KeyResponseShape).id}`);

      const res = await request(app.getHttpServer()).get(`/services/${svc.id}/keys`).expect(200);

      const body = res.body as KeyMetaShape[];
      expect(body).toHaveLength(2);
      for (const item of body) {
        expect(item.id).toBeTruthy();
        expect(item.keyPrefix).toBeTruthy();
        expect(item.serviceId).toBe(svc.id);
        expect(['active', 'revoked']).toContain(item.status);
        expect(item.createdAt).toBeTruthy();
        expect((item as unknown as Record<string, unknown>)['rawKey']).toBeUndefined();
        expect((item as unknown as Record<string, unknown>)['keyHash']).toBeUndefined();
      }
    });
  });

  // ── DELETE /services/:serviceId/keys/:keyId (revoke) ───────────

  describe('DELETE /services/:serviceId/keys/:keyId', () => {
    it('should return 200 and transition key to revoked', async () => {
      const svc = await registerService('payment-api');
      const gen = await request(app.getHttpServer()).post(`/services/${svc.id}/keys`);
      const keyId = (gen.body as KeyResponseShape).id;

      const res = await request(app.getHttpServer()).delete(`/services/${svc.id}/keys/${keyId}`).expect(200);

      const body = res.body as { id: string; status: string; revokedAt: string };
      expect(body.id).toBe(keyId);
      expect(body.status).toBe('revoked');
      expect(body.revokedAt).toBeTruthy();
    });

    it('should return 409 when revoking an already-revoked key', async () => {
      const svc = await registerService('payment-api');
      const gen = await request(app.getHttpServer()).post(`/services/${svc.id}/keys`);
      const keyId = (gen.body as KeyResponseShape).id;

      await request(app.getHttpServer()).delete(`/services/${svc.id}/keys/${keyId}`).expect(200);

      const res = await request(app.getHttpServer()).delete(`/services/${svc.id}/keys/${keyId}`).expect(409);

      const body = res.body as ErrorShape;
      expect(body).toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('already revoked'),
        error: 'ApiKeyAlreadyRevokedError',
      });
    });

    it('should return 404 when key does not exist', async () => {
      const svc = await registerService('payment-api');

      const res = await request(app.getHttpServer()).delete(`/services/${svc.id}/keys/nonexistent-key-id`).expect(404);

      const body = res.body as ErrorShape;
      expect(body).toMatchObject({
        statusCode: 404,
        message: expect.stringContaining('not found'),
        error: 'ApiKeyNotFoundError',
      });
    });
  });

  // ── POST /services/:serviceId/keys/:keyId/rotate ───────────────

  describe('POST /services/:serviceId/keys/:keyId/rotate', () => {
    it('should return 200 with a new key and the old key revoked', async () => {
      const svc = await registerService('auth-svc');
      const gen = await request(app.getHttpServer()).post(`/services/${svc.id}/keys`);
      const oldId = (gen.body as KeyResponseShape).id;

      const res = await request(app.getHttpServer()).post(`/services/${svc.id}/keys/${oldId}/rotate`).expect(200);

      const body = res.body as KeyResponseShape;
      expect(body.rawKey).toHaveLength(64);
      expect(body.id).not.toBe(oldId); // brand-new key
      expect(body.status).toBe('active');
      expect(body.serviceId).toBe(svc.id);
    });

    it('should return 404 when rotating a non-existent key', async () => {
      const svc = await registerService('auth-svc');

      const res = await request(app.getHttpServer())
        .post(`/services/${svc.id}/keys/nonexistent-key-id/rotate`)
        .expect(404);

      const body = res.body as ErrorShape;
      expect(body).toMatchObject({
        statusCode: 404,
        message: expect.stringContaining('not found'),
        error: 'ApiKeyNotFoundError',
      });
    });

    it('should return 409 when rotating a revoked key', async () => {
      const svc = await registerService('auth-svc');
      const gen = await request(app.getHttpServer()).post(`/services/${svc.id}/keys`);
      const keyId = (gen.body as KeyResponseShape).id;

      await request(app.getHttpServer()).delete(`/services/${svc.id}/keys/${keyId}`).expect(200);

      const res = await request(app.getHttpServer()).post(`/services/${svc.id}/keys/${keyId}/rotate`).expect(409);

      const body = res.body as ErrorShape;
      expect(body).toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('already revoked'),
        error: 'ApiKeyAlreadyRevokedError',
      });
    });
  });
});
