import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ApiKeyAuthGuard, type AuthenticatedRequest } from './guards/api-key-auth.guard';
import { EventIngestionService } from './event-ingestion.service';
import { IngestEventDto } from './dto/ingest-event.dto';

/**
 * Accepts authenticated HTTP event metadata from monitored services.
 *
 * Auth: {@link ApiKeyAuthGuard} validates the `X-Service-Id` + `Bearer` key
 * and attaches `serviceId` to the request before any route handler runs.
 */
@Controller('events')
@UseGuards(ApiKeyAuthGuard)
export class EventIngestionController {
  constructor(private readonly eventIngestionService: EventIngestionService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async ingest(
    @Req() request: AuthenticatedRequest,
    @Body() dto: IngestEventDto,
  ): Promise<{ eventId: string; status: string }> {
    const eventId = randomUUID();

    return this.eventIngestionService.ingestEvent(
      request.serviceId,
      eventId,
      dto,
    );
  }
}
