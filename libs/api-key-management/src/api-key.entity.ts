import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { ApiKeyStatus } from './api-key-status.enum';
import { ApiKeyAlreadyRevokedError } from './errors';

export interface CreateApiKeyParams {
  serviceId: string;
}

/**
 * Domain entity representing an API key for a registered service.
 *
 * The raw key is a 64-character hex string generated from 32 random bytes.
 * Only the SHA-256 hash is stored; the full raw key is transient and excluded
 * from serialisation (`toJSON`).
 */
export class ApiKey {
  public readonly id: string;
  public readonly serviceId: string;
  public readonly keyHash: string;
  public readonly keyPrefix: string;
  public readonly createdAt: Date;
  public readonly rawKey: string;

  private _status: ApiKeyStatus;
  private _revokedAt: Date | null;

  private constructor(rawKey: string, params: CreateApiKeyParams) {
    this.id = randomUUID();
    this.serviceId = params.serviceId;
    this.rawKey = rawKey;
    this.keyHash = ApiKey.computeHash(rawKey);
    this.keyPrefix = rawKey.slice(-4);
    this._status = ApiKeyStatus.Active;
    this.createdAt = new Date();
    this._revokedAt = null;
  }

  /** Factory method — generates a cryptographically random key and hashes it. */
  static create(params: CreateApiKeyParams): ApiKey {
    const rawKey = randomBytes(32).toString('hex');
    return new ApiKey(rawKey, params);
  }

  get status(): ApiKeyStatus {
    return this._status;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  /**
   * Hashes the given raw key with SHA-256 and compares it to this key's stored
   * hash. Returns true only when the hash matches AND the key is still active.
   */
  verify(rawKey: string): boolean {
    if (this._status !== ApiKeyStatus.Active) {
      return false;
    }
    return ApiKey.computeHash(rawKey) === this.keyHash;
  }

  /**
   * Transitions the key from Active to Revoked. Sets revokedAt to the current
   * timestamp. Throws if the key is already revoked.
   */
  revoke(): void {
    if (this._status === ApiKeyStatus.Revoked) {
      throw new ApiKeyAlreadyRevokedError(this.id);
    }
    this._status = ApiKeyStatus.Revoked;
    this._revokedAt = new Date();
  }

  /**
   * Serialisation helper — returns public metadata only.
   * The raw key and hash are NEVER exposed in serialised output.
   */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      id: this.id,
      serviceId: this.serviceId,
      keyPrefix: this.keyPrefix,
      status: this._status,
      createdAt: this.createdAt.toISOString(),
    };

    if (this._revokedAt !== null) {
      result['revokedAt'] = this._revokedAt.toISOString();
    }

    return result;
  }

  private static computeHash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
