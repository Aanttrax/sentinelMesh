import { type Service, type ServiceRepository } from '@sentinelmesh/service-registration';

export class InMemoryServiceRepository implements ServiceRepository {
  private readonly store = new Map<string, Service>();

  async save(service: Service): Promise<Service> {
    this.store.set(service.id, service);
    return Promise.resolve(service);
  }

  async findById(id: string): Promise<Service | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  async findByName(name: string): Promise<Service | null> {
    const lower = name.toLowerCase();
    for (const service of this.store.values()) {
      if (service.name.toLowerCase() === lower) {
        return Promise.resolve(service);
      }
    }
    return Promise.resolve(null);
  }

  async findAll(): Promise<Service[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }
}
