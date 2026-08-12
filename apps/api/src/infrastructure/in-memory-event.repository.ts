import type { HttpEvent, EventRepository, EventStatus } from '@sentinelmesh/event-schema';

/**
 * In-memory implementation of the {@link EventRepository} port.
 *
 * Stores events in a {@link Map} keyed by composite key `(serviceId, idempotencyKey)`.
 * Maintains a secondary {@link Map} keyed by `eventId` for O(1)
 * {@link updateStatus} lookups. Suitable for development and testing;
 * a MongoDB-backed adapter is planned for the production milestone.
 *
 * Follows the same pattern as {@link InMemoryServiceRepository} and
 * {@link InMemoryApiKeyRepository}.
 */
export class InMemoryEventRepository implements EventRepository {
  private readonly store = new Map<string, HttpEvent>();
  private readonly eventIdIndex = new Map<string, string>(); // eventId → compositeKey

  private compositeKey(serviceId: string, key: string): string {
    return `${serviceId}::${key}`;
  }

  async save(event: HttpEvent): Promise<HttpEvent> {
    const key = this.compositeKey(event.serviceId, event.idempotencyKey);
    this.store.set(key, event);
    this.eventIdIndex.set(event.eventId, key);
    return Promise.resolve(event);
  }

  async findByIdempotencyKey(serviceId: string, key: string): Promise<HttpEvent | null> {
    const found = this.store.get(this.compositeKey(serviceId, key));
    return Promise.resolve(found ?? null);
  }

  async updateStatus(eventId: string, status: string): Promise<void> {
    const compositeKey = this.eventIdIndex.get(eventId);
    if (!compositeKey) return; // no-op for missing events
    const event = this.store.get(compositeKey);
    if (event) {
      event.status = status as EventStatus;
    }
    return Promise.resolve();
  }

  /** Return all stored events — used for test verification and listing. */
  async findAll(): Promise<HttpEvent[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }
}
