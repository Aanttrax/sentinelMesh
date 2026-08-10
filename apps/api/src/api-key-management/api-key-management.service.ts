import { Injectable, Inject } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { ApiKey, ApiKeyRepository, API_KEY_REPOSITORY, ApiKeyNotFoundError } from '@sentinelmesh/api-key-management';
import { ServiceRegistrationService } from '../service-registration/service-registration.service';
import { CreateKeyResponseDto } from './dto/create-key-response.dto';
import { RevokeKeyResponseDto } from './dto/revoke-key-response.dto';

/**
 * Domain service that orchestrates the full API key lifecycle.
 *
 * {@link verifyKey} is a domain method (not an HTTP endpoint) designed to be
 * called by the M2 AuthGuard.
 */
@Injectable()
export class ApiKeyManagementService {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly repository: ApiKeyRepository,
    private readonly serviceRegistration: ServiceRegistrationService,
  ) {}

  /** Generate a cryptographically random key for a registered service. */
  async generateKey(serviceId: string): Promise<CreateKeyResponseDto> {
    // Validate service existence — throws ServiceNotFoundError if unknown
    await this.serviceRegistration.getService(serviceId);

    const apiKey = ApiKey.create({ serviceId });
    await this.repository.save(apiKey);

    return {
      id: apiKey.id,
      serviceId: apiKey.serviceId,
      keyPrefix: apiKey.keyPrefix,
      status: apiKey.status,
      createdAt: apiKey.createdAt.toISOString(),
      rawKey: apiKey.rawKey,
    };
  }

  /**
   * Verify whether a raw key is valid for a service.
   *
   * Hashes the raw key with SHA-256, looks it up via the repository, then
   * checks the key is active and belongs to the claimed service.
   */
  async verifyKey(serviceId: string, rawKey: string): Promise<boolean> {
    const hash = createHash('sha256').update(rawKey).digest('hex');

    const key = await this.repository.findByHash(hash);
    if (!key) {
      return false;
    }

    return key.verify(rawKey) && key.serviceId === serviceId;
  }

  /** Revoke an active API key by its id. */
  async revokeKey(keyId: string): Promise<RevokeKeyResponseDto> {
    const key = await this.repository.findById(keyId);
    if (!key) {
      throw new ApiKeyNotFoundError(keyId);
    }

    key.revoke(); // throws ApiKeyAlreadyRevokedError if already revoked
    await this.repository.save(key);

    return {
      id: key.id,
      serviceId: key.serviceId,
      keyPrefix: key.keyPrefix,
      status: key.status,
      createdAt: key.createdAt.toISOString(),
      revokedAt: key.revokedAt ? key.revokedAt.toISOString() : new Date().toISOString(),
    };
  }

  /** Atomically rotate a key — revoke the old one and generate a new one. */
  async rotateKey(keyId: string): Promise<CreateKeyResponseDto> {
    const oldKey = await this.repository.findById(keyId);
    if (!oldKey) {
      throw new ApiKeyNotFoundError(keyId);
    }

    oldKey.revoke(); // throws ApiKeyAlreadyRevokedError if already revoked
    await this.repository.save(oldKey);

    const newKey = ApiKey.create({ serviceId: oldKey.serviceId });
    await this.repository.save(newKey);

    return {
      id: newKey.id,
      serviceId: newKey.serviceId,
      keyPrefix: newKey.keyPrefix,
      status: newKey.status,
      createdAt: newKey.createdAt.toISOString(),
      rawKey: newKey.rawKey,
    };
  }

  /** List key metadata for a service — never exposes raw keys or hashes. */
  async listKeys(serviceId: string): Promise<Record<string, unknown>[]> {
    const keys = await this.repository.findByServiceId(serviceId);
    return keys.map((k) => k.toJSON());
  }
}
