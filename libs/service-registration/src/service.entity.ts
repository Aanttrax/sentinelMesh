import { randomUUID } from 'node:crypto';
import { ServiceStatus } from './service-status.enum';
import { ServiceAlreadyDisabledError, ValidationError } from './errors';

export interface CreateServiceParams {
  name: string;
  environment: string;
  version: string;
}

export class Service {
  public readonly id: string;
  public readonly name: string;
  public readonly environment: string;
  public readonly version: string;
  public readonly createdAt: Date;

  private _status: ServiceStatus;

  private constructor(params: CreateServiceParams) {
    this.validate(params);
    this.id = randomUUID();
    this.name = params.name.trim();
    this.environment = params.environment.trim();
    this.version = params.version.trim();
    this._status = ServiceStatus.Active;
    this.createdAt = new Date();
  }

  /** Factory method — creates a new active service with a UUIDv4 identifier. */
  static create(params: CreateServiceParams): Service {
    return new Service(params);
  }

  get status(): ServiceStatus {
    return this._status;
  }

  /**
   * Returns true when the service can accept events.
   * Domain rule: only active services accept events.
   */
  canAcceptEvents(): boolean {
    return this._status === ServiceStatus.Active;
  }

  /** Transition from active to disabled. Throws if already disabled. */
  disable(): void {
    if (this._status === ServiceStatus.Disabled) {
      throw new ServiceAlreadyDisabledError(this.id);
    }
    this._status = ServiceStatus.Disabled;
  }

  private validate(params: CreateServiceParams): void {
    if (!params.name || params.name.trim().length === 0) {
      throw new ValidationError('name is required');
    }
    if (!params.environment || params.environment.trim().length === 0) {
      throw new ValidationError('environment is required');
    }
    if (!params.version || params.version.trim().length === 0) {
      throw new ValidationError('version is required');
    }
    if (!isValidSemver(params.version.trim())) {
      throw new ValidationError('version must be valid semver');
    }
  }
}

/**
 * Validates semver format per semver.org spec 2.0.0.
 * Accepts: MAJOR.MINOR.PATCH[-prerelease][+build]
 */
function isValidSemver(version: string): boolean {
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][\da-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][\da-zA-Z-]*))*))?(?:\+([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}
