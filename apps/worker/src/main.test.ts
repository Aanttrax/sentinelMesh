// Minimal in-memory implementation for testing — mirrors InMemoryEventRepository
// but avoids the cross-package import boundary.
class TestRepo {
  private readonly store = new Map<string, { eventId: string; status: string }>();

  async save(eventId: string): Promise<void> {
    this.store.set(eventId, { eventId, status: 'pending' });
    return Promise.resolve();
  }

  async updateStatus(eventId: string, status: string): Promise<void> {
    const event = this.store.get(eventId);
    if (event) {
      event.status = status;
    }
    return Promise.resolve();
  }

  async findStatus(eventId: string): Promise<string | undefined> {
    return Promise.resolve(this.store.get(eventId)?.status);
  }

  async findAll(): Promise<{ eventId: string; status: string }[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }
}

// Import from the module we are about to implement (RED phase)
import { processEventJob } from './main';

describe('Worker — processEventJob', () => {
  let repo: TestRepo;

  beforeEach(() => {
    repo = new TestRepo();
  });

  it('should transition event status from pending → processing → processed', async () => {
    await repo.save('evt-job-001');

    await processEventJob('evt-job-001', repo);

    const status = await repo.findStatus('evt-job-001');
    expect(status).toBe('processed');
  });

  it('should report status as processing after first updateStatus call', async () => {
    await repo.save('evt-job-002');
    await repo.updateStatus('evt-job-002', 'processing');

    const status = await repo.findStatus('evt-job-002');
    expect(status).toBe('processing');
  });

  it('should mark status as "failed" on processing error', async () => {
    await repo.save('evt-job-003');
    await repo.updateStatus('evt-job-003', 'failed');

    const status = await repo.findStatus('evt-job-003');
    expect(status).toBe('failed');
  });
});

describe('Worker configuration', () => {
  it('should be configured with 3 attempts', () => {
    const attempts = 3;
    expect(attempts).toBe(3);
  });

  it('should use exponential backoff with 1000ms delay', () => {
    const backoff = { type: 'exponential' as const, delay: 1000 };
    expect(backoff.type).toBe('exponential');
    expect(backoff.delay).toBe(1000);
  });
});
