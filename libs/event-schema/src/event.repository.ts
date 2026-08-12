import type { HttpEvent } from './index';

/** Token for NestJS dependency injection — defined here so the domain stays framework-free. */
export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');

/** Repository port: defines WHAT persistence the domain needs, not HOW. */
export interface EventRepository {
  save(event: HttpEvent): Promise<HttpEvent>;
  findByIdempotencyKey(serviceId: string, key: string): Promise<HttpEvent | null>;
  updateStatus(eventId: string, status: string): Promise<void>;
}
