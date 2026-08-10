import { ServiceRegistrationService } from './service-registration.service';
import { InMemoryServiceRepository } from '../infrastructure/in-memory-service.repository';
import {
  Service,
  DuplicateServiceError,
  ServiceNotFoundError,
  ServiceAlreadyDisabledError,
} from '@sentinelmesh/service-registration';

describe('ServiceRegistrationService', () => {
  let service: ServiceRegistrationService;
  let repo: InMemoryServiceRepository;

  beforeEach(() => {
    repo = new InMemoryServiceRepository();
    service = new ServiceRegistrationService(repo);
  });

  describe('registerService', () => {
    it('should register a new service and return it', async () => {
      const result = await service.registerService({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      expect(result).toBeInstanceOf(Service);
      expect(result.name).toBe('payment-api');
      expect(result.environment).toBe('production');
      expect(result.version).toBe('1.0.0');
      expect(result.id).toBeTruthy();
    });

    it('should persist the registered service in the repository', async () => {
      const created = await service.registerService({
        name: 'auth-service',
        environment: 'staging',
        version: '2.0.0',
      });

      const found = await repo.findById(created.id);
      expect(found).toEqual(
        expect.objectContaining({ name: 'auth-service' }),
      );
    });

    it('should reject duplicate names (case-insensitive)', async () => {
      await service.registerService({
        name: 'Payment-API',
        environment: 'production',
        version: '1.0.0',
      });

      await expect(
        service.registerService({
          name: 'payment-api',
          environment: 'staging',
          version: '2.0.0',
        }),
      ).rejects.toThrow(DuplicateServiceError);
    });

    it('should reject exact duplicate names', async () => {
      await service.registerService({
        name: 'order-api',
        environment: 'production',
        version: '1.0.0',
      });

      await expect(
        service.registerService({
          name: 'order-api',
          environment: 'production',
          version: '1.0.0',
        }),
      ).rejects.toThrow(DuplicateServiceError);
    });
  });

  describe('getService', () => {
    it('should return a service by its id', async () => {
      const created = await service.registerService({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      const result = await service.getService(created.id);
      expect(result.id).toBe(created.id);
      expect(result.name).toBe('payment-api');
    });

    it('should throw ServiceNotFoundError when id does not exist', async () => {
      await expect(
        service.getService('nonexistent-id'),
      ).rejects.toThrow(ServiceNotFoundError);
    });
  });

  describe('listServices', () => {
    it('should return an empty array when no services are registered', async () => {
      const result = await service.listServices();

      expect(result).toEqual([]);
    });

    it('should return all registered services', async () => {
      await service.registerService({
        name: 'svc-a',
        environment: 'production',
        version: '1.0.0',
      });
      await service.registerService({
        name: 'svc-b',
        environment: 'staging',
        version: '2.0.0',
      });

      const result = await service.listServices();

      expect(result).toHaveLength(2);
      expect(result.map((s) => s.name).sort()).toEqual(['svc-a', 'svc-b']);
    });
  });

  describe('disableService', () => {
    it('should disable an active service and persist the change', async () => {
      const created = await service.registerService({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      const disabled = await service.disableService(created.id);

      expect(disabled.status).toBe('disabled');
      const fromRepo = await repo.findById(created.id);
      expect(fromRepo).toEqual(
        expect.objectContaining({ status: 'disabled' }),
      );
    });

    it('should throw ServiceNotFoundError when disabling a nonexistent service', async () => {
      await expect(
        service.disableService('nonexistent-id'),
      ).rejects.toThrow(ServiceNotFoundError);
    });

    it('should throw ServiceAlreadyDisabledError when disabling an already-disabled service', async () => {
      const created = await service.registerService({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      await service.disableService(created.id);

      await expect(
        service.disableService(created.id),
      ).rejects.toThrow(ServiceAlreadyDisabledError);
    });
  });
});
