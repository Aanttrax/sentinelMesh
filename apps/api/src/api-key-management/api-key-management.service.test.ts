import { ApiKeyManagementService } from './api-key-management.service';
import { InMemoryApiKeyRepository } from '../infrastructure/in-memory-api-key.repository';
import { ApiKeyStatus, ApiKeyNotFoundError, ApiKeyAlreadyRevokedError } from '@sentinelmesh/api-key-management';
import { ServiceNotFoundError } from '@sentinelmesh/service-registration';
import { ServiceRegistrationService } from '../service-registration/service-registration.service';

/* ------------------------------------------------------------------ */
/*  Helper: a mock ServiceRegistrationService that resolves/throws    */
/* ------------------------------------------------------------------ */
interface MockServiceRegistration {
  getService: jest.Mock;
}

function mockServiceReg(knownIds: string[]): MockServiceRegistration {
  return {
    getService: jest.fn((id: string) => {
      if (knownIds.includes(id)) {
        return Promise.resolve({ id, name: 'test-service' });
      }
      return Promise.reject(new ServiceNotFoundError(id));
    }),
  };
}

/** Narrow nullable reference so we can assert without a non-null assertion. */
function mustExist<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error('Expected value to exist');
  }
  return value;
}

describe('ApiKeyManagementService', () => {
  let service: ApiKeyManagementService;
  let repo: InMemoryApiKeyRepository;
  let reg: ReturnType<typeof mockServiceReg>;

  beforeEach(() => {
    repo = new InMemoryApiKeyRepository();
    reg = mockServiceReg(['payment-api', 'auth-svc']);
    service = new ApiKeyManagementService(repo, reg as unknown as ServiceRegistrationService);
  });

  // ================================================================
  //  generateKey
  // ================================================================
  describe('generateKey', () => {
    it('should create a 64-char hex key for a known service', async () => {
      const result = await service.generateKey('payment-api');

      expect(result.rawKey).toHaveLength(64);
      expect(result.keyPrefix).toBe(result.rawKey.slice(-4));
      expect(result.id).toBeTruthy();
      expect(result.serviceId).toBe('payment-api');
      expect(result.status).toBe('active');
      expect(result.createdAt).toBeTruthy();
      // rawKey only here — toJSON of the stored entity must NOT have it
      const storedKey = mustExist(await repo.findById(result.id));
      expect(storedKey.keyHash).not.toBe(result.rawKey);
      // Verify the stored key's hash was computed correctly
      expect(storedKey.verify(result.rawKey)).toBe(true);
    });

    it('should throw ServiceNotFoundError for an unknown service', async () => {
      await expect(service.generateKey('unknown-svc')).rejects.toThrow(ServiceNotFoundError);
    });

    it('should generate unique keys on consecutive calls', async () => {
      const key1 = await service.generateKey('payment-api');
      const key2 = await service.generateKey('payment-api');

      expect(key1.rawKey).not.toBe(key2.rawKey);
      expect(key1.id).not.toBe(key2.id);
      expect(key1.keyPrefix).not.toBe(key2.keyPrefix);
    });
  });

  // ================================================================
  //  verifyKey
  // ================================================================
  describe('verifyKey', () => {
    it('should return true for a valid active key', async () => {
      const created = await service.generateKey('payment-api');

      const valid = await service.verifyKey('payment-api', created.rawKey);
      expect(valid).toBe(true);
    });

    it('should return false for an incorrect raw key', async () => {
      await service.generateKey('payment-api');

      const valid = await service.verifyKey('payment-api', 'f'.repeat(64));
      expect(valid).toBe(false);
    });

    it('should return false for a revoked key', async () => {
      const created = await service.generateKey('payment-api');
      await service.revokeKey(created.id);

      const valid = await service.verifyKey('payment-api', created.rawKey);
      expect(valid).toBe(false);
    });

    it('should return false when no keys exist for the service', async () => {
      const valid = await service.verifyKey('payment-api', 'a'.repeat(64));
      expect(valid).toBe(false);
    });
  });

  // ================================================================
  //  revokeKey
  // ================================================================
  describe('revokeKey', () => {
    it('should transition an active key to Revoked', async () => {
      const created = await service.generateKey('payment-api');
      const revoked = await service.revokeKey(created.id);

      expect(revoked.status).toBe('revoked');
      expect(revoked.revokedAt).toBeTruthy();
      expect(revoked.id).toBe(created.id);
      // repo must reflect the change
      const stored = mustExist(await repo.findById(created.id));
      expect(stored.status).toBe(ApiKeyStatus.Revoked);
    });

    it('should reject lookup of revoked keys', async () => {
      const created = await service.generateKey('payment-api');
      await service.revokeKey(created.id);

      const valid = await service.verifyKey('payment-api', created.rawKey);
      expect(valid).toBe(false);
    });

    it('should throw ApiKeyAlreadyRevokedError on double revoke', async () => {
      const created = await service.generateKey('payment-api');
      await service.revokeKey(created.id);

      await expect(service.revokeKey(created.id)).rejects.toThrow(ApiKeyAlreadyRevokedError);
    });

    it('should throw ApiKeyNotFoundError for a non-existent id', async () => {
      await expect(service.revokeKey('nonexistent-id')).rejects.toThrow(ApiKeyNotFoundError);
    });
  });

  // ================================================================
  //  rotateKey (atomically revoke + generate)
  // ================================================================
  describe('rotateKey', () => {
    it('should revoke the old key and return a brand-new key', async () => {
      const oldKey = await service.generateKey('auth-svc');
      const rotated = await service.rotateKey(oldKey.id);

      // New key returned
      expect(rotated.rawKey).toHaveLength(64);
      expect(rotated.serviceId).toBe('auth-svc');
      expect(rotated.status).toBe('active');
      // Old key must be revoked
      const old = mustExist(await repo.findById(oldKey.id));
      expect(old.status).toBe(ApiKeyStatus.Revoked);
      // Old key must not verify
      const oldValid = await service.verifyKey('auth-svc', oldKey.rawKey);
      expect(oldValid).toBe(false);
      // New key must verify
      const newValid = await service.verifyKey('auth-svc', rotated.rawKey);
      expect(newValid).toBe(true);
    });

    it('should throw ApiKeyNotFoundError for a non-existent id', async () => {
      await expect(service.rotateKey('nonexistent-id')).rejects.toThrow(ApiKeyNotFoundError);
    });

    it('should throw ApiKeyAlreadyRevokedError when rotating a revoked key', async () => {
      const key = await service.generateKey('auth-svc');
      await service.revokeKey(key.id);

      await expect(service.rotateKey(key.id)).rejects.toThrow(ApiKeyAlreadyRevokedError);
    });
  });

  // ================================================================
  //  listKeys
  // ================================================================
  describe('listKeys', () => {
    it('should return key metadata (id, prefix, status, createdAt)', async () => {
      const key1 = await service.generateKey('payment-api');
      const key2 = await service.generateKey('payment-api');
      await service.revokeKey(key2.id);

      const list = await service.listKeys('payment-api');

      expect(list).toHaveLength(2);
      const ids = [key1.id, key2.id];
      for (const item of list) {
        expect(ids).toContain(item['id']);
        expect(item['keyPrefix']).toBeTruthy();
        expect(item['serviceId']).toBe('payment-api');
        expect(['active', 'revoked']).toContain(item['status']);
        expect(item['createdAt']).toBeTruthy();
        // 🔒 rawKey must NEVER appear
        expect(item['rawKey']).toBeUndefined();
        // 🔒 keyHash must NEVER appear
        expect(item['keyHash']).toBeUndefined();
      }
    });

    it('should return an empty array when no keys exist', async () => {
      const list = await service.listKeys('auth-svc');

      expect(list).toEqual([]);
    });

    it('should return only keys for the requested service', async () => {
      await service.generateKey('payment-api');
      await service.generateKey('auth-svc');

      const list = await service.listKeys('payment-api');
      expect(list).toHaveLength(1);
      expect(mustExist(list[0])['serviceId']).toBe('payment-api');
    });
  });
});
