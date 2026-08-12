export { UnauthorizedEventError, ServiceNotAcceptingEventsError, RateLimitExceededError } from './errors';
export { EventRepository, EVENT_REPOSITORY } from './event.repository';

/** Unique identifier for a registered service. */
export type ServiceId = string;

/** Unique key for event idempotency. */
export type IdempotencyKey = string;

/** Severity level for threats. */
export enum ThreatSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/** Processing status for an event in the async pipeline. */
export type EventStatus = 'pending' | 'processing' | 'processed' | 'failed';

/** Core HTTP event ingested from a monitored API. */
export interface HttpEvent {
  eventId: string;
  serviceId: ServiceId;
  idempotencyKey: IdempotencyKey;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: Date;
  ipAddress?: string;
  /** Tracks where the event is in the async processing pipeline. Defaults to `'pending'`. */
  status: EventStatus;
}
