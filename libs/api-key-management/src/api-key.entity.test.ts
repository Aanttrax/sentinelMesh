import { ApiKey } from './api-key.entity';
import { ApiKeyStatus } from './api-key-status.enum';
import { ApiKeyAlreadyRevokedError } from './errors';

describe('ApiKey', () => {
  describe('create', () => {
    it('should create a key with the given serviceId', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      expect(apiKey.serviceId).toBe('payment-api');
      expect(apiKey.status).toBe(ApiKeyStatus.Active);
    });

    it('should generate a non-empty UUIDv4 identifier', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      expect(apiKey.id).toBeTruthy();
      expect(typeof apiKey.id).toBe('string');
      expect(apiKey.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs for different keys', () => {
      const a = ApiKey.create({ serviceId: 'svc-a' });
      const b = ApiKey.create({ serviceId: 'svc-b' });

      expect(a.id).not.toBe(b.id);
    });

    it('should generate a 64-character hex raw key', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      expect(apiKey.rawKey).toHaveLength(64);
      expect(apiKey.rawKey).toMatch(/^[0-9a-f]{64}$/i);
    });

    it('should store a 4-character hex prefix from the end of rawKey', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      expect(apiKey.keyPrefix).toHaveLength(4);
      expect(apiKey.keyPrefix).toMatch(/^[0-9a-f]{4}$/i);
      // prefix must be the last 4 hex chars of rawKey
      expect(apiKey.rawKey.slice(-4).toLowerCase()).toBe(apiKey.keyPrefix.toLowerCase());
    });

    it('should store a SHA-256 hash of the rawKey', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      // SHA-256 hex is 64 characters
      expect(apiKey.keyHash).toHaveLength(64);
      expect(apiKey.keyHash).toMatch(/^[0-9a-f]{64}$/i);
    });

    it('should set createdAt to the current timestamp', () => {
      const before = new Date();
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });
      const after = new Date();

      expect(apiKey.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(apiKey.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should default status to Active', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      expect(apiKey.status).toBe(ApiKeyStatus.Active);
    });

    it('should generate a hash that matches verify() for the correct rawKey', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      expect(apiKey.verify(apiKey.rawKey)).toBe(true);
    });

    it('should produce a hash that rejects a wrong rawKey', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      expect(apiKey.verify('wrong-key-value')).toBe(false);
    });

    it('should produce unique rawKeys across multiple creations', () => {
      const a = ApiKey.create({ serviceId: 'svc-a' });
      const b = ApiKey.create({ serviceId: 'svc-b' });

      expect(a.rawKey).not.toBe(b.rawKey);
    });
  });

  describe('verify', () => {
    it('should return true for the correct rawKey', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      expect(apiKey.verify(apiKey.rawKey)).toBe(true);
    });

    it('should return false for a tampered rawKey (one char changed)', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });
      // flip the first character
      const firstChar = apiKey.rawKey.startsWith('a') ? 'b' : 'a';
      const tamperedKey = firstChar + apiKey.rawKey.slice(1);

      expect(apiKey.verify(tamperedKey)).toBe(false);
    });

    it('should return false for an empty rawKey', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      expect(apiKey.verify('')).toBe(false);
    });

    it('should return false for a short random hex string', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      expect(apiKey.verify('deadbeef')).toBe(false);
    });

    it('should return false after the key is revoked', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });
      apiKey.revoke();

      expect(apiKey.verify(apiKey.rawKey)).toBe(false);
    });
  });

  describe('revoke', () => {
    it('should transition status from Active to Revoked', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });

      apiKey.revoke();

      expect(apiKey.status).toBe(ApiKeyStatus.Revoked);
    });

    it('should set revokedAt to the current timestamp', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });
      const before = new Date();
      apiKey.revoke();
      const after = new Date();

      const revokedAt = apiKey.revokedAt;
      if (revokedAt === null) {
        throw new Error('Expected revokedAt to be set');
      }
      expect(revokedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(revokedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw ApiKeyAlreadyRevokedError when already revoked', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });
      apiKey.revoke();

      expect(() => {
        apiKey.revoke();
      }).toThrow(ApiKeyAlreadyRevokedError);
    });

    it('should include the key id in the revoke-once error message', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });
      apiKey.revoke();

      try {
        apiKey.revoke();
        fail('Expected ApiKeyAlreadyRevokedError to be thrown');
      } catch (error) {
        expect((error as Error).message).toContain(apiKey.id);
      }
    });
  });

  describe('toJSON', () => {
    it('should include id, serviceId, keyPrefix, status, and createdAt', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });
      const json = apiKey.toJSON();

      expect(json['id']).toBe(apiKey.id);
      expect(json['serviceId']).toBe('payment-api');
      expect(json['keyPrefix']).toBe(apiKey.keyPrefix);
      expect(json['status']).toBe(ApiKeyStatus.Active);
      expect(json['createdAt']).toBe(apiKey.createdAt.toISOString());
    });

    it('should NOT include rawKey', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });
      const json = apiKey.toJSON();

      expect(json['rawKey']).toBeUndefined();
    });

    it('should NOT include keyHash', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });
      const json = apiKey.toJSON();

      expect(json['keyHash']).toBeUndefined();
    });

    it('should include revokedAt when the key is revoked', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });
      apiKey.revoke();
      const json = apiKey.toJSON();

      expect(json['status']).toBe(ApiKeyStatus.Revoked);
      const revokedAt = apiKey.revokedAt;
      if (revokedAt === null) {
        throw new Error('Expected revokedAt to be set');
      }
      expect(json['revokedAt']).toBe(revokedAt.toISOString());
    });

    it('should NOT include revokedAt when the key is active', () => {
      const apiKey = ApiKey.create({ serviceId: 'payment-api' });
      const json = apiKey.toJSON();

      expect(json['revokedAt']).toBeUndefined();
    });
  });
});
