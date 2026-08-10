import { InMemoryServiceRepository } from './in-memory-service.repository';
import { Service, ServiceStatus } from '@sentinelmesh/service-registration';

describe('InMemoryServiceRepository', () => {
  let repo: InMemoryServiceRepository;

  beforeEach(() => {
    repo = new InMemoryServiceRepository();
  });

  describe('save', () => {
    it('should persist a service and return it', async () => {
      const service = Service.create({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      const saved = await repo.save(service);

      expect(saved).toBe(service);
      expect(saved.id).toBe(service.id);
      expect(saved.name).toBe('payment-api');
    });

    it('should make the service retrievable by id after save', async () => {
      const service = Service.create({
        name: 'auth-service',
        environment: 'staging',
        version: '2.0.0',
      });

      await repo.save(service);
      const found = await repo.findById(service.id);

      expect(found).toEqual(
        expect.objectContaining({
          id: service.id,
          name: 'auth-service',
        }),
      );
    });

    it('should overwrite an existing service with the same id', async () => {
      const service = Service.create({
        name: 'order-api',
        environment: 'production',
        version: '1.0.0',
      });

      await repo.save(service);
      service.disable();
      await repo.save(service);

      const found = await repo.findById(service.id);
      expect(found).toEqual(expect.objectContaining({ status: ServiceStatus.Disabled }));
    });
  });

  describe('findById', () => {
    it('should return null when no service matches the id', async () => {
      const result = await repo.findById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should return the correct service when multiple exist', async () => {
      const svcA = Service.create({
        name: 'svc-a',
        environment: 'production',
        version: '1.0.0',
      });
      const svcB = Service.create({
        name: 'svc-b',
        environment: 'production',
        version: '1.0.0',
      });

      await repo.save(svcA);
      await repo.save(svcB);

      const found = await repo.findById(svcA.id);
      expect(found).toEqual(expect.objectContaining({ name: 'svc-a' }));
    });
  });

  describe('findByName', () => {
    it('should return the service matching the exact name', async () => {
      const service = Service.create({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      await repo.save(service);
      const result = await repo.findByName('payment-api');

      expect(result).toEqual(expect.objectContaining({ name: 'payment-api' }));
    });

    it('should be case-insensitive', async () => {
      const service = Service.create({
        name: 'Payment-API',
        environment: 'production',
        version: '1.0.0',
      });

      await repo.save(service);

      const result = await repo.findByName('payment-api');
      expect(result).toEqual(expect.objectContaining({ name: 'Payment-API' }));
    });

    it('should return null when no matching name exists', async () => {
      const result = await repo.findByName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an empty array when no services exist', async () => {
      const result = await repo.findAll();

      expect(result).toEqual([]);
    });

    it('should return all saved services', async () => {
      const svcA = Service.create({
        name: 'svc-a',
        environment: 'production',
        version: '1.0.0',
      });
      const svcB = Service.create({
        name: 'svc-b',
        environment: 'staging',
        version: '2.0.0',
      });

      await repo.save(svcA);
      await repo.save(svcB);

      const result = await repo.findAll();
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.name).sort()).toEqual(['svc-a', 'svc-b']);
    });
  });
});
