import type { ApiKey } from './api-key.entity';

/** Token for NestJS dependency injection — defined here so the domain stays framework-free. */
export const API_KEY_REPOSITORY = Symbol('API_KEY_REPOSITORY');

/** Repository port: defines WHAT persistence the domain needs, not HOW. */
export interface ApiKeyRepository {
  save(key: ApiKey): Promise<ApiKey>;
  findById(id: string): Promise<ApiKey | null>;
  findByServiceId(serviceId: string): Promise<ApiKey[]>;
  findByHash(keyHash: string): Promise<ApiKey | null>;
}
