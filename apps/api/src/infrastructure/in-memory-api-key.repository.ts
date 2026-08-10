import type { ApiKey, ApiKeyRepository } from '@sentinelmesh/api-key-management';

/**
 * In-memory implementation of the ApiKeyRepository port.
 *
 * Stores keys in a {@link Map} keyed by `serviceId` using the same pattern as
 * {@link InMemoryServiceRepository}. Suitable for development and testing;
 * a MongoDB-backed adapter is planned for the production milestone.
 */
export class InMemoryApiKeyRepository implements ApiKeyRepository {
  private readonly store = new Map<string, ApiKey[]>();

  async save(key: ApiKey): Promise<ApiKey> {
    const existing = this.store.get(key.serviceId) ?? [];
    const index = existing.findIndex((k) => k.id === key.id);

    if (index >= 0) {
      existing[index] = key;
    } else {
      existing.push(key);
    }

    this.store.set(key.serviceId, existing);
    return Promise.resolve(key);
  }

  async findById(id: string): Promise<ApiKey | null> {
    for (const keys of this.store.values()) {
      const found = keys.find((k) => k.id === id);
      if (found) {
        return Promise.resolve(found);
      }
    }
    return Promise.resolve(null);
  }

  async findByServiceId(serviceId: string): Promise<ApiKey[]> {
    return Promise.resolve(this.store.get(serviceId) ?? []);
  }

  async findByHash(keyHash: string): Promise<ApiKey | null> {
    for (const keys of this.store.values()) {
      const found = keys.find((k) => k.keyHash === keyHash);
      if (found) {
        return Promise.resolve(found);
      }
    }
    return Promise.resolve(null);
  }
}
