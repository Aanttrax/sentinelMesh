import { Test, type TestingModule } from '@nestjs/testing';
import { EventIngestionService } from './event-ingestion.service';
import { ServiceRegistrationService } from '../service-registration/service-registration.service';
import { InMemoryEventRepository } from '../infrastructure/in-memory-event.repository';
import { EVENT_REPOSITORY, ServiceNotAcceptingEventsError } from '@sentinelmesh/event-schema';
import { Service, ServiceNotFoundError } from '@sentinelmesh/service-registration';
import { EVENT_PROCESSING_QUEUE } from './queue.constants';
import type { IngestEventDto } from './dto/ingest-event.dto';

describe('EventIngestionService', () => {
  let svc: EventIngestionService;
  let repo: InMemoryEventRepository;
  let mockGetService: jest.Mock;
  let mockQueue: { add: jest.Mock };

  beforeEach(async () => {
    mockGetService = jest.fn();
    mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventIngestionService,
        {
          provide: ServiceRegistrationService,
          useValue: { getService: mockGetService },
        },
        {
          provide: EVENT_REPOSITORY,
          useClass: InMemoryEventRepository,
        },
        {
          provide: EVENT_PROCESSING_QUEUE,
          useValue: mockQueue,
        },
      ],
    }).compile();

    svc = module.get(EventIngestionService);
    repo = module.get<InMemoryEventRepository>(
      EVENT_REPOSITORY as unknown as string,
    );
  });

  const dto = {
    method: 'GET',
    path: '/api/users',
    statusCode: 200,
    durationMs: 42,
    idempotencyKey: 'idem-001',
  } satisfies Partial<IngestEventDto> as IngestEventDto;

  // ── Happy path ──────────────────────────────────────────────────

  it('should return eventId and status "accepted" for an active service and enqueue the event', async () => {
    const activeService = Service.create({
      name: 'payment-api',
      environment: 'production',
      version: '1.0.0',
    });
    mockGetService.mockResolvedValue(activeService);

    const result = await svc.ingestEvent('svc-id', 'evt-abc-123', dto);

    expect(result).toEqual({ eventId: 'evt-abc-123', status: 'accepted' });
    expect(mockQueue.add).toHaveBeenCalledWith('process-event', {
      eventId: 'evt-abc-123',
    });

    const events = await repo.findAll();
    expect(events).toHaveLength(1);
    const [first] = events;
    expect(first).toMatchObject({
      serviceId: 'svc-id',
      method: 'GET',
      path: '/api/users',
      statusCode: 200,
      durationMs: 42,
      idempotencyKey: 'idem-001',
      status: 'pending',
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(first!.timestamp).toBeInstanceOf(Date);
  });

  // ── Disabled service ────────────────────────────────────────────

  it('should throw ServiceNotAcceptingEventsError for a disabled service', async () => {
    const disabledService = Service.create({
      name: 'legacy-svc',
      environment: 'production',
      version: '1.0.0',
    });
    disabledService.disable();
    mockGetService.mockResolvedValue(disabledService);

    await expect(
      svc.ingestEvent('svc-id', 'evt-abc-123', dto),
    ).rejects.toThrow(ServiceNotAcceptingEventsError);

    const events = await repo.findAll();
    expect(events).toHaveLength(0);
  });

  // ── Unknown service ─────────────────────────────────────────────

  it('should propagate ServiceNotFoundError when the service does not exist', async () => {
    mockGetService.mockRejectedValue(new ServiceNotFoundError('unknown'));

    await expect(
      svc.ingestEvent('unknown', 'evt-abc-123', dto),
    ).rejects.toThrow(ServiceNotFoundError);

    const events = await repo.findAll();
    expect(events).toHaveLength(0);
  });

  // ── Controller-generated eventId ────────────────────────────────

  it('should use the eventId passed from the controller without modification', async () => {
    const activeService = Service.create({
      name: 'payment-api',
      environment: 'production',
      version: '1.0.0',
    });
    mockGetService.mockResolvedValue(activeService);

    const controllerEventId = 'controller-uuid-456';
    const result = await svc.ingestEvent('svc-id', controllerEventId, dto);

    expect(result.eventId).toBe(controllerEventId);
  });

  // ── Deduplication ────────────────────────────────────────────

  it('should return status "duplicate" with the original eventId and NOT enqueue', async () => {
    const activeService = Service.create({
      name: 'payment-api',
      environment: 'production',
      version: '1.0.0',
    });
    mockGetService.mockResolvedValue(activeService);

    // First ingestion — accepted, enqueued
    const first = await svc.ingestEvent('svc-a', 'evt-original', dto);
    expect(first).toEqual({ eventId: 'evt-original', status: 'accepted' });
    expect(await repo.findAll()).toHaveLength(1);
    expect(mockQueue.add).toHaveBeenCalledTimes(1);

    // Second ingestion — duplicate, NOT enqueued
    const second = await svc.ingestEvent('svc-a', 'evt-duplicate', dto);
    expect(second).toEqual({ eventId: 'evt-original', status: 'duplicate' });
    expect(mockQueue.add).toHaveBeenCalledTimes(1); // still 1, no new call

    // No additional event saved
    expect(await repo.findAll()).toHaveLength(1);
  });

  it('should treat same idempotencyKey across different services as distinct', async () => {
    const activeService = Service.create({
      name: 'payment-api',
      environment: 'production',
      version: '1.0.0',
    });
    mockGetService.mockResolvedValue(activeService);

    // First ingestion for svc-a
    const first = await svc.ingestEvent('svc-a', 'evt-aaa', dto);
    expect(first.status).toBe('accepted');

    // Same key, different service — new event
    const second = await svc.ingestEvent('svc-b', 'evt-bbb', dto);
    expect(second.status).toBe('accepted');

    expect(await repo.findAll()).toHaveLength(2);
  });

  it('should fall back to eventId when no client idempotencyKey is supplied', async () => {
    const activeService = Service.create({
      name: 'payment-api',
      environment: 'production',
      version: '1.0.0',
    });
    mockGetService.mockResolvedValue(activeService);

    const dtoWithoutKey: IngestEventDto = {
      method: 'GET',
      path: '/api/health',
      statusCode: 200,
      durationMs: 10,
    };

    // First — accepted
    const first = await svc.ingestEvent('svc-a', 'evt-fallback', dtoWithoutKey);
    expect(first).toEqual({ eventId: 'evt-fallback', status: 'accepted' });

    // Second with same eventId — duplicate
    const second = await svc.ingestEvent('svc-a', 'evt-fallback', dtoWithoutKey);
    expect(second).toEqual({ eventId: 'evt-fallback', status: 'duplicate' });
  });
});
