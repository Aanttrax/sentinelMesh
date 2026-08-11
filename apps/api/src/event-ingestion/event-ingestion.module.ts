import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventIngestionService } from './event-ingestion.service';
import { EventIngestionController } from './event-ingestion.controller';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { InMemoryEventRepository } from '../infrastructure/in-memory-event.repository';
import { EVENT_REPOSITORY } from '@sentinelmesh/event-schema';
import { ApiKeyManagementModule } from '../api-key-management/api-key-management.module';
import { ServiceRegistrationModule } from '../service-registration/service-registration.module';

/**
 * NestJS module wiring for the Event Ingestion feature (M2).
 *
 * Imports {@link ApiKeyManagementModule} for `verifyKey()` and
 * {@link ServiceRegistrationModule} for `getService()` / `canAcceptEvents()`.
 */
@Module({
  imports: [
    ApiKeyManagementModule,
    ServiceRegistrationModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
  ],
  controllers: [EventIngestionController],
  providers: [
    EventIngestionService,
    ApiKeyAuthGuard,
    RateLimitGuard,
    {
      provide: EVENT_REPOSITORY,
      useClass: InMemoryEventRepository,
    },
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class EventIngestionModule {}
