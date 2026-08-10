import { InMemoryApiKeyRepository } from './in-memory-api-key.repository';
import { ApiKey, ApiKeyStatus } from '@sentinelmesh/api-key-management';

describe('InMemoryApiKeyRepository', () => {
  let repo: InMemoryApiKeyRepository;

  beforeEach(() => {
    repo = new InMemoryApiKeyRepository();
  });

  describe('save', () => {
    it('should persist a key and return it', async () => {
      const key = ApiKey.create({ serviceId: 'payment-api' });

      const saved = await repo.save(key);

      expect(saved).toBe(key);
      expect(saved.id).toBe(key.id);
      expect(saved.serviceId).toBe('payment-api');
      expect(saved.status).toBe(ApiKeyStatus.Active);
    });

    it('should make the key retrievable by id after save', async () => {
      const key = ApiKey.create({ serviceId: 'auth-service' });

      await repo.save(key);
      const found = await repo.findById(key.id);

      expect(found).toEqual(
        expect.objectContaining({
          id: key.id,
          serviceId: 'auth-service',
          keyHash: key.keyHash,
        }),
      );
    });

    it('should add to existing keys for the same serviceId', async () => {
      const key1 = ApiKey.create({ serviceId: 'payment-api' });
      const key2 = ApiKey.create({ serviceId: 'payment-api' });

      await repo.save(key1);
      await repo.save(key2);

      const keys = await repo.findByServiceId('payment-api');
      expect(keys).toHaveLength(2);
      expect(keys.map((k: ApiKey) => k.id).sort()).toEqual(
        [key1.id, key2.id].sort(),
      );
    });

    it('should overwrite an existing key with the same id', async () => {
      const key = ApiKey.create({ serviceId: 'order-api' });

      await repo.save(key);
      key.revoke();
      await repo.save(key);

      const found = await repo.findById(key.id);
      expect(found).toEqual(
        expect.objectContaining({
          status: ApiKeyStatus.Revoked,
        }),
      );
      if (found) {
        expect(found.revokedAt).not.toBeNull();
      } else {
        throw new Error('Expected key to be found after overwrite');
      }
    });
  });

  describe('findById', () => {
    it('should return null when no key matches the id', async () => {
      const result = await repo.findById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should return the correct key when multiple keys exist for different services', async () => {
      const keyA = ApiKey.create({ serviceId: 'svc-a' });
      const keyB = ApiKey.create({ serviceId: 'svc-b' });

      await repo.save(keyA);
      await repo.save(keyB);

      const found = await repo.findById(keyA.id);
      expect(found).toEqual(
        expect.objectContaining({ serviceId: 'svc-a' }),
      );
    });

    it('should find a key when multiple keys exist for the same service', async () => {
      const key1 = ApiKey.create({ serviceId: 'payment-api' });
      const key2 = ApiKey.create({ serviceId: 'payment-api' });

      await repo.save(key1);
      await repo.save(key2);

      const found = await repo.findById(key2.id);
      expect(found).toEqual(
        expect.objectContaining({
          id: key2.id,
          keyHash: key2.keyHash,
        }),
      );
    });
  });

  describe('findByServiceId', () => {
    it('should return an empty array when no keys exist for the service', async () => {
      const result = await repo.findByServiceId('unknown-service');

      expect(result).toEqual([]);
    });

    it('should return all keys for a specific service', async () => {
      const key1 = ApiKey.create({ serviceId: 'payment-api' });
      const key2 = ApiKey.create({ serviceId: 'payment-api' });

      await repo.save(key1);
      await repo.save(key2);

      const result = await repo.findByServiceId('payment-api');
      expect(result).toHaveLength(2);
      expect(result.map((k: ApiKey) => k.id).sort()).toEqual(
        [key1.id, key2.id].sort(),
      );
    });

    it('should return only keys for the requested service, not other services', async () => {
      const payKey = ApiKey.create({ serviceId: 'payment-api' });
      const authKey = ApiKey.create({ serviceId: 'auth-svc' });

      await repo.save(payKey);
      await repo.save(authKey);

      const result = await repo.findByServiceId('payment-api');
      expect(result).toHaveLength(1);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: payKey.id }),
        ]),
      );
    });
  });

  describe('findByHash', () => {
    it('should find a key by its hash', async () => {
      const key = ApiKey.create({ serviceId: 'payment-api' });

      await repo.save(key);
      const found = await repo.findByHash(key.keyHash);

      expect(found).toEqual(
        expect.objectContaining({
          id: key.id,
          keyHash: key.keyHash,
        }),
      );
    });

    it('should return null when no stored key has the given hash', async () => {
      const result = await repo.findByHash('non-existent-hash-value');

      expect(result).toBeNull();
    });

    it('should return null when keys exist but none match the hash', async () => {
      const key = ApiKey.create({ serviceId: 'payment-api' });

      await repo.save(key);
      const result = await repo.findByHash('different-hash-that-does-not-exist');

      expect(result).toBeNull();
    });

    it('should find a specific key by hash when multiple keys exist', async () => {
      const key1 = ApiKey.create({ serviceId: 'svc-a' });
      const key2 = ApiKey.create({ serviceId: 'svc-b' });

      await repo.save(key1);
      await repo.save(key2);

      const found = await repo.findByHash(key2.keyHash);
      expect(found).toEqual(
        expect.objectContaining({ id: key2.id }),
      );
    });

    it('should find a key across different services by hash', async () => {
      const payKey1 = ApiKey.create({ serviceId: 'payment-api' });
      const payKey2 = ApiKey.create({ serviceId: 'payment-api' });
      const authKey = ApiKey.create({ serviceId: 'auth-svc' });

      await repo.save(payKey1);
      await repo.save(payKey2);
      await repo.save(authKey);

      const found = await repo.findByHash(payKey2.keyHash);
      expect(found).toEqual(
        expect.objectContaining({ id: payKey2.id }),
      );
    });
  });
});
