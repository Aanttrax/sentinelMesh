import { Injectable, Inject } from '@nestjs/common';
import { EventRepository, EVENT_REPOSITORY, ServiceNotAcceptingEventsError } from '@sentinelmesh/event-schema';
import { ServiceRegistrationService } from '../service-registration/service-registration.service';
import type { IngestEventDto } from './dto/ingest-event.dto';
import type { HttpEvent } from '@sentinelmesh/event-schema';

/**
 * Orchestrates HTTP event ingestion: validates service state, enriches the
 * DTO into a full {@link HttpEvent}, and persists it via the repository port.
 *
 * The controller generates the {@link eventId} (design ADR — REQ-EVT-002)
 * and passes it here so the service remains pure orchestration.
 */
@Injectable()
export class EventIngestionService {
  constructor(
    private readonly serviceRegistration: ServiceRegistrationService,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
  ) {}

  async ingestEvent(
    serviceId: string,
    eventId: string,
    dto: IngestEventDto,
  ): Promise<{ eventId: string; status: string }> {
    const service = await this.serviceRegistration.getService(serviceId);

    if (!service.canAcceptEvents()) {
      throw new ServiceNotAcceptingEventsError(serviceId);
    }

    const event: HttpEvent = {
      serviceId,
      idempotencyKey: dto.idempotencyKey ?? eventId,
      method: dto.method,
      path: dto.path,
      statusCode: dto.statusCode,
      durationMs: dto.durationMs,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      ipAddress: dto.ipAddress,
    };

    await this.eventRepository.save(event);

    return { eventId, status: 'accepted' };
  }
}
