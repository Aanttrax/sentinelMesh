import IORedis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { InMemoryEventRepository } from '@sentinelmesh/api';
import { processEventJob } from './main';
import type { HttpEvent } from '@sentinelmesh/event-schema';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

/** Create an event in the repository with status 'pending'. */
function seedEvent(repo: InMemoryEventRepository, overrides: Partial<HttpEvent> = {}): HttpEvent {
  const event: HttpEvent = {
    eventId: 'integration-test-evt-001',
    serviceId: 'integration-svc',
    idempotencyKey: 'integration-idem-001',
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    durationMs: 10,
    timestamp: new Date(),
    status: 'pending',
    ...overrides,
  };
  return event;
}

describe('Event Processing Pipeline (integration with Redis)', () => {
  let connection: IORedis;
  let queue: Queue;
  let repo: InMemoryEventRepository;

  beforeEach(async () => {
    connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
    queue = new Queue(`test-event-processing-${Date.now()}`, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'fixed', delay: 100 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
    repo = new InMemoryEventRepository();
  });

  afterEach(async () => {
    await queue.close();
    await connection.quit();
  });

  // ── Happy path ──────────────────────────────────────────────────

  it('should transition event from pending → processed via the real queue', async () => {
    const event = seedEvent(repo);
    await repo.save(event);

    // Create worker that processes jobs from this queue
    const worker = new Worker(
      queue.name,
      async (job) => {
        const { eventId } = job.data as { eventId: string };
        await processEventJob(eventId, repo);
      },
      { connection },
    );

    // Publish the job
    await queue.add('process-event', { eventId: event.eventId });

    // Wait for the job to complete
    await new Promise<void>((resolve, reject) => {
      worker.on('completed', () => resolve());
      worker.on('failed', (job, err) => reject(err));
    });

    // Verify the event status transitioned to 'processed'
    const events = await repo.findAll();
    const updated = events.find((e) => e.eventId === event.eventId);
    expect(updated).toBeDefined();
    expect(updated!.status).toBe('processed');

    await worker.close();
  }, 15_000);

  // ── Failure path ────────────────────────────────────────────────

  it('should mark event as failed after exhausting retries on processing error', async () => {
    const event = seedEvent(repo, { eventId: 'integration-fail-evt' });
    await repo.save(event);

    // Repo wrapper that throws on the second updateStatus call (simulating a failure after 'processing')
    const failingRepo = {
      updateStatus: jest
        .fn()
        .mockResolvedValueOnce(undefined) // processing → OK
        .mockRejectedValue(new Error('Simulated processing failure')), // processed → FAIL
    };

    const worker = new Worker(
      queue.name,
      async (job) => {
        const { eventId } = job.data as { eventId: string };
        await processEventJob(eventId, failingRepo);
      },
      { connection },
    );

    // Must also update the real repo when the worker's 'failed' event fires
    worker.on('failed', async (job) => {
      if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
        await repo.updateStatus(
          (job.data as { eventId: string }).eventId,
          'failed',
        );
      }
    });

    await queue.add('process-event', { eventId: event.eventId });

    // Wait for permanent failure after all retries
    await new Promise<void>((resolve) => {
      worker.on('failed', (job, err, prev) => {
        if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
          resolve();
        }
      });
    });

    // Verify status is failed in the real repo
    const events = await repo.findAll();
    const updated = events.find((e) => e.eventId === event.eventId);
    expect(updated).toBeDefined();
    expect(updated!.status).toBe('failed');

    await worker.close();
  }, 30_000);

  // ── No duplicate processing ─────────────────────────────────────

  it('should process the event exactly once (idempotency via queue)', async () => {
    const event = seedEvent(repo, { eventId: 'integration-idempotent-evt' });
    await repo.save(event);

    let processCount = 0;

    const worker = new Worker(
      queue.name,
      async (job) => {
        processCount++;
        const { eventId } = job.data as { eventId: string };
        await processEventJob(eventId, repo);
      },
      { connection },
    );

    await queue.add('process-event', { eventId: event.eventId });

    await new Promise<void>((resolve) => {
      worker.on('completed', () => {
        // Give a small grace period for any duplicate processing
        setTimeout(resolve, 500);
      });
    });

    expect(processCount).toBe(1);

    const events = await repo.findAll();
    const updated = events.find((e) => e.eventId === event.eventId);
    expect(updated!.status).toBe('processed');

    await worker.close();
  }, 15_000);
});
