import { Service } from './service.entity';
import { ServiceStatus } from './service-status.enum';
import { ServiceAlreadyDisabledError } from './errors';

describe('Service', () => {
  describe('create', () => {
    it('should create a service with the given name, environment, and version', () => {
      const service = Service.create({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      expect(service.name).toBe('payment-api');
      expect(service.environment).toBe('production');
      expect(service.version).toBe('1.0.0');
    });

    it('should generate a non-empty UUIDv4 identifier', () => {
      const service = Service.create({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      expect(service.id).toBeTruthy();
      expect(typeof service.id).toBe('string');
      // UUIDv4 format: 8-4-4-4-12 hex digits
      expect(service.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique IDs for different services', () => {
      const a = Service.create({
        name: 'svc-a',
        environment: 'production',
        version: '1.0.0',
      });
      const b = Service.create({
        name: 'svc-b',
        environment: 'production',
        version: '1.0.0',
      });

      expect(a.id).not.toBe(b.id);
    });

    it('should default status to active', () => {
      const service = Service.create({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      expect(service.status).toBe(ServiceStatus.Active);
    });

    it('should set createdAt to the current timestamp', () => {
      const before = new Date();
      const service = Service.create({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });
      const after = new Date();

      expect(service.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(service.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('canAcceptEvents', () => {
    it('should return true for an active service', () => {
      const service = Service.create({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      expect(service.canAcceptEvents()).toBe(true);
    });

    it('should return false for a disabled service', () => {
      const service = Service.create({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      service.disable();

      expect(service.canAcceptEvents()).toBe(false);
    });
  });

  describe('disable', () => {
    it('should transition status from active to disabled', () => {
      const service = Service.create({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      service.disable();

      expect(service.status).toBe(ServiceStatus.Disabled);
    });

    it('should throw ServiceAlreadyDisabledError when already disabled', () => {
      const service = Service.create({
        name: 'payment-api',
        environment: 'production',
        version: '1.0.0',
      });

      service.disable();

      expect(() => {
        service.disable();
      }).toThrow(ServiceAlreadyDisabledError);
    });
  });

  describe('validation', () => {
    it('should reject an empty name', () => {
      expect(() =>
        Service.create({
          name: '',
          environment: 'production',
          version: '1.0.0',
        }),
      ).toThrow('name is required');
    });

    it('should reject a name with only whitespace', () => {
      expect(() =>
        Service.create({
          name: '   ',
          environment: 'production',
          version: '1.0.0',
        }),
      ).toThrow('name is required');
    });

    it('should reject an empty environment', () => {
      expect(() =>
        Service.create({
          name: 'payment-api',
          environment: '',
          version: '1.0.0',
        }),
      ).toThrow('environment is required');
    });

    it('should reject an empty version', () => {
      expect(() =>
        Service.create({
          name: 'payment-api',
          environment: 'production',
          version: '',
        }),
      ).toThrow('version is required');
    });

    it('should reject a version that is not valid semver', () => {
      expect(() =>
        Service.create({
          name: 'payment-api',
          environment: 'production',
          version: 'not-a-version',
        }),
      ).toThrow('version must be valid semver');
    });

    it('should accept a valid semver version', () => {
      const service = Service.create({
        name: 'payment-api',
        environment: 'production',
        version: '2.1.3-beta.1',
      });

      expect(service.version).toBe('2.1.3-beta.1');
    });
  });
});
