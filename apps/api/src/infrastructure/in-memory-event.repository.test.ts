import { InMemoryEventRepository } from './in-memory-event.repository';
import type { HttpEvent } from '@sentinelmesh/event-schema';

function createEvent(overrides: Partial<HttpEvent> = {}): HttpEvent {
  return {
    serviceId: 'payment-api',
    idempotencyKey: '550e8400-e29b-41d4-a716-446655440001',
    method: 'POST',
    path: '/api/charges',
    statusCode: 201,
    durationMs: 87,
    timestamp: new Date('2026-08-11T10:00:00Z'),
    ...overrides,
  };
}

describe('InMemoryEventRepository', () => {
  let repo: InMemoryEventRepository;

  beforeEach(() => {
    repo = new InMemoryEventRepository();
  });

  describe('save', () => {
    it('should persist an event and return it', async () => {
      const event = createEvent();

      const saved = await repo.save(event);

      expect(saved).toBe(event);
      expect(saved.serviceId).toBe('payment-api');
      expect(saved.method).toBe('POST');
      expect(saved.path).toBe('/api/charges');
      expect(saved.statusCode).toBe(201);
      expect(saved.durationMs).toBe(87);
    });

    it('should store multiple events without collisions', async () => {
      const event1 = createEvent({ idempotencyKey: 'key-001' });
      const event2 = createEvent({ idempotencyKey: 'key-002' });

      await repo.save(event1);
      await repo.save(event2);

      const all = await repo.findAll();
      expect(all).toHaveLength(2);
      expect(all.map((e) => e.idempotencyKey).sort()).toEqual(
        ['key-001', 'key-002'].sort(),
      );
    });

    it('should return the same event on save (no side effects on the entity)', async () => {
      const event = createEvent({
        serviceId: 'auth-svc',
        method: 'GET',
        path: '/health',
        statusCode: 200,
        durationMs: 3,
      });

      const saved = await repo.save(event);

      expect(saved.serviceId).toBe('auth-svc');
      expect(saved.statusCode).toBe(200);
      expect(saved.durationMs).toBe(3);
    });
  });

  describe('findAll', () => {
    it('should return an empty array when no events have been saved', async () => {
      const result = await repo.findAll();

      expect(result).toEqual([]);
    });
  });
});
