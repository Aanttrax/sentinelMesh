import type { Service } from './service.entity';

/** Token for NestJS dependency injection — defined here so the domain stays framework-free. */
export const SERVICE_REPOSITORY = Symbol('SERVICE_REPOSITORY');

/** Repository port: defines WHAT persistence the domain needs, not HOW. */
export interface ServiceRepository {
  save(service: Service): Promise<Service>;
  findById(id: string): Promise<Service | null>;
  findByName(name: string): Promise<Service | null>;
  findAll(): Promise<Service[]>;
}
