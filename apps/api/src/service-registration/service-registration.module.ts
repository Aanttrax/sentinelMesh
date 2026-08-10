import { Module } from '@nestjs/common';
import { ServiceRegistrationService } from './service-registration.service';
import { InMemoryServiceRepository } from '../infrastructure/in-memory-service.repository';
import { SERVICE_REPOSITORY } from '@sentinelmesh/service-registration';

@Module({
  providers: [
    ServiceRegistrationService,
    {
      provide: SERVICE_REPOSITORY,
      useClass: InMemoryServiceRepository,
    },
  ],
  exports: [ServiceRegistrationService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ServiceRegistrationModule {}
