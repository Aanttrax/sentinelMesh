import { Module } from '@nestjs/common';
import { ServiceRegistrationModule } from './service-registration/service-registration.module';
import { ApiKeyManagementModule } from './api-key-management/api-key-management.module';
import { EventIngestionModule } from './event-ingestion/event-ingestion.module';

@Module({
  imports: [
    ServiceRegistrationModule,
    ApiKeyManagementModule,
    EventIngestionModule,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
