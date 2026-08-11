import type { HttpEvent, EventRepository } from '@sentinelmesh/event-schema';

/**
 * In-memory implementation of the {@link EventRepository} port.
 *
 * Stores events in a {@link Map} keyed by `eventId`. Suitable for
 * development and testing; a MongoDB-backed adapter is planned for
 * the production milestone.
 *
 * Follows the same pattern as {@link InMemoryServiceRepository} and
 * {@link InMemoryApiKeyRepository}.
 */
export class InMemoryEventRepository implements EventRepository {
  private readonly store = new Map<string, HttpEvent>();

  async save(event: HttpEvent): Promise<HttpEvent> {
    this.store.set(event.idempotencyKey, event);
    return Promise.resolve(event);
  }

  /** Return all stored events — used for test verification and listing. */
  async findAll(): Promise<HttpEvent[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }
}
