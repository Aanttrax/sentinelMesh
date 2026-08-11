import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
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
  async ingest(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
    @Body() dto: IngestEventDto,
  ): Promise<void> {
    const eventId = randomUUID();

    const result = await this.eventIngestionService.ingestEvent(
      request.serviceId,
      eventId,
      dto,
    );

    const status =
      result.eventId !== eventId ? HttpStatus.OK : HttpStatus.ACCEPTED;
    res.status(status).json(result);
  }
}
