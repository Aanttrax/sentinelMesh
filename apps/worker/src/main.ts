import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import { InMemoryEventRepository } from '@sentinelmesh/api';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
const QUEUE_NAME = 'event-processing';

/**
 * Pure handler extracted for testability.
 * Transitions event status: pending → processing → processed.
 *
 * Called by the BullMQ {@link Worker.process} callback.
 */
export async function processEventJob(
  eventId: string,
  repo: { updateStatus: (eventId: string, status: string) => Promise<void> },
): Promise<void> {
  await repo.updateStatus(eventId, 'processing');
  await repo.updateStatus(eventId, 'processed');
}

function main(): void {
  const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  const repo = new InMemoryEventRepository();

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { eventId } = job.data as { eventId: string };
      await processEventJob(eventId, repo);
    },
    { connection },
  );

  worker.on('completed', (job) => {
    console.log(
      `Job ${job.id} completed for event ${(job.data as { eventId: string }).eventId}`,
    );
  });

  worker.on('failed', (job, err) => {
    void (async () => {
      // After all retries exhausted, mark as failed
      if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
        const { eventId } = job.data as { eventId: string };
        await repo.updateStatus(eventId, 'failed');
        console.error(
          `Job ${job.id} permanently failed for event ${eventId}: ${err.message}`,
        );
      }
    })();
  });

  const shutdown = (signal: string): void => {
    console.log(`Received ${signal}, shutting down worker...`);
    void worker.close().then(() => connection.quit().then(() => process.exit(0)));
  };

  process.on('SIGTERM', () => { shutdown('SIGTERM'); });
  process.on('SIGINT', () => { shutdown('SIGINT'); });

  console.log(`Worker listening on queue "${QUEUE_NAME}"`);
}

// Only start the worker when this file is executed directly, not when imported for testing
if (process.argv[1]?.endsWith('main.ts') || process.argv[1]?.endsWith('main.js')) {
  main();
}
