export { UnauthorizedEventError, ServiceNotAcceptingEventsError } from './errors';
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
}
