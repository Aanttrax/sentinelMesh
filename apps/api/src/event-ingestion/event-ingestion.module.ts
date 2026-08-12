import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { EventIngestionService } from './event-ingestion.service';
import { EventIngestionController } from './event-ingestion.controller';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { InMemoryEventRepository } from '../infrastructure/in-memory-event.repository';
import { EVENT_REPOSITORY } from '@sentinelmesh/event-schema';
import { EVENT_PROCESSING_QUEUE } from './queue.constants';
import { ApiKeyManagementModule } from '../api-key-management/api-key-management.module';
import { ServiceRegistrationModule } from '../service-registration/service-registration.module';

/**
 * NestJS module wiring for the Event Ingestion feature (M2/M3).
 *
 * Imports {@link ApiKeyManagementModule} for `verifyKey()` and
 * {@link ServiceRegistrationModule} for `getService()` / `canAcceptEvents()`.
 * Provides a BullMQ {@link Queue} via the {@link EVENT_PROCESSING_QUEUE} token.
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
    {
      provide: EVENT_PROCESSING_QUEUE,
      useFactory: () => {
        const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
        return new Queue('event-processing', {
          connection: new IORedis(redisUrl, { maxRetriesPerRequest: null }),
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
          },
        });
      },
    },
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class EventIngestionModule {}
